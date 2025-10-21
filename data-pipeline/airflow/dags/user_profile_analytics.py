from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from scipy.spatial.distance import cdist
import json

default_args = {
    'owner': 'trippy',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

# Creates an Airflow workflow that runs automatically every 24 hours
dag = DAG(
    'user_profile_analytics',
    default_args=default_args,
    description='Analyze user behavior and create preference profiles',
    schedule=timedelta(hours=24),  # Run every 24 hours
    start_date=datetime(2024, 10, 1),
    catchup=False,
    tags=['analytics', 'recommendations', 'user-profiling'],
)

def get_last_run_timestamp(**context):
    """Get timestamp of last successful pipeline run for incremental processing"""
    
    pg_hook = PostgresHook(postgres_conn_id='trippy_db')
    
    # Create watermark table if it doesn't exist
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
        WHERE pipeline_name = 'user_profile_analytics'
    """)
    
    # Determine if this is a full refresh day (every Monday)
    execution_date = context['execution_date']
    is_full_refresh = execution_date.weekday() == 0  # 0 = Monday
    
    # Check if cluster_profiles table exists and has data
    # If empty, force full refresh (auto-recovery mechanism)
    cluster_profile_count = pg_hook.get_first("""
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_name = 'cluster_profiles'
    """)
    
    if cluster_profile_count and cluster_profile_count[0] > 0:
        # Table exists, check if it has data
        profile_count = pg_hook.get_first("SELECT COUNT(*) FROM cluster_profiles")
        if profile_count and profile_count[0] == 0:
            print("WARNING: cluster_profiles table is empty. Forcing full refresh for recovery.")
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

def extract_user_data(**context):
    """Extract user survey, booking, and interaction data (incremental or full)"""
    
    pg_hook = PostgresHook(postgres_conn_id='trippy_db')
    
    # Get last run timestamp from previous task
    watermark_data = context['ti'].xcom_pull(task_ids='get_last_run_timestamp')
    last_run = watermark_data['last_run_timestamp']
    is_full_refresh = watermark_data['is_full_refresh']
    
    # Extract user survey data (incremental: only new/completed surveys)
    # No where clause if is full_refresh mode
    survey_query = f"""
    SELECT 
        us.user_id,
        us.travel_style,
        us.experience_budget,
        us.completed_at,
        array_agg(usi.interests) as interests
    FROM user_survey us
    LEFT JOIN user_survey_interests usi ON us.survey_id = usi.user_survey_survey_id
    {f"WHERE us.completed_at > '{last_run}'" if not is_full_refresh else ""}  
    GROUP BY us.user_id, us.travel_style, us.experience_budget, us.completed_at
    """
    
    # Extract booking behavior data (incremental: only users with new bookings)
    # Note: We still aggregate ALL bookings for these users to get accurate totals
    booking_query = f"""
    SELECT 
        b.traveler_id as user_id,
        COUNT(*) as total_bookings,
        AVG(b.total_amount) as avg_booking_amount,
        COUNT(CASE WHEN b.status = 'COMPLETED' THEN 1 END) as completed_bookings,
        array_agg(DISTINCT e.category) as booked_categories,
        AVG(e.price) as avg_experience_price,
        COUNT(DISTINCT e.country) as countries_visited
    FROM booking b
    JOIN experience_schedule es ON b.experience_schedule_id = es.schedule_id
    JOIN experiences e ON es.experience_id = e.experience_id
    {f"WHERE b.traveler_id IN (SELECT DISTINCT traveler_id FROM booking WHERE booking_date > '{last_run}')" if not is_full_refresh else ""}
    GROUP BY b.traveler_id
    """
    
    # Extract review data (incremental: only users with new reviews)
    review_query = f"""
    SELECT 
        r.reviewer_id,
        COUNT(*) as total_reviews,
        AVG(r.rating) as avg_rating_given,
        array_agg(e.category) as reviewed_categories
    FROM review r
    JOIN experiences e ON r.experience_id = e.experience_id
    {f"WHERE r.reviewer_id IN (SELECT DISTINCT reviewer_id FROM review WHERE created_at > '{last_run}')" if not is_full_refresh else ""}
    GROUP BY r.reviewer_id
    """
    
    # Extract data from the database using SQL queries
    survey_df = pd.read_sql(survey_query, pg_hook.get_sqlalchemy_engine())
    booking_df = pd.read_sql(booking_query, pg_hook.get_sqlalchemy_engine())
    review_df = pd.read_sql(review_query, pg_hook.get_sqlalchemy_engine())
    
    print(f"Extracted {len(booking_df)} users with booking activity")
    print(f"Extracted {len(survey_df)} user surveys")
    print(f"Extracted {len(review_df)} users with review activity")
    
    # Save to XCom for next task
    return {
        'survey_data': survey_df.to_json(orient='records'),
        'booking_data': booking_df.to_json(orient='records'),
        'review_data': review_df.to_json(orient='records'),
        'is_full_refresh': is_full_refresh
    }

# Encodes the budget score based on the numerical ranges
def encode_budget_score(budget_value):
    """Convert budget ranges to numerical scores"""
    if isinstance(budget_value, str):
        # Handle string categories (fallback for old data)
        budget_map = {'budget': 1, 'mid_range': 2, 'premium': 3, 'luxury': 4}
        return budget_map.get(budget_value.lower(), 2)
    
    # Handle numerical budget values
    try:
        budget_num = float(budget_value)
        if budget_num <= 50:
            return 1  # budget-friendly
        elif budget_num <= 150:
            return 2  # moderate  
        elif budget_num <= 300:
            return 3  # premium
        else:
            return 4  # luxury
    except (ValueError, TypeError):
        return 2  # default to moderate

def process_user_features(**context):
    """Process raw data into user feature vectors"""
    
    # Get data from previous task
    data = context['ti'].xcom_pull(task_ids='extract_user_data')
    
    survey_df = pd.read_json(data['survey_data'])
    booking_df = pd.read_json(data['booking_data'])
    review_df = pd.read_json(data['review_data'])
    
    # Create comprehensive user features
    features = []
    
    # Iterate through each user with booking data and create a feature vector
    # For each user from booking data, look up corresponding survey & review rows and compute features.
    for _, booking in booking_df.iterrows():
        user_id = booking['user_id']
        
        # Get survey and review data for this user
        user_survey = survey_df[survey_df['user_id'] == user_id]
        user_reviews = review_df[review_df['reviewer_id'] == user_id]
        
        # Create feature vector (only numerical features are used for clustering)
        feature_vector = {
            'user_id': user_id,
            # Survey features (if survey exists for this user)
            'travel_style': user_survey['travel_style'].iloc[0] if len(user_survey) > 0 else 'unknown', # Keep as string as it is useful for analysis (excluded from clustering)
            'budget_category': user_survey['experience_budget'].iloc[0] if len(user_survey) > 0 else 'unknown', # Keep as string as it is useful for analysis (excluded from clustering)
            'interests_count': len(user_survey['interests'].iloc[0]) if len(user_survey) > 0 and user_survey['interests'].iloc[0] else 0,
            
            # Booking behavior features (guaranteed to exist since we're iterating from booking data)
            'total_bookings': int(booking['total_bookings']),
            'avg_booking_amount': float(booking['avg_booking_amount']),
            'completion_rate': float(booking['completed_bookings'] / booking['total_bookings']) if booking['total_bookings'] > 0 else 0.0,
            'countries_visited': int(booking['countries_visited']),
            
            # Review behavior features
            'review_activity': int(user_reviews['total_reviews'].iloc[0]) if len(user_reviews) > 0 else 0,
            'avg_rating_given': float(user_reviews['avg_rating_given'].iloc[0]) if len(user_reviews) > 0 else 0.0,
            
            # Interest categories (one-hot encoded matching frontend interest IDs)
            'interest_adventure': 1 if len(user_survey) > 0 and any(
                str(interest).lower() in ['adventure', 'sports']
                for interest in user_survey['interests'].iloc[0] or []
            ) else 0,
            'interest_cultural': 1 if len(user_survey) > 0 and any(
                str(interest).lower() in ['culture', 'art', 'shopping']
                for interest in user_survey['interests'].iloc[0] or []
            ) else 0,
            'interest_relaxation': 1 if len(user_survey) > 0 and any(
                str(interest).lower() in ['beach', 'wellness']
                for interest in user_survey['interests'].iloc[0] or []
            ) else 0,
            'interest_social': 1 if len(user_survey) > 0 and any(
                str(interest).lower() in ['food', 'nightlife', 'entertainment']
                for interest in user_survey['interests'].iloc[0] or []
            ) else 0,
            'interest_nature': 1 if len(user_survey) > 0 and any(
                str(interest).lower() in ['wildlife', 'photography']
                for interest in user_survey['interests'].iloc[0] or []
            ) else 0,
            
            # Budget preference (encoded based on numerical ranges)
            'budget_score': encode_budget_score(user_survey['experience_budget'].iloc[0]) if len(user_survey) > 0 else 2,
            
            # Travel style one-hot encoding (4 categories: social, business, family, romantic)
            'travel_style_social': 1 if len(user_survey) > 0 and user_survey['travel_style'].iloc[0].lower() == 'social' else 0,
            'travel_style_business': 1 if len(user_survey) > 0 and user_survey['travel_style'].iloc[0].lower() == 'business' else 0,
            'travel_style_family': 1 if len(user_survey) > 0 and user_survey['travel_style'].iloc[0].lower() == 'family' else 0,
            'travel_style_romantic': 1 if len(user_survey) > 0 and user_survey['travel_style'].iloc[0].lower() == 'romantic' else 0
        }
        
        features.append(feature_vector)
    
    return json.dumps(features)

def cluster_users(**context):
    """Perform K-means clustering (full refresh) or assign to existing clusters (incremental)"""
    
    # Get processed features
    features_json = context['ti'].xcom_pull(task_ids='process_user_features')
    features = json.loads(features_json)
    
    # Get data extraction results to check if full refresh
    extraction_data = context['ti'].xcom_pull(task_ids='extract_user_data')
    is_full_refresh = extraction_data['is_full_refresh']
    
    df = pd.DataFrame(features)
    
    # If no users to process, return early
    if len(df) == 0:
        print("No users to process. Skipping clustering.")
        return {
            'user_clusters': json.dumps([]),
            'user_features': json.dumps([]),
            'cluster_profiles': json.dumps({})
        }
    
    # Select numerical features for clustering
    clustering_features = [
        'interests_count', 'total_bookings', 'avg_booking_amount', 
        'completion_rate', 'countries_visited', 'review_activity', 
        'avg_rating_given', 'interest_adventure', 'interest_cultural', 
        'interest_relaxation', 'interest_social', 'interest_nature', 'budget_score',
        'travel_style_social', 'travel_style_business', 'travel_style_family', 'travel_style_romantic'
    ]
    
    # Fill NaN values with 0
    X = df[clustering_features].fillna(0)
    
    # Normalize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    pg_hook = PostgresHook(postgres_conn_id='trippy_db')
    
    # Create cluster_models table if it doesn't exist (needed for both modes)
    pg_hook.run("""
        CREATE TABLE IF NOT EXISTS cluster_models (
            model_name VARCHAR(100) PRIMARY KEY,
            model_data JSONB,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    if is_full_refresh:
        print("FULL REFRESH MODE: Re-clustering all users")
        
        # Perform K-means clustering (4 clusters for different traveler types)
        kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(X_scaled)
        
        # Save cluster centers and scaler parameters for incremental updates
        cluster_model_data = {
            'cluster_centers': kmeans.cluster_centers_.tolist(),
            'scaler_mean': scaler.mean_.tolist(),
            'scaler_scale': scaler.scale_.tolist(),
            'n_clusters': 4
        }
        
        # Save model to database
        pg_hook.run("""
            INSERT INTO cluster_models (model_name, model_data, last_updated)
            VALUES (%s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (model_name)
            DO UPDATE SET 
                model_data = EXCLUDED.model_data,
                last_updated = CURRENT_TIMESTAMP
        """, parameters=['user_clustering_model', json.dumps(cluster_model_data)])
        
    else:
        print("INCREMENTAL MODE: Assigning new users to existing clusters")
        
        # Load existing cluster model from database
        model_result = pg_hook.get_first("""
            SELECT model_data FROM cluster_models WHERE model_name = 'user_clustering_model'
        """)
        
        if not model_result:
            print("WARNING: No existing cluster model found. Falling back to full clustering.")
            # Fallback to full clustering
            kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
            clusters = kmeans.fit_predict(X_scaled)
            
            # Save the model for future incremental runs
            cluster_model_data = {
                'cluster_centers': kmeans.cluster_centers_.tolist(),
                'scaler_mean': scaler.mean_.tolist(),
                'scaler_scale': scaler.scale_.tolist(),
                'n_clusters': 4
            }
            
            pg_hook.run("""
                INSERT INTO cluster_models (model_name, model_data, last_updated)
                VALUES (%s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (model_name)
                DO UPDATE SET 
                    model_data = EXCLUDED.model_data,
                    last_updated = CURRENT_TIMESTAMP
            """, parameters=['user_clustering_model', json.dumps(cluster_model_data)])
            
            print("Saved cluster model to database for future incremental runs")
        else:
            # Load saved cluster centers and scaler
            model_data = model_result[0]
            cluster_centers = np.array(model_data['cluster_centers'])
            
            # Recreate scaler with saved parameters
            saved_scaler = StandardScaler()
            saved_scaler.mean_ = np.array(model_data['scaler_mean'])
            saved_scaler.scale_ = np.array(model_data['scaler_scale'])
            
            # Re-scale features using saved scaler parameters
            X_scaled = (X - saved_scaler.mean_) / saved_scaler.scale_
            
            # Assign new users to nearest existing cluster
            distances = cdist(X_scaled, cluster_centers, metric='euclidean')
            clusters = np.argmin(distances, axis=1)
            
            print(f"Assigned {len(clusters)} new users to existing clusters")
    
    # Add cluster labels to user data
    df['cluster'] = clusters
    
    # Calculate cluster profiles based on mode
    cluster_profiles = {}
    
    if is_full_refresh:
        # FULL REFRESH: Calculate profiles from ALL users in current batch
        # This ensures cluster profiles are aligned with the new cluster model
        print("Calculating cluster profiles from all users in full refresh...")
        
        for cluster_id in range(4):
            cluster_users = df[df['cluster'] == cluster_id]
            
            if len(cluster_users) > 0:
                profile = {
                    'cluster_id': int(cluster_id),
                    'user_count': len(cluster_users),
                    'avg_budget_score': float(cluster_users['budget_score'].mean()),
                    'dominant_travel_style': cluster_users['travel_style'].mode().iloc[0] if len(cluster_users['travel_style'].mode()) > 0 else 'unknown',
                    'avg_booking_amount': float(cluster_users['avg_booking_amount'].mean()),
                    'travel_style_preferences': {
                        'social': float(cluster_users['travel_style_social'].mean()),
                        'business': float(cluster_users['travel_style_business'].mean()),
                        'family': float(cluster_users['travel_style_family'].mean()),
                        'romantic': float(cluster_users['travel_style_romantic'].mean())
                    },
                    'interest_preferences': {
                        'adventure': float(cluster_users['interest_adventure'].mean()),
                        'cultural': float(cluster_users['interest_cultural'].mean()),
                        'relaxation': float(cluster_users['interest_relaxation'].mean()),
                        'social': float(cluster_users['interest_social'].mean()),
                        'nature': float(cluster_users['interest_nature'].mean())
                    }
                }
                cluster_profiles[cluster_id] = profile
                print(f"Cluster {cluster_id}: {len(cluster_users)} users")
    else:
        # INCREMENTAL: Don't recalculate cluster profiles (use existing from last full refresh)
        # Only user assignments are updated, profiles remain stable until next Monday
        print("INCREMENTAL MODE: Skipping cluster profile recalculation (will use existing profiles from last full refresh)")
        print(f"Assigned {len(df)} users to existing clusters")
        
        # Optionally: Load existing cluster profiles to return (for consistency)
        existing_profiles_query = """
        SELECT cluster_id, profile_data 
        FROM cluster_profiles
        ORDER BY cluster_id
        """
        existing_profiles_df = pd.read_sql(existing_profiles_query, pg_hook.get_sqlalchemy_engine())
        
        if len(existing_profiles_df) > 0:
            for _, row in existing_profiles_df.iterrows():
                cluster_profiles[row['cluster_id']] = row['profile_data']
            print(f"Loaded {len(cluster_profiles)} existing cluster profiles from database")
    
    return {
        'user_clusters': df[['user_id', 'cluster']].to_json(orient='records'), # Save user cluster assignments
        'user_features': df.to_json(orient='records'),  # Save all user features
        'cluster_profiles': json.dumps(cluster_profiles), # Save cluster profiles
        'update_cluster_profiles': is_full_refresh  # Only update profiles on full refresh
    }

def save_analytics_results(**context):
    """Save clustering results and user profiles to database"""
    
    # Get clustering results
    results = context['ti'].xcom_pull(task_ids='cluster_users')
    user_clusters = json.loads(results['user_clusters'])
    user_features = json.loads(results['user_features'])
    cluster_profiles = json.loads(results['cluster_profiles'])
    update_cluster_profiles = results['update_cluster_profiles']
    
    pg_hook = PostgresHook(postgres_conn_id='trippy_db')
    
    # Create analytics tables if they don't exist
    create_tables_sql = """
    CREATE TABLE IF NOT EXISTS user_analytics_profile (
        user_id BIGINT PRIMARY KEY,
        cluster_id INTEGER,
        profile_data JSONB,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS cluster_profiles (
        cluster_id INTEGER PRIMARY KEY,
        profile_data JSONB,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    pg_hook.run(create_tables_sql)
    
    # Save user cluster assignments
    for user_cluster in user_clusters:
        user_id = user_cluster['user_id']
        cluster_id = user_cluster['cluster']
        
        # Get the full feature vector for this user
        user_feature_data = next((u for u in user_features if u['user_id'] == user_id), {})
        
        upsert_user_sql = """
        INSERT INTO user_analytics_profile (user_id, cluster_id, profile_data, last_updated)
        VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            cluster_id = EXCLUDED.cluster_id,
            profile_data = EXCLUDED.profile_data,
            last_updated = CURRENT_TIMESTAMP
        """
        
        pg_hook.run(upsert_user_sql, parameters=[user_id, cluster_id, json.dumps(user_feature_data)])
    
    # Save cluster profiles ONLY on full refresh (to ensure consistency with cluster model)
    if update_cluster_profiles:
        print("Updating cluster profiles (full refresh mode)...")
        for cluster_id, profile in cluster_profiles.items():
            upsert_cluster_sql = """
            INSERT INTO cluster_profiles (cluster_id, profile_data, last_updated)
            VALUES (%s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (cluster_id)
            DO UPDATE SET 
                profile_data = EXCLUDED.profile_data,
                last_updated = CURRENT_TIMESTAMP
            """
            
            pg_hook.run(upsert_cluster_sql, parameters=[cluster_id, json.dumps(profile)])
        print(f"Updated {len(cluster_profiles)} cluster profiles")
    else:
        print("Incremental mode: Cluster profiles unchanged (will be updated on next full refresh)")
    
    print(f"Successfully updated profiles for {len(user_clusters)} users")
    return "Analytics pipeline completed successfully"

def update_watermark(**context):
    """Update the pipeline watermark with current timestamp"""
    
    pg_hook = PostgresHook(postgres_conn_id='trippy_db')
    
    # Use CURRENT_TIMESTAMP from database (no timezone conversion)
    # This ensures watermark matches the timestamps in the database tables
    upsert_watermark = """
    INSERT INTO pipeline_watermarks (pipeline_name, last_run_timestamp, last_updated)
    VALUES (%s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (pipeline_name)
    DO UPDATE SET 
        last_run_timestamp = CURRENT_TIMESTAMP,
        last_updated = CURRENT_TIMESTAMP
    """
    
    pg_hook.run(upsert_watermark, parameters=['user_profile_analytics'])
    
    # Get the updated timestamp for logging
    result = pg_hook.get_first("""
        SELECT last_run_timestamp 
        FROM pipeline_watermarks 
        WHERE pipeline_name = 'user_profile_analytics'
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

extract_task = PythonOperator(
    task_id='extract_user_data',
    python_callable=extract_user_data,
    dag=dag,
)

process_task = PythonOperator(
    task_id='process_user_features',
    python_callable=process_user_features,
    dag=dag,
)

cluster_task = PythonOperator(
    task_id='cluster_users',
    python_callable=cluster_users,
    dag=dag,
)

save_task = PythonOperator(
    task_id='save_analytics_results',
    python_callable=save_analytics_results,
    dag=dag,
)

update_watermark_task = PythonOperator(
    task_id='update_watermark',
    python_callable=update_watermark,
    dag=dag,
)

# Define task dependencies
# Flow: Get last run time -> Extract data -> Process -> Cluster -> Save -> Update watermark
get_watermark_task >> extract_task >> process_task >> cluster_task >> save_task >> update_watermark_task