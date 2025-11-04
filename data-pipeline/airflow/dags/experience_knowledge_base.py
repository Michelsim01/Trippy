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

# Creates an Airflow workflow that runs automatically every 24 hours
dag = DAG(
    'experience_knowledge_base',
    default_args=default_args,
    description='Transform travel data into AI-ready experience knowledge base for chatbot',
    schedule=timedelta(hours=24),  # Run every 24 hours
    start_date=datetime(2024, 10, 1),
    catchup=False,
    tags=['analytics', 'experience-knowledge-base', 'chatbot', 'ai'],
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
        WHERE pipeline_name = 'experience_knowledge_base'
    """)
    
    # Determine if this is a full refresh day (every Monday) 
    execution_date = context['execution_date']
    is_full_refresh = execution_date.weekday() == 0  # 0 = Monday
    
    # Check if experience_knowledge_base table exists and has data
    # If empty, force full refresh (auto-recovery mechanism)
    kb_table_count = pg_hook.get_first("""
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_name = 'experience_knowledge_base'
    """)
    
    if kb_table_count and kb_table_count[0] > 0:
        # Table exists, check if it has data
        kb_count = pg_hook.get_first("SELECT COUNT(*) FROM experience_knowledge_base")
        if kb_count and kb_count[0] == 0:
            print("WARNING: experience_knowledge_base table is empty. Forcing full refresh for recovery.")
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

def extract_enhanced_experience_data(**context):
    """Extract comprehensive experience data from existing pipelines and database"""
    
    pg_hook = PostgresHook(postgres_conn_id='trippy_db')
    
    # Get last run timestamp from previous task
    watermark_data = context['ti'].xcom_pull(task_ids='get_last_run_timestamp')
    last_run = watermark_data['last_run_timestamp']
    is_full_refresh = watermark_data['is_full_refresh']
    
    # Extract enhanced experience data combining multiple sources
    enhanced_experience_query = f"""
    SELECT DISTINCT
        e.experience_id,
        e.title,
        e.short_description,
        e.full_description,
        e.highlights,
        e.category,
        e.price,
        e.duration,
        e.location,
        e.latitude,
        e.longitude,
        e.country,
        e.participants_allowed,
        e.average_rating,
        e.total_reviews,
        e.created_at,
        
        -- Guide information
        u.first_name as guide_first_name,
        u.last_name as guide_last_name,
        
        -- Tags
        array_agg(DISTINCT et.tags) FILTER (WHERE et.tags IS NOT NULL) as tags,
        
        -- Intelligence data (from experience_intelligence pipeline)
        ei.popularity_score,
        ei.sentiment_score,
        ei.recommendation_weight,
        ei.content_completeness_score,
        ei.intelligence_data,
        
        -- User analytics insights (aggregated cluster preferences)
        COALESCE(cluster_stats.dominant_clusters, '[]'::jsonb) as popular_with_clusters,
        COALESCE(cluster_stats.avg_cluster_rating, 0) as cluster_satisfaction
        
    FROM experiences e
    LEFT JOIN users u ON e.guide_id = u.user_id
    LEFT JOIN experience_tags et ON e.experience_id = et.experience_experience_id
    LEFT JOIN experience_intelligence ei ON e.experience_id = ei.experience_id
    LEFT JOIN (
        -- For each experience, find which user clusters have reviewed it
        SELECT 
            r.experience_id,
            jsonb_agg(
                jsonb_build_object(
                    'cluster_id', uap.cluster_id,  -- Which user type (0–3)
                    'review_count', cluster_reviews.review_count,  -- How many reviews from this cluster
                    'avg_rating', cluster_reviews.avg_rating  -- Average rating from this cluster
                )
            ) as dominant_clusters,
            AVG(r.rating) as avg_cluster_rating  -- Average rating across all reviews from this experience
        FROM review r
        JOIN user_analytics_profile uap ON r.reviewer_id = uap.user_id
        JOIN (
            -- Subquery: Calculate stats per cluster per experience
            SELECT 
                r2.experience_id, 
                uap2.cluster_id,
                COUNT(*) as review_count,
                AVG(r2.rating) as avg_rating
            FROM review r2
            JOIN user_analytics_profile uap2 ON r2.reviewer_id = uap2.user_id
            GROUP BY r2.experience_id, uap2.cluster_id
            HAVING COUNT(*) >= 2  -- Only include clusters with at least 2 reviews
        ) cluster_reviews ON r.experience_id = cluster_reviews.experience_id 
                           AND uap.cluster_id = cluster_reviews.cluster_id
        GROUP BY r.experience_id
    ) cluster_stats ON e.experience_id = cluster_stats.experience_id
    
    WHERE e.status = 'ACTIVE'
    {f"AND (e.updated_at > '{last_run}' OR ei.last_updated > '{last_run}')" if not is_full_refresh else ""}
    
    GROUP BY e.experience_id, e.title, e.short_description, e.full_description, 
             e.highlights, e.category, e.price, e.duration, e.location, 
             e.latitude, e.longitude, e.country, e.participants_allowed, 
             e.average_rating, e.total_reviews, e.created_at,
             u.first_name, u.last_name, ei.popularity_score, ei.sentiment_score,
             ei.recommendation_weight, ei.content_completeness_score, ei.intelligence_data,
             cluster_stats.dominant_clusters, cluster_stats.avg_cluster_rating
    ORDER BY e.experience_id
    """
    
    # Extract recent reviews for sentiment context
    reviews_query = f"""
    SELECT 
        r.experience_id,
        array_agg(
            jsonb_build_object(
                'rating', r.rating,
                'comment', r.comment,
                'review_date', r.created_at
            )
            ORDER BY r.created_at DESC
        ) as recent_reviews
    FROM review r
    JOIN experiences e ON r.experience_id = e.experience_id
    WHERE r.comment IS NOT NULL AND r.comment != ''
    {f"AND e.updated_at > '{last_run}'" if not is_full_refresh else ""}
    GROUP BY r.experience_id
    """
    
    # Extract similar experiences from experience intelligence
    similarities_query = f"""
    SELECT 
        es.experience_id,
        array_agg(
            jsonb_build_object(
                'similar_experience_id', es.similar_experience_id,
                'similarity_score', es.similarity_score,
                'similar_title', e.title,
                'similar_category', e.category
            )
            ORDER BY es.similarity_score DESC
        ) as similar_experiences
    FROM experience_similarities es
    JOIN experiences e ON es.similar_experience_id = e.experience_id
    WHERE es.similarity_score > 0.3  -- Only meaningful similarities
    GROUP BY es.experience_id
    """
    
    # Execute queries
    experiences_df = pd.read_sql(enhanced_experience_query, pg_hook.get_sqlalchemy_engine())
    reviews_df = pd.read_sql(reviews_query, pg_hook.get_sqlalchemy_engine())
    similarities_df = pd.read_sql(similarities_query, pg_hook.get_sqlalchemy_engine())
    
    print(f"Extracted {len(experiences_df)} experiences for knowledge base processing")
    print(f"Extracted reviews for {len(reviews_df)} experiences")
    print(f"Extracted similarities for {len(similarities_df)} experiences")
    
    # Save to XCom for next task
    return {
        'experiences_data': experiences_df.to_json(orient='records'),
        'reviews_data': reviews_df.to_json(orient='records'),
        'similarities_data': similarities_df.to_json(orient='records'),
        'is_full_refresh': is_full_refresh
    }

def extract_travel_articles(**context):
    """Extract published travel articles for knowledge base"""
    
    pg_hook = PostgresHook(postgres_conn_id='trippy_db')
    
    # Get last run timestamp from previous task
    watermark_data = context['ti'].xcom_pull(task_ids='get_last_run_timestamp')
    last_run = watermark_data['last_run_timestamp']
    is_full_refresh = watermark_data['is_full_refresh']
    
    # Extract published travel articles with author information
    articles_query = f"""
    SELECT 
        ta.article_id,
        ta.title,
        ta.content,
        ta.category,
        ta.tags,
        ta.views_count,
        ta.likes_count,
        ta.comments_count,
        ta.created_at,
        ta.updated_at,
        
        -- Author information
        u.first_name as author_first_name,
        u.last_name as author_last_name,
        u.user_id as author_id
        
    FROM travel_article ta
    JOIN users u ON ta.author_id = u.user_id
    WHERE ta.status = 'PUBLISHED'  -- Only published articles
    {f"AND ta.updated_at > '{last_run}'" if not is_full_refresh else ""}
    ORDER BY ta.created_at DESC
    """
    
    # Execute query
    articles_df = pd.read_sql(articles_query, pg_hook.get_sqlalchemy_engine())
    
    print(f"Extracted {len(articles_df)} published travel articles for knowledge base")
    
    # Save to XCom for next task
    return {
        'articles_data': articles_df.to_json(orient='records'),
        'is_full_refresh': is_full_refresh
    }

def create_knowledge_documents(**context):
    """Transform experience data and travel articles into rich knowledge documents for chatbot"""
    
    # Get data from previous tasks
    experience_data = context['ti'].xcom_pull(task_ids='extract_enhanced_experience_data')
    articles_data = context['ti'].xcom_pull(task_ids='extract_travel_articles')
    
    knowledge_documents = []
    
    # Process experience data
    if experience_data and experience_data['experiences_data']:
        experiences_df = pd.read_json(experience_data['experiences_data'])
        reviews_df = pd.read_json(experience_data['reviews_data'])
        similarities_df = pd.read_json(experience_data['similarities_data'])
        
        for _, experience in experiences_df.iterrows():
            experience_id = experience['experience_id']
            
            # Get additional data for this experience
            exp_reviews = reviews_df[reviews_df['experience_id'] == experience_id]
            exp_similarities = similarities_df[similarities_df['experience_id'] == experience_id]
            
            # Build comprehensive knowledge document
            knowledge_doc = build_experience_knowledge_document(
                experience, 
                exp_reviews.iloc[0] if len(exp_reviews) > 0 else None,
                exp_similarities.iloc[0] if len(exp_similarities) > 0 else None
            )
            
            knowledge_documents.append(knowledge_doc)
    
    # Process travel articles
    if articles_data and articles_data['articles_data']:
        articles_df = pd.read_json(articles_data['articles_data'])
        
        for _, article in articles_df.iterrows():
            # Build travel article knowledge document
            article_doc = build_article_knowledge_document(article)
            knowledge_documents.append(article_doc)
    
    print(f"Created {len(knowledge_documents)} total knowledge documents")
    print(f"- Experience documents: {len([d for d in knowledge_documents if d['document_type'] == 'experience'])}")
    print(f"- Article documents: {len([d for d in knowledge_documents if d['document_type'] == 'article'])}")
    
    return json.dumps(knowledge_documents)

def get_sentiment_label(sentiment_score: float) -> str:
    """Convert sentiment score to descriptive label based on defined rubrics"""
    
    if pd.isna(sentiment_score):
        return "unknown"
    
    score = float(sentiment_score)
    
    if 0.5 <= score <= 1.0:
        return "very positive (customers love it!)"
    elif 0.2 <= score <= 0.49:
        return "positive (customers recommend it)"
    elif 0.1 <= score <= 0.19:
        return "mildly positive (generally good feedback)"
    elif -0.1 <= score <= 0.1:
        return "neutral (mixed reviews)"
    elif -0.19 <= score <= -0.11:
        return "mildly negative (some disappointment)"
    elif -0.49 <= score <= -0.2:
        return "negative (not recommended by customers)"
    elif -1.0 <= score <= -0.5:
        return "very negative (poor customer experience)"
    else:
        return "unknown"

def build_experience_knowledge_document(experience: pd.Series, reviews_data: pd.Series, similarities_data: pd.Series) -> Dict[str, Any]:
    """Build a comprehensive knowledge document for an experience"""
    
    # Basic experience information
    basic_info = f"""
    {experience['title']}
    
    Category: {experience['category']}
    Location: {experience['location']}, {experience['country']}
    Duration: {experience['duration']} hours
    Price: ${experience['price']:.2f}
    Rating: {experience['average_rating']:.1f}/5 ({experience['total_reviews']} reviews)
    Max Participants: {experience['participants_allowed']}
    
    Description: {experience['short_description']}
    
    Full Experience: {experience['full_description']}
    
    Highlights: {experience['highlights']}
    """
    
    # Add guide information
    guide_info = ""
    if pd.notna(experience['guide_first_name']):
        guide_info = f"\nGuide: {experience['guide_first_name']} {experience['guide_last_name']}"
    
    # Add tags and categories
    tags_info = ""
    if experience['tags'] and len(experience['tags']) > 0:
        clean_tags = [tag for tag in experience['tags'] if tag is not None]
        if clean_tags:
            tags_info = f"\nTags: {', '.join(clean_tags)}"
    
    # Add intelligence insights
    intelligence_info = ""
    if pd.notna(experience['popularity_score']):
        popularity = experience['popularity_score']
        sentiment = experience['sentiment_score']
        
        # Convert sentiment score to descriptive label
        sentiment_label = get_sentiment_label(sentiment)
        
        intelligence_info = f"""
        
        Experience Insights:
        - Popularity Score: {popularity:.1f}/100
        - Customer Sentiment: {sentiment_label}
        - Recommendation Strength: {experience['recommendation_weight']:.1f}/100
        """
        
        # Add cluster preferences if available
        if experience['popular_with_clusters'] and experience['popular_with_clusters'] != '[]':
            try:
                clusters = json.loads(experience['popular_with_clusters']) if isinstance(experience['popular_with_clusters'], str) else experience['popular_with_clusters']
                if clusters:
                    cluster_info = []
                    for cluster in clusters:
                        cluster_info.append(f"User Group {cluster['cluster_id']} (avg rating: {cluster['avg_rating']:.1f})")
                    intelligence_info += f"\n- Popular with: {', '.join(cluster_info)}"
            except:
                pass
    
    # Add recent review themes
    review_insights = ""
    if reviews_data is not None and reviews_data['recent_reviews'] is not None:
        try:
            reviews = reviews_data['recent_reviews']
            if isinstance(reviews, str):
                reviews = json.loads(reviews)
            
            if reviews and len(reviews) > 0:
                # Extract key themes from recent reviews
                recent_comments = [r['comment'][:200] for r in reviews[:3] if r['comment']]
                if recent_comments:
                    review_insights = f"""
                    
                    Recent Customer Feedback:
                    {chr(10).join([f'- "{comment}..."' for comment in recent_comments])}
                    """
        except:
            pass
    
    # Add similar experiences
    similar_info = ""
    if similarities_data is not None and similarities_data['similar_experiences'] is not None:
        try:
            similar_exps = similarities_data['similar_experiences']
            if isinstance(similar_exps, str):
                similar_exps = json.loads(similar_exps)
            
            if similar_exps and len(similar_exps) > 0:
                top_similar = similar_exps[:3]  # Top 3 similar experiences
                similar_titles = [exp['similar_title'] for exp in top_similar]
                similar_info = f"""
                
                Similar Experiences You Might Like:
                {chr(10).join([f'- {title}' for title in similar_titles])}
                """
        except:
            pass
    
    # Combine all information into searchable content
    full_content = basic_info + guide_info + tags_info + intelligence_info + review_insights + similar_info
    
    # Create metadata for filtering and context
    metadata = {
        'experience_id': int(experience['experience_id']),
        'category': experience['category'],
        'location': experience['location'],
        'country': experience['country'],
        'price': float(experience['price']),
        'duration': float(experience['duration']),
        'rating': float(experience['average_rating']) if pd.notna(experience['average_rating']) else 0,
        'popularity_score': float(experience['popularity_score']) if pd.notna(experience['popularity_score']) else 0,
        'tags': experience['tags'] if experience['tags'] else [],
        'has_coordinates': pd.notna(experience['latitude']) and pd.notna(experience['longitude']),
        'participants_allowed': int(experience['participants_allowed'])
    }
    
    return {
        'document_id': f"experience_{experience['experience_id']}",
        'document_type': 'experience',
        'title': experience['title'],
        'content_text': full_content.strip(),
        'metadata': metadata,
        'source_experience_id': int(experience['experience_id']),
        'relevance_score': float(experience['recommendation_weight']) if pd.notna(experience['recommendation_weight']) else 50.0
    }

def build_article_knowledge_document(article: pd.Series) -> Dict[str, Any]:
    """Build a comprehensive knowledge document for a travel article"""
    
    # Clean HTML content if present (basic cleaning)
    content_text = article['content']
    if content_text:
        # Remove basic HTML tags for better text processing
        import re
        content_text = re.sub(r'<[^>]+>', ' ', content_text)
        content_text = re.sub(r'\s+', ' ', content_text).strip()
    
    # Parse tags from string format if needed
    tags = article['tags']
    if isinstance(tags, str):
        try:
            # Handle PostgreSQL array format or JSON array
            if tags.startswith('{') and tags.endswith('}'):
                tags = tags[1:-1].split(',')
            else:
                import json
                tags = json.loads(tags)
        except:
            tags = [tags] if tags else []
    
    # Build comprehensive article content
    article_info = f"""
    {article['title']}
    
    Category: {article['category']}
    Author: {article['author_first_name']} {article['author_last_name']}
    
    Article Content:
    {content_text}
    """
    
    # Add tags and engagement info
    engagement_info = ""
    if tags:
        clean_tags = [tag.strip() for tag in tags if tag and tag.strip()]
        if clean_tags:
            engagement_info += f"\nTags: {', '.join(clean_tags)}"
    
    # Add engagement metrics
    if pd.notna(article['views_count']) or pd.notna(article['likes_count']):
        engagement_info += f"""
        
        Article Stats:
        - Views: {article['views_count'] if pd.notna(article['views_count']) else 0}
        - Likes: {article['likes_count'] if pd.notna(article['likes_count']) else 0}
        - Comments: {article['comments_count'] if pd.notna(article['comments_count']) else 0}
        """
    
    # Combine all information
    full_content = article_info + engagement_info
    
    # Create metadata for filtering and context
    metadata = {
        'article_id': int(article['article_id']),
        'category': article['category'],
        'author_id': int(article['author_id']),
        'author_name': f"{article['author_first_name']} {article['author_last_name']}",
        'tags': clean_tags if 'clean_tags' in locals() else [],
        'views_count': int(article['views_count']) if pd.notna(article['views_count']) else 0,
        'likes_count': int(article['likes_count']) if pd.notna(article['likes_count']) else 0,
        'content_length': len(content_text) if content_text else 0,
        'created_date': article['created_at'].strftime('%Y-%m-%d') if pd.notna(article['created_at']) else None
    }
    
    # Calculate relevance score based on engagement
    views = metadata['views_count']
    likes = metadata['likes_count']
    content_length = metadata['content_length']
    
    # Simple relevance scoring: normalized engagement + content quality
    relevance_score = min(
        (views / 100 * 30) +           # Views contribution (cap at 100 views = 30 points)
        (likes / 10 * 20) +            # Likes contribution (cap at 10 likes = 20 points)
        (min(content_length / 1000, 1) * 30) +  # Content length (cap at 1000 chars = 30 points)
        20,  # Base score for published articles
        100  # Maximum score
    )
    
    return {
        'document_id': f"article_{article['article_id']}",
        'document_type': 'article',
        'title': article['title'],
        'content_text': full_content.strip(),
        'metadata': metadata,
        'source_article_id': int(article['article_id']),
        'relevance_score': float(relevance_score)
    }

def generate_embeddings(**context):
    """Generate OpenAI embeddings for knowledge documents"""
    
    # Get knowledge documents from previous task
    documents_json = context['ti'].xcom_pull(task_ids='create_knowledge_documents')
    documents = json.loads(documents_json)
    
    if not os.getenv('OPENAI_API_KEY'):
        raise ValueError("OPENAI_API_KEY environment variable is required for embedding generation")
    
    print(f"Generating embeddings for {len(documents)} documents")
    
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

def store_knowledge_base(**context):
    """Store knowledge documents with embeddings in database"""
    
    # Get embedded documents
    documents_json = context['ti'].xcom_pull(task_ids='generate_embeddings')
    documents = json.loads(documents_json)
    
    # Get refresh mode
    extraction_data = context['ti'].xcom_pull(task_ids='extract_enhanced_experience_data')
    is_full_refresh = extraction_data['is_full_refresh']
    
    pg_hook = PostgresHook(postgres_conn_id='trippy_db')
    
    # Create experience knowledge base tables if they don't exist
    create_tables_sql = """
    -- Enable pgvector extension
    CREATE EXTENSION IF NOT EXISTS vector;
    
    -- Main experience knowledge base table
    CREATE TABLE IF NOT EXISTS experience_knowledge_base (
        document_id VARCHAR(255) PRIMARY KEY,
        document_type VARCHAR(50) NOT NULL,
        title VARCHAR(500),
        content_text TEXT NOT NULL,
        embedding vector(1536),  -- OpenAI text-embedding-3-small dimension
        metadata JSONB,
        relevance_score DECIMAL(5,2),
        source_experience_id BIGINT,
        source_article_id BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create indexes for efficient searching
    CREATE INDEX IF NOT EXISTS idx_experience_knowledge_base_type 
        ON experience_knowledge_base(document_type);
    CREATE INDEX IF NOT EXISTS idx_experience_knowledge_base_relevance 
        ON experience_knowledge_base(relevance_score DESC);
    CREATE INDEX IF NOT EXISTS idx_experience_knowledge_base_source 
        ON experience_knowledge_base(source_experience_id);
    CREATE INDEX IF NOT EXISTS idx_experience_knowledge_base_metadata 
        ON experience_knowledge_base USING gin(metadata);
    
    -- Vector similarity index (using cosine distance)
    CREATE INDEX IF NOT EXISTS idx_experience_knowledge_base_embedding 
        ON experience_knowledge_base USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
    """
    
    pg_hook.run(create_tables_sql)
    
    # Clear existing data if full refresh
    if is_full_refresh:
        print("Full refresh mode: Clearing existing experience knowledge base documents")
        pg_hook.run("DELETE FROM experience_knowledge_base WHERE document_type IN ('experience', 'article')")
    
    # Insert/update documents
    for doc in documents:
        if 'embedding' not in doc:
            print(f"Skipping document {doc['document_id']} - no embedding generated")
            continue
        
        # Convert embedding list to PostgreSQL vector format
        embedding_vector = doc['embedding']
        
        upsert_sql = """
        INSERT INTO experience_knowledge_base (
            document_id, document_type, title, content_text, embedding, 
            metadata, relevance_score, source_experience_id, source_article_id, updated_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        ON CONFLICT (document_id)
        DO UPDATE SET 
            document_type = EXCLUDED.document_type,
            title = EXCLUDED.title,
            content_text = EXCLUDED.content_text,
            embedding = EXCLUDED.embedding,
            metadata = EXCLUDED.metadata,
            relevance_score = EXCLUDED.relevance_score,
            source_experience_id = EXCLUDED.source_experience_id,
            source_article_id = EXCLUDED.source_article_id,
            updated_at = CURRENT_TIMESTAMP
        """
        
        pg_hook.run(upsert_sql, parameters=[
            doc['document_id'],
            doc['document_type'],
            doc['title'],
            doc['content_text'],
            embedding_vector,
            json.dumps(doc['metadata']),
            doc['relevance_score'],
            doc.get('source_experience_id'),  # Will be None for articles
            doc.get('source_article_id')     # Will be None for experiences
        ])
    
    print(f"Successfully stored {len(documents)} experience knowledge base documents")
    
    # Update statistics
    stats_result = pg_hook.get_first("""
        SELECT 
            COUNT(*) as total_docs,
            COUNT(*) FILTER (WHERE document_type = 'experience') as experience_docs,
            AVG(relevance_score) as avg_relevance
        FROM experience_knowledge_base
    """)
    
    if stats_result:
        print(f"Experience knowledge base statistics:")
        print(f"- Total documents: {stats_result[0]}")
        print(f"- Experience documents: {stats_result[1]}")
        avg_relevance = stats_result[2] if stats_result[2] is not None else 0.0
        print(f"- Average relevance score: {avg_relevance:.2f}")
    
    return "Experience knowledge base storage completed successfully"

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
    
    pg_hook.run(upsert_watermark, parameters=['experience_knowledge_base'])
    
    # Get the updated timestamp for logging
    result = pg_hook.get_first("""
        SELECT last_run_timestamp 
        FROM pipeline_watermarks 
        WHERE pipeline_name = 'experience_knowledge_base'
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
    task_id='extract_enhanced_experience_data',
    python_callable=extract_enhanced_experience_data,
    dag=dag,
)

extract_articles_task = PythonOperator(
    task_id='extract_travel_articles',
    python_callable=extract_travel_articles,
    dag=dag,
)

create_documents_task = PythonOperator(
    task_id='create_knowledge_documents',
    python_callable=create_knowledge_documents,
    dag=dag,
)

generate_embeddings_task = PythonOperator(
    task_id='generate_embeddings',
    python_callable=generate_embeddings,
    dag=dag,
)

store_knowledge_task = PythonOperator(
    task_id='store_knowledge_base',
    python_callable=store_knowledge_base,
    dag=dag,
)

update_watermark_task = PythonOperator(
    task_id='update_watermark',
    python_callable=update_watermark,
    dag=dag,
)

# Define task dependencies
# Flow: Get watermark -> Extract both experiences and articles in parallel -> Create documents -> Generate embeddings -> Store -> Update watermark
get_watermark_task >> [extract_task, extract_articles_task] >> create_documents_task >> generate_embeddings_task >> store_knowledge_task >> update_watermark_task