from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import json
import os
import openai
from typing import List, Dict, Any
from math import radians, sin, cos, sqrt, asin

# Set up OpenAI client
openai.api_key = os.getenv('OPENAI_API_KEY')

default_args = {
    'owner': 'trippy',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

# Creates an Airflow workflow that runs automatically every 12 hours
dag = DAG(
    'itinerary_intelligence',
    default_args=default_args,
    description='Generate logistics and availability intelligence for trip itinerary planning',
    schedule=timedelta(hours=12),  # Run every 12 hours
    start_date=datetime(2024, 10, 1),
    catchup=False,
    tags=['analytics', 'itinerary-intelligence', 'chatbot', 'logistics'],
)

def get_last_run_timestamp(**context):
    """Get timestamp of last successful pipeline run for incremental processing"""

    pg_hook = PostgresHook(postgres_conn_id='trippy_db')

    # Create watermark table if it doesn't exist (shared with other pipelines)
    create_watermark_table = """
    CREATE TABLE IF NOT EXISTS pipeline_watermarks (
        pipeline_name VARCHAR(100) PRIMARY KEY,
        last_run_timestamp TIMESTAMP NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """
    pg_hook.run(create_watermark_table)

    # Get last run timestamp for this pipeline
    result = pg_hook.get_first("""
        SELECT last_run_timestamp
        FROM pipeline_watermarks
        WHERE pipeline_name = 'itinerary_intelligence'
    """)

    # Determine if this is a full refresh day (every Monday for distance matrix)
    execution_date = context['execution_date']
    is_full_refresh = execution_date.weekday() == 0  # 0 = Monday

    # Check if itinerary_distance_matrix table exists and has data
    # If empty, force full refresh (auto-recovery mechanism)
    dm_table_count = pg_hook.get_first("""
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_name = 'itinerary_distance_matrix'
    """)

    if dm_table_count and dm_table_count[0] > 0:
        # Table exists, check if it has data
        dm_count = pg_hook.get_first("SELECT COUNT(*) FROM itinerary_distance_matrix")
        if dm_count and dm_count[0] == 0:
            print("WARNING: itinerary_distance_matrix table is empty. Forcing full refresh for recovery.")
            is_full_refresh = True

    # If it's Monday or no previous run, do full refresh (return very old date)
    if is_full_refresh or not result:
        last_run = datetime(2024, 1, 1)
        refresh_type = "FULL_REFRESH"
    else:
        last_run = result[0]
        refresh_type = "INCREMENTAL"

    print(f"Pipeline mode: {refresh_type}")
    print(f"Processing data since: {last_run}")

    return {
        'last_run_timestamp': last_run.isoformat(),
        'is_full_refresh': is_full_refresh
    }

def extract_active_experiences(**context):
    """Extract active experiences with valid coordinates for distance calculation"""

    pg_hook = PostgresHook(postgres_conn_id='trippy_db')

    # Get watermark data
    watermark_data = context['ti'].xcom_pull(task_ids='get_last_run_timestamp')
    last_run = watermark_data['last_run_timestamp']
    is_full_refresh = watermark_data['is_full_refresh']

    # Extract active experiences with coordinates
    experiences_query = f"""
    SELECT
        e.experience_id,
        e.title,
        e.location,
        e.latitude,
        e.longitude,
        e.country,
        e.category,
        e.duration,
        e.price,
        e.average_rating,
        e.updated_at
    FROM experiences e
    WHERE e.status = 'ACTIVE'
        AND e.latitude IS NOT NULL
        AND e.longitude IS NOT NULL
        AND e.country IS NOT NULL
    {f"AND e.updated_at > '{last_run}'" if not is_full_refresh else ""}
    ORDER BY e.experience_id
    """

    experiences_df = pd.read_sql(experiences_query, pg_hook.get_sqlalchemy_engine())

    print(f"Extracted {len(experiences_df)} active experiences with coordinates")
    print(f"Countries covered: {experiences_df['country'].nunique()}")

    return {
        'experiences_data': experiences_df.to_json(orient='records'),
        'is_full_refresh': is_full_refresh
    }

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate great circle distance between two points using Haversine formula"""

    # Convert to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))

    # Radius of earth in kilometers
    r = 6371

    return c * r

def calculate_distance_matrix(**context):
    """Calculate distance matrix between all experience pairs with filters"""

    # Get experiences data
    experiences_data = context['ti'].xcom_pull(task_ids='extract_active_experiences')
    experiences_df = pd.read_json(experiences_data['experiences_data'])
    is_full_refresh = experiences_data['is_full_refresh']

    if len(experiences_df) == 0:
        print("No experiences to process for distance matrix")
        return json.dumps([])

    print(f"Calculating distance matrix for {len(experiences_df)} experiences")

    distance_pairs = []

    # Calculate pairwise distances
    for i, exp1 in experiences_df.iterrows():
        for j, exp2 in experiences_df.iterrows():
            # Skip same experience
            if exp1['experience_id'] == exp2['experience_id']:
                continue

            # Filter: Same country only
            if exp1['country'] != exp2['country']:
                continue

            # Calculate distance
            distance = haversine_distance(
                exp1['latitude'], exp1['longitude'],
                exp2['latitude'], exp2['longitude']
            )

            # Filter: Distance <= 200km
            if distance > 200:
                continue

            # Store the pair
            distance_pairs.append({
                'origin_experience_id': int(exp1['experience_id']),
                'destination_experience_id': int(exp2['experience_id']),
                'distance_km': round(distance, 2),
                'country': exp1['country'],
                'origin_title': exp1['title'],
                'destination_title': exp2['title'],
                'origin_location': exp1['location'],
                'destination_location': exp2['location']
            })

    print(f"Generated {len(distance_pairs)} distance pairs (filtered by same country + ≤200km)")

    # Calculate compression ratio
    total_possible_pairs = len(experiences_df) * (len(experiences_df) - 1)
    if total_possible_pairs > 0:
        compression_ratio = (1 - len(distance_pairs) / total_possible_pairs) * 100
        print(f"Distance matrix compression: {compression_ratio:.1f}% reduction from {total_possible_pairs} possible pairs")

    return {
        'distance_pairs': json.dumps(distance_pairs),
        'is_full_refresh': is_full_refresh
    }

def extract_schedule_availability(**context):
    """Extract schedule availability for next 90 days"""

    pg_hook = PostgresHook(postgres_conn_id='trippy_db')

    # Always extract next 90 days (real-time availability is priority)
    availability_query = """
    SELECT
        es.experience_id,
        DATE(es.start_date_time) as schedule_date,
        COUNT(*) as available_schedules_count,
        SUM(es.available_spots) as total_spots,
        COUNT(b.booking_id) as confirmed_bookings,
        SUM(b.number_of_participants) as total_participants_booked
    FROM experience_schedule es
    LEFT JOIN booking b ON es.schedule_id = b.experience_schedule_id
        AND b.status = 'CONFIRMED'
    WHERE es.start_date_time >= CURRENT_DATE
        AND es.start_date_time <= CURRENT_DATE + INTERVAL '90 days'
        AND es.cancelled = FALSE
        AND es.is_available = TRUE
    GROUP BY es.experience_id, DATE(es.start_date_time)
    ORDER BY es.experience_id, schedule_date
    """

    availability_df = pd.read_sql(availability_query, pg_hook.get_sqlalchemy_engine())

    # Calculate booking pressure (demand vs supply)
    if len(availability_df) > 0:
        availability_df['total_participants_booked'] = availability_df['total_participants_booked'].fillna(0)
        availability_df['booking_pressure'] = (
            availability_df['total_participants_booked'] /
            availability_df['total_spots'].replace(0, 1)  # Avoid division by zero
        ) * 100
        availability_df['booking_pressure'] = availability_df['booking_pressure'].round(2)

        # Convert schedule_date to string format to avoid JSON serialization issues
        availability_df['schedule_date'] = availability_df['schedule_date'].astype(str)

    print(f"Extracted availability data for {len(availability_df)} (experience_id, date) combinations")
    print(f"Date range: next 90 days from {datetime.now().date()}")

    return availability_df.to_json(orient='records')

def create_logistics_documents(**context):
    """Create RAG-ready logistics documents for experience pairs"""

    # Get distance matrix data
    distance_data = context['ti'].xcom_pull(task_ids='calculate_distance_matrix')
    distance_pairs = json.loads(distance_data['distance_pairs'])

    if len(distance_pairs) == 0:
        print("No distance pairs to create logistics documents")
        return json.dumps([])

    logistics_documents = []

    for pair in distance_pairs:
        # Determine if experiences are in same location (within 5km)
        is_same_location = pair['distance_km'] <= 5.0

        # Build logistics description
        if is_same_location:
            proximity_desc = "These experiences are in the same location area (within 5km)"
            itinerary_suitability = "Excellent for same-day itinerary with minimal travel time"
        elif pair['distance_km'] <= 20:
            proximity_desc = f"These experiences are nearby, {pair['distance_km']}km apart"
            itinerary_suitability = "Good for same-day itinerary with short travel time"
        elif pair['distance_km'] <= 50:
            proximity_desc = f"These experiences are moderately close, {pair['distance_km']}km apart"
            itinerary_suitability = "Suitable for same-day itinerary if scheduled with buffer time"
        elif pair['distance_km'] <= 100:
            proximity_desc = f"These experiences are {pair['distance_km']}km apart"
            itinerary_suitability = "Can be combined in a single day with significant travel time"
        else:
            proximity_desc = f"These experiences are far apart, {pair['distance_km']}km apart"
            itinerary_suitability = "Better suited for multi-day itinerary or separate day trips"

        # Build document content
        content_text = f"""
        Experience Pair: {pair['origin_title']} to {pair['destination_title']}

        Locations:
        - Origin: {pair['origin_location']}, {pair['country']}
        - Destination: {pair['destination_location']}, {pair['country']}

        Distance: {pair['distance_km']}km (straight-line distance)

        Logistics:
        {proximity_desc}
        Same location: {'Yes' if is_same_location else 'No'}
        Country: {pair['country']}

        Itinerary Planning:
        {itinerary_suitability}
        """

        # Create metadata
        metadata = {
            'origin_experience_id': pair['origin_experience_id'],
            'destination_experience_id': pair['destination_experience_id'],
            'distance_km': pair['distance_km'],
            'country': pair['country'],
            'is_same_location': is_same_location,
            'proximity_category': 'same_location' if is_same_location
                                 else 'nearby' if pair['distance_km'] <= 20
                                 else 'moderate' if pair['distance_km'] <= 50
                                 else 'far'
        }

        logistics_documents.append({
            'document_id': f"logistics_{pair['origin_experience_id']}_{pair['destination_experience_id']}",
            'document_type': 'itinerary_logistics',
            'title': f"{pair['origin_title']} → {pair['destination_title']}",
            'content_text': content_text.strip(),
            'metadata': metadata,
            'relevance_score': 100 - (pair['distance_km'] / 2)  # Closer = more relevant
        })

    print(f"Created {len(logistics_documents)} logistics documents")

    return json.dumps(logistics_documents)

def generate_embeddings(**context):
    """Generate OpenAI embeddings for logistics documents"""

    # Get logistics documents
    documents_json = context['ti'].xcom_pull(task_ids='create_logistics_documents')
    documents = json.loads(documents_json)

    if len(documents) == 0:
        print("No documents to generate embeddings for")
        return json.dumps([])

    if not os.getenv('OPENAI_API_KEY'):
        raise ValueError("OPENAI_API_KEY environment variable is required for embedding generation")

    print(f"Generating embeddings for {len(documents)} logistics documents")

    # Process documents in batches to avoid API rate limits
    batch_size = 100  # OpenAI recommended batch size
    embedded_documents = []

    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]

        try:
            # Extract content texts for embedding
            texts = [doc['content_text'] for doc in batch]

            # Generate embeddings using OpenAI
            response = openai.embeddings.create(
                input=texts,
                model="text-embedding-3-small"  # Cost-effective model
            )

            # Add embeddings to documents
            for j, doc in enumerate(batch):
                doc['embedding'] = response.data[j].embedding
                embedded_documents.append(doc)

            print(f"Generated embeddings for batch {i//batch_size + 1}/{(len(documents) + batch_size - 1)//batch_size}")

        except Exception as e:
            print(f"Error generating embeddings for batch {i//batch_size + 1}: {str(e)}")
            # Continue with other batches, log the error
            continue

    print(f"Successfully generated embeddings for {len(embedded_documents)} documents")
    return json.dumps(embedded_documents)

def store_itinerary_intelligence(**context):
    """Store distance matrix, availability index, and logistics documents"""

    pg_hook = PostgresHook(postgres_conn_id='trippy_db')

    # Get data from previous tasks
    distance_data = context['ti'].xcom_pull(task_ids='calculate_distance_matrix')
    availability_json = context['ti'].xcom_pull(task_ids='extract_schedule_availability')
    logistics_json = context['ti'].xcom_pull(task_ids='generate_embeddings')

    is_full_refresh = distance_data['is_full_refresh']

    # Create tables if they don't exist
    create_tables_sql = """
    -- Enable pgvector extension (for embeddings)
    CREATE EXTENSION IF NOT EXISTS vector;

    -- Distance matrix table
    CREATE TABLE IF NOT EXISTS itinerary_distance_matrix (
        origin_experience_id BIGINT,
        destination_experience_id BIGINT,
        distance_km DECIMAL(10, 2) NOT NULL,
        country VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (origin_experience_id, destination_experience_id)
    );

    -- Availability index table
    CREATE TABLE IF NOT EXISTS itinerary_availability_index (
        experience_id BIGINT,
        schedule_date DATE,
        available_schedules_count INTEGER NOT NULL,
        total_spots INTEGER NOT NULL,
        booking_pressure DECIMAL(5, 2),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (experience_id, schedule_date)
    );

    -- Create indexes for efficient querying
    CREATE INDEX IF NOT EXISTS idx_distance_matrix_origin
        ON itinerary_distance_matrix(origin_experience_id);
    CREATE INDEX IF NOT EXISTS idx_distance_matrix_destination
        ON itinerary_distance_matrix(destination_experience_id);
    CREATE INDEX IF NOT EXISTS idx_distance_matrix_country
        ON itinerary_distance_matrix(country);
    CREATE INDEX IF NOT EXISTS idx_distance_matrix_distance
        ON itinerary_distance_matrix(distance_km);

    CREATE INDEX IF NOT EXISTS idx_availability_experience
        ON itinerary_availability_index(experience_id);
    CREATE INDEX IF NOT EXISTS idx_availability_date
        ON itinerary_availability_index(schedule_date);
    CREATE INDEX IF NOT EXISTS idx_availability_date_range
        ON itinerary_availability_index(schedule_date, experience_id);
    """

    pg_hook.run(create_tables_sql)

    # Store distance matrix (only on full refresh - weekly)
    if is_full_refresh:
        print("Full refresh: Clearing and rebuilding distance matrix")
        pg_hook.run("DELETE FROM itinerary_distance_matrix")

        distance_pairs = json.loads(distance_data['distance_pairs'])

        for pair in distance_pairs:
            insert_distance_sql = """
            INSERT INTO itinerary_distance_matrix
                (origin_experience_id, destination_experience_id, distance_km, country, updated_at)
            VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (origin_experience_id, destination_experience_id)
            DO UPDATE SET
                distance_km = EXCLUDED.distance_km,
                country = EXCLUDED.country,
                updated_at = CURRENT_TIMESTAMP
            """

            pg_hook.run(insert_distance_sql, parameters=[
                pair['origin_experience_id'],
                pair['destination_experience_id'],
                pair['distance_km'],
                pair['country']
            ])

        print(f"Stored {len(distance_pairs)} distance pairs in matrix")
    else:
        print("Incremental run: Skipping distance matrix update (updated weekly on Mondays)")

    # Store availability index (always refresh - every 12 hours)
    print("Refreshing availability index for next 90 days")
    pg_hook.run("DELETE FROM itinerary_availability_index")  # Full refresh of availability

    availability_records = json.loads(availability_json)

    for record in availability_records:
        insert_availability_sql = """
        INSERT INTO itinerary_availability_index
            (experience_id, schedule_date, available_schedules_count, total_spots, booking_pressure, updated_at)
        VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        """

        pg_hook.run(insert_availability_sql, parameters=[
            record['experience_id'],
            record['schedule_date'],
            record['available_schedules_count'],
            record['total_spots'],
            record['booking_pressure']
        ])

    print(f"Stored {len(availability_records)} availability records")

    # Store logistics documents in experience_knowledge_base (only on full refresh)
    if is_full_refresh:
        print("Full refresh: Storing logistics documents in experience_knowledge_base")

        # Remove old logistics documents
        pg_hook.run("DELETE FROM experience_knowledge_base WHERE document_type = 'itinerary_logistics'")

        logistics_docs = json.loads(logistics_json)

        for doc in logistics_docs:
            if 'embedding' not in doc:
                print(f"Skipping document {doc['document_id']} - no embedding generated")
                continue

            insert_doc_sql = """
            INSERT INTO experience_knowledge_base (
                document_id, document_type, title, content_text, embedding,
                metadata, relevance_score, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (document_id)
            DO UPDATE SET
                document_type = EXCLUDED.document_type,
                title = EXCLUDED.title,
                content_text = EXCLUDED.content_text,
                embedding = EXCLUDED.embedding,
                metadata = EXCLUDED.metadata,
                relevance_score = EXCLUDED.relevance_score,
                updated_at = CURRENT_TIMESTAMP
            """

            pg_hook.run(insert_doc_sql, parameters=[
                doc['document_id'],
                doc['document_type'],
                doc['title'],
                doc['content_text'],
                doc['embedding'],
                json.dumps(doc['metadata']),
                doc['relevance_score']
            ])

        print(f"Stored {len(logistics_docs)} logistics documents in knowledge base")
    else:
        print("Incremental run: Skipping logistics documents update (updated weekly on Mondays)")

    # Print summary statistics
    stats = pg_hook.get_first("""
        SELECT
            (SELECT COUNT(*) FROM itinerary_distance_matrix) as distance_pairs,
            (SELECT COUNT(*) FROM itinerary_availability_index) as availability_records,
            (SELECT COUNT(*) FROM experience_knowledge_base WHERE document_type = 'itinerary_logistics') as logistics_docs
    """)

    if stats:
        print(f"\nItinerary Intelligence Summary:")
        print(f"- Distance matrix pairs: {stats[0]}")
        print(f"- Availability records: {stats[1]}")
        print(f"- Logistics documents: {stats[2]}")

    return "Itinerary intelligence storage completed successfully"

def update_watermark(**context):
    """Update the pipeline watermark with current timestamp"""

    pg_hook = PostgresHook(postgres_conn_id='trippy_db')

    # Use CURRENT_TIMESTAMP from database
    upsert_watermark = """
    INSERT INTO pipeline_watermarks (pipeline_name, last_run_timestamp, last_updated)
    VALUES (%s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (pipeline_name)
    DO UPDATE SET
        last_run_timestamp = CURRENT_TIMESTAMP,
        last_updated = CURRENT_TIMESTAMP
    """

    pg_hook.run(upsert_watermark, parameters=['itinerary_intelligence'])

    # Get the updated timestamp for logging
    result = pg_hook.get_first("""
        SELECT last_run_timestamp
        FROM pipeline_watermarks
        WHERE pipeline_name = 'itinerary_intelligence'
    """)

    updated_time = result[0] if result else 'unknown'
    print(f"Updated watermark to: {updated_time}")
    return "Watermark updated successfully"

# Define tasks
get_watermark_task = PythonOperator(
    task_id='get_last_run_timestamp',
    python_callable=get_last_run_timestamp,
    dag=dag,
)

extract_experiences_task = PythonOperator(
    task_id='extract_active_experiences',
    python_callable=extract_active_experiences,
    dag=dag,
)

calculate_distance_task = PythonOperator(
    task_id='calculate_distance_matrix',
    python_callable=calculate_distance_matrix,
    dag=dag,
)

extract_availability_task = PythonOperator(
    task_id='extract_schedule_availability',
    python_callable=extract_schedule_availability,
    dag=dag,
)

create_logistics_task = PythonOperator(
    task_id='create_logistics_documents',
    python_callable=create_logistics_documents,
    dag=dag,
)

generate_embeddings_task = PythonOperator(
    task_id='generate_embeddings',
    python_callable=generate_embeddings,
    dag=dag,
)

store_intelligence_task = PythonOperator(
    task_id='store_itinerary_intelligence',
    python_callable=store_itinerary_intelligence,
    dag=dag,
)

update_watermark_task = PythonOperator(
    task_id='update_watermark',
    python_callable=update_watermark,
    dag=dag,
)

# Define task dependencies
# Flow: Get watermark -> Extract experiences -> Calculate distances (parallel with availability)
#       -> Create logistics docs -> Generate embeddings -> Store everything -> Update watermark
get_watermark_task >> extract_experiences_task
extract_experiences_task >> [calculate_distance_task, extract_availability_task]
calculate_distance_task >> create_logistics_task >> generate_embeddings_task
[generate_embeddings_task, extract_availability_task] >> store_intelligence_task >> update_watermark_task
