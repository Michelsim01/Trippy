from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json
import re
from collections import Counter
import os

try:
    # Optional dependency: if not installed or API key missing, we skip embeddings
    from openai import OpenAI  # type: ignore
    _OPENAI_AVAILABLE = True
except Exception:
    _OPENAI_AVAILABLE = False

default_args = {
    'owner': 'trippy',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

# Creates an Airflow workflow that runs automatically every week
dag = DAG(
    'faq_knowledge_base',
    default_args=default_args,
    description='Build FAQ knowledge base for chatbot intelligence',
    schedule=timedelta(days=7),  # Run every 7 days (weekly)
    start_date=datetime(2024, 10, 1),
    catchup=False,
    tags=['analytics', 'chatbot', 'faq-intelligence'],
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
        WHERE pipeline_name = 'faq_knowledge_base'
    """)
    
    # Determine if this is a full refresh day (every Monday)
    execution_date = context['execution_date']
    is_full_refresh = execution_date.weekday() == 0  # 0 = Monday
    
    # Check if faq_knowledge_base table exists and has data
    knowledge_base_count = pg_hook.get_first("""
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_name = 'faq_knowledge_base'
    """)
    
    if knowledge_base_count and knowledge_base_count[0] > 0:
        # Table exists, check if it has data
        kb_count = pg_hook.get_first("SELECT COUNT(*) FROM faq_knowledge_base")
        if kb_count and kb_count[0] == 0:
            print("WARNING: faq_knowledge_base table is empty. Forcing full refresh for recovery.")
            is_full_refresh = True
    
    # If it's Monday or no previous run, do full refresh
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

def extract_faq_content(**context):
    """Extract FAQ data and related content for knowledge base processing"""
    
    pg_hook = PostgresHook(postgres_conn_id='trippy_db')
    
    # Get last run timestamp
    watermark_data = context['ti'].xcom_pull(task_ids='get_last_run_timestamp')
    last_run = watermark_data['last_run_timestamp']
    is_full_refresh = watermark_data['is_full_refresh']
    
    # Extract FAQ data
    if is_full_refresh:
        faq_query = """
        SELECT 
            faq_id,
            question,
            answer,
            category,
            priority,
            created_at,
            updated_at
        FROM faq
        ORDER BY priority DESC, created_at DESC
        """
    else:
        faq_query = f"""
        SELECT 
            faq_id,
            question,
            answer,
            category,
            priority,
            created_at,
            updated_at
        FROM faq
        WHERE created_at > '{last_run}' OR updated_at > '{last_run}'
        ORDER BY priority DESC, created_at DESC
        """
    
    # Extract review comments that contain questions or concerns
    if is_full_refresh:
        review_query = """
        SELECT DISTINCT
            r.comment,
            e.category as experience_category
        FROM review r
        JOIN experiences e ON r.experience_id = e.experience_id
        WHERE r.comment IS NOT NULL 
          AND r.comment != ''
          AND (r.comment LIKE '%?%' OR LENGTH(r.comment) > 50)
        """
    else:
        review_query = f"""
        SELECT DISTINCT
            r.comment,
            e.category as experience_category
        FROM review r
        JOIN experiences e ON r.experience_id = e.experience_id
        WHERE r.comment IS NOT NULL 
          AND r.comment != ''
          AND (r.comment LIKE '%?%' OR LENGTH(r.comment) > 50)
          AND r.created_at > '{last_run}'
        """
    
    # Extract cancellation reasons for insight extraction
    if is_full_refresh:
        cancellation_query = """
        SELECT 
            b.cancellation_reason,
            COUNT(*) as frequency
        FROM booking b
        WHERE b.status = 'CANCELLED' 
          AND b.cancellation_reason IS NOT NULL
        GROUP BY b.cancellation_reason
        ORDER BY frequency DESC
        LIMIT 50
        """
    else:
        cancellation_query = f"""
        SELECT 
            b.cancellation_reason,
            COUNT(*) as frequency
        FROM booking b
        WHERE b.status = 'CANCELLED' 
          AND b.cancellation_reason IS NOT NULL
          AND b.cancelled_at > '{last_run}'
        GROUP BY b.cancellation_reason
        ORDER BY frequency DESC
        LIMIT 50
        """
    
    # Extract experience policy information
    if is_full_refresh:
        policy_query = """
        SELECT 
            e.experience_id,
            e.important_info,
            e.cancellation_policy,
            e.what_included
        FROM experiences e
        WHERE e.status = 'ACTIVE'
          AND (e.important_info IS NOT NULL OR e.cancellation_policy IS NOT NULL)
        """
    else:
        policy_query = f"""
        SELECT 
            e.experience_id,
            e.important_info,
            e.cancellation_policy,
            e.what_included
        FROM experiences e
        WHERE e.status = 'ACTIVE'
          AND (e.important_info IS NOT NULL OR e.cancellation_policy IS NOT NULL)
          AND (e.created_at > '{last_run}' OR e.updated_at > '{last_run}')
        """
    
    # Execute queries
    try:
        faq_df = pd.read_sql(faq_query, pg_hook.get_sqlalchemy_engine())
    except Exception as e:
        print(f"Error loading FAQs: {e}")
        faq_df = pd.DataFrame()
    
    try:
        review_df = pd.read_sql(review_query, pg_hook.get_sqlalchemy_engine())
    except Exception as e:
        print(f"Error loading reviews: {e}")
        review_df = pd.DataFrame(columns=['comment', 'experience_category'])
    
    try:
        cancellation_df = pd.read_sql(cancellation_query, pg_hook.get_sqlalchemy_engine())
    except Exception as e:
        print(f"Error loading cancellations: {e}")
        cancellation_df = pd.DataFrame(columns=['cancellation_reason', 'frequency'])
    
    try:
        policy_df = pd.read_sql(policy_query, pg_hook.get_sqlalchemy_engine())
    except Exception as e:
        print(f"Error loading policies: {e}")
        policy_df = pd.DataFrame(columns=['experience_id', 'important_info', 'cancellation_policy', 'what_included'])
    
    print(f"Extracted {len(faq_df)} FAQs")
    print(f"Extracted {len(review_df)} review comments")
    print(f"Extracted {len(cancellation_df)} cancellation reasons")
    print(f"Extracted {len(policy_df)} experience policies")
    
    return {
        'faq_data': faq_df.to_json(orient='records'),
        'review_data': review_df.to_json(orient='records'),
        'cancellation_data': cancellation_df.to_json(orient='records'),
        'policy_data': policy_df.to_json(orient='records'),
        'is_full_refresh': is_full_refresh
    }

def analyze_content_semantics(**context):
    """Analyze content features and extract semantic information"""
    
    # Get data from previous task
    data = context['ti'].xcom_pull(task_ids='extract_faq_content')
    
    faq_df = pd.read_json(data['faq_data'])
    review_df = pd.read_json(data['review_data'])
    cancellation_df = pd.read_json(data['cancellation_data'])
    policy_df = pd.read_json(data['policy_data'])
    
    knowledge_entries = []
    
    # Process FAQs
    for _, faq in faq_df.iterrows():
        content = f"{faq['question']} {faq['answer']}"
        keywords = extract_keywords(content)
        
        entry = {
            'source_type': 'faq',
            'source_id': int(faq['faq_id']),
            'content': content,
            'category': faq['category'],
            'keywords': keywords,
            'metadata': json.dumps({
                'priority': int(faq['priority']),
                'original_question': faq['question']
            })
        }
        knowledge_entries.append(entry)
    
    # Process review insights
    for _, review in review_df.iterrows():
        if pd.notna(review['comment']):
            comment = review['comment']
            keywords = extract_keywords(comment)
            intent = classify_intent(comment)
            
            entry = {
                'source_type': 'review_insight',
                'source_id': None,
                'content': comment,
                'category': intent,
                'keywords': keywords,
                'metadata': json.dumps({
                    'experience_category': review.get('experience_category', 'unknown'),
                    'intent': intent
                })
            }
            knowledge_entries.append(entry)
    
    # Process cancellation patterns
    for _, cancel in cancellation_df.iterrows():
        if pd.notna(cancel['cancellation_reason']):
            reason = cancel['cancellation_reason']
            keywords = extract_keywords(reason)
            
            entry = {
                'source_type': 'cancellation_pattern',
                'source_id': None,
                'content': reason,
                'category': 'CANCELLATION',
                'keywords': keywords,
                'metadata': json.dumps({
                    'frequency': int(cancel['frequency'])
                })
            }
            knowledge_entries.append(entry)
    
    # Process policy information
    for _, policy in policy_df.iterrows():
        policies = []
        if pd.notna(policy['important_info']):
            policies.append(policy['important_info'])
        if pd.notna(policy['cancellation_policy']):
            policies.append(policy['cancellation_policy'])
        if pd.notna(policy['what_included']):
            policies.append(policy['what_included'])
        
        for policy_text in policies:
            keywords = extract_keywords(policy_text)
            
            entry = {
                'source_type': 'policy_doc',
                'source_id': int(policy['experience_id']),
                'content': policy_text,
                'category': 'GENERAL',
                'keywords': keywords,
                'metadata': json.dumps({
                    'experience_id': int(policy['experience_id'])
                })
            }
            knowledge_entries.append(entry)
    
    return json.dumps(knowledge_entries)

def extract_keywords(text):
    """Extract keywords from text"""
    if not text:
        return []
    
    # Remove special characters and convert to lowercase
    text = re.sub(r'[^a-zA-Z\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).lower().strip()
    
    # Define keywords to identify
    important_keywords = {
        'booking', 'cancel', 'refund', 'payment', 'tripoints', 'guide', 'experience',
        'safety', 'weather', 'required', 'bring', 'included', 'policy', 'group',
        'contact', 'review', 'confirm', 'reschedule', 'emergency', 'age', 'restriction'
    }
    
    words = text.split()
    found_keywords = [w for w in words if w in important_keywords and len(w) > 3]
    
    # Also get most common words
    word_freq = Counter(words)
    top_words = [word for word, _ in word_freq.most_common(5) if len(word) > 3]
    
    return list(set(found_keywords + top_words))

def classify_intent(text):
    """Classify the intent of a text snippet"""
    text_lower = text.lower()
    
    if any(word in text_lower for word in ['book', 'booking', 'reserve']):
        return 'BOOKING'
    elif any(word in text_lower for word in ['cancel', 'refund', 'reschedule']):
        return 'CANCELLATION'
    elif any(word in text_lower for word in ['pay', 'payment', 'cost', 'price', 'money']):
        return 'PAYMENT'
    elif any(word in text_lower for word in ['safe', 'danger', 'risk', 'age', 'medical']):
        return 'SAFETY'
    elif any(word in text_lower for word in ['meet', 'where', 'location', 'transport']):
        return 'LOGISTICS'
    else:
        return 'GENERAL'

def build_search_embeddings(**context):
    """Build TF-IDF vectors for FAQ search and store in knowledge base"""
    
    # Get knowledge entries from previous task
    knowledge_json = context['ti'].xcom_pull(task_ids='analyze_content_semantics')
    knowledge_entries = json.loads(knowledge_json)
    
    # Get full refresh flag
    extraction_data = context['ti'].xcom_pull(task_ids='extract_faq_content')
    is_full_refresh = extraction_data['is_full_refresh']
    
    if len(knowledge_entries) == 0:
        print("No knowledge entries to process")
        return json.dumps([])
    
    # Prepare content for TF-IDF vectorization
    content_list = [entry['content'] for entry in knowledge_entries]
    
    # Build TF-IDF vectors
    vectorizer = TfidfVectorizer(
        max_features=1000,
        stop_words='english',
        ngram_range=(1, 2),
        min_df=1
    )
    
    tfidf_matrix = vectorizer.fit_transform(content_list)
    
    # Convert to JSON-serializable format (lightweight term weights)
    for i, entry in enumerate(knowledge_entries):
        # Get the TF-IDF vector as a sparse matrix row
        vector = tfidf_matrix[i].toarray()[0]
        # Store top terms only (to save space)
        vector_dict = vectorizer.get_feature_names_out()
        top_indices = vector.nonzero()[0]
        top_terms = {vector_dict[idx]: float(vector[idx]) for idx in top_indices if vector[idx] > 0.1}
        entry['vectorized_content'] = json.dumps(top_terms)

    # Optionally build OpenAI embeddings (for RAG)
    api_key = os.environ.get('OPENAI_API_KEY')
    if not _OPENAI_AVAILABLE or not api_key:
        print("OpenAI embeddings skipped: package or API key not available")
        # Still return entries with TF-IDF
        return json.dumps(knowledge_entries)

    try:
        client = OpenAI(api_key=api_key)
        # Batch up to a safe size per request
        batch_size = 100
        texts = [entry['content'] for entry in knowledge_entries]
        for start in range(0, len(texts), batch_size):
            batch = texts[start:start + batch_size]
            response = client.embeddings.create(model="text-embedding-3-small", input=batch)
            for idx, emb in enumerate(response.data):
                knowledge_entries[start + idx]['embedding'] = json.dumps(emb.embedding)
        print(f"Built OpenAI embeddings for {len(knowledge_entries)} entries")
    except Exception as e:
        print(f"OpenAI embeddings generation failed, continuing without: {e}")
    
    print(f"Built TF-IDF embeddings for {len(knowledge_entries)} knowledge entries")
    
    return json.dumps(knowledge_entries)

def save_knowledge_base(**context):
    """Save FAQ knowledge base results to database"""
    
    # Get final knowledge data
    knowledge_json = context['ti'].xcom_pull(task_ids='build_search_embeddings')
    knowledge_entries = json.loads(knowledge_json)
    
    # Get full refresh flag
    extraction_data = context['ti'].xcom_pull(task_ids='extract_faq_content')
    is_full_refresh = extraction_data['is_full_refresh']
    
    pg_hook = PostgresHook(postgres_conn_id='trippy_db')
    
    # Create knowledge base table if it doesn't exist
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS faq_knowledge_base (
        knowledge_id BIGSERIAL PRIMARY KEY,
        source_type VARCHAR(50) NOT NULL,
        source_id BIGINT,
        content TEXT NOT NULL,
        vectorized_content TEXT,
        embedding JSONB,
        category VARCHAR(50),
        keywords VARCHAR(255),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_kb_source_content UNIQUE (source_type, source_id, content)
    );
    
    CREATE INDEX IF NOT EXISTS idx_kb_category ON faq_knowledge_base(category);
    CREATE INDEX IF NOT EXISTS idx_kb_source ON faq_knowledge_base(source_type, source_id);
    CREATE INDEX IF NOT EXISTS idx_kb_updated ON faq_knowledge_base(last_updated DESC);
    -- Ensure unique index exists even if table was created previously without the constraint
    CREATE UNIQUE INDEX IF NOT EXISTS uq_kb_source_content_idx 
      ON faq_knowledge_base(source_type, source_id, content);
    -- Ensure embedding column exists even if table predates this change
    ALTER TABLE faq_knowledge_base
      ADD COLUMN IF NOT EXISTS embedding JSONB;
    """
    
    pg_hook.run(create_table_sql)
    
    # Save knowledge base data using batch insert for efficiency
    batch_size = 100
    error_count = 0
    success_count = 0
    
    # Convert keywords to strings for all entries
    for entry in knowledge_entries:
        entry['keywords_str'] = ','.join(entry['keywords']) if isinstance(entry['keywords'], list) else entry.get('keywords', '')
    
    # Batch insert to improve performance
    for i in range(0, len(knowledge_entries), batch_size):
        batch = knowledge_entries[i:i+batch_size]
        
        for entry in batch:
            upsert_sql = """
        INSERT INTO faq_knowledge_base (
            source_type, source_id, content, vectorized_content, embedding,
            category, keywords, metadata, created_at, last_updated
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (source_type, source_id, content)
            DO UPDATE SET 
                vectorized_content = EXCLUDED.vectorized_content,
            embedding = EXCLUDED.embedding,
                category = EXCLUDED.category,
                keywords = EXCLUDED.keywords,
                metadata = EXCLUDED.metadata,
                last_updated = CURRENT_TIMESTAMP
            """
            
            # Handle None source_id
            source_id = entry['source_id'] if entry['source_id'] is not None else None
            
            try:
                pg_hook.run(upsert_sql, parameters=[
                    entry['source_type'],
                    source_id,
                    entry['content'],
                    entry.get('vectorized_content', ''),
                    entry.get('embedding', None),
                    entry.get('category', 'GENERAL'),
                    entry['keywords_str'],
                    entry.get('metadata', '{}')
                ])
                success_count += 1
            except Exception as e:
                error_count += 1
                # Only log if it's not a constraint-related warning
                if 'unique' not in str(e).lower() and 'constraint' not in str(e).lower():
                    print(f"Error inserting entry: {entry.get('source_type', 'unknown')} - {str(e)}")
                continue
        
        # Log progress for large batches
        if i % (batch_size * 5) == 0:
            print(f"Processed {min(i+batch_size, len(knowledge_entries))}/{len(knowledge_entries)} entries")
    
    print(f"Successfully processed {success_count} knowledge base entries, {error_count} errors")
    print(f"Total entries processed: {len(knowledge_entries)}")
    return "FAQ knowledge base pipeline completed successfully"

def update_watermark(**context):
    """Update the pipeline watermark with current timestamp"""
    
    pg_hook = PostgresHook(postgres_conn_id='trippy_db')
    
    upsert_watermark = """
    INSERT INTO pipeline_watermarks (pipeline_name, last_run_timestamp, last_updated)
    VALUES (%s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (pipeline_name)
    DO UPDATE SET 
        last_run_timestamp = CURRENT_TIMESTAMP,
        last_updated = CURRENT_TIMESTAMP
    """
    
    pg_hook.run(upsert_watermark, parameters=['faq_knowledge_base'])
    
    result = pg_hook.get_first("""
        SELECT last_run_timestamp 
        FROM pipeline_watermarks 
        WHERE pipeline_name = 'faq_knowledge_base'
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
    task_id='extract_faq_content',
    python_callable=extract_faq_content,
    dag=dag,
)

analyze_task = PythonOperator(
    task_id='analyze_content_semantics',
    python_callable=analyze_content_semantics,
    dag=dag,
)

vectorize_task = PythonOperator(
    task_id='build_search_embeddings',
    python_callable=build_search_embeddings,
    dag=dag,
)

save_task = PythonOperator(
    task_id='save_knowledge_base',
    python_callable=save_knowledge_base,
    dag=dag,
)

update_watermark_task = PythonOperator(
    task_id='update_watermark',
    python_callable=update_watermark,
    dag=dag,
)

# Define task dependencies
# Flow: Get last run time -> Extract data -> Analyze content -> Build embeddings -> Save -> Update watermark
get_watermark_task >> extract_task >> analyze_task >> vectorize_task >> save_task >> update_watermark_task

