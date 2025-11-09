from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from textblob import TextBlob
import json
import re
from collections import Counter

# Initialize NLTK data (with fallback for SSL issues)
try:
    import nltk
    nltk.data.find('tokenizers/punkt')
except (LookupError, OSError):
    try:
        import ssl
        ssl._create_default_https_context = ssl._create_unverified_context
        nltk.download('punkt', quiet=True)
        nltk.download('brown', quiet=True)
    except:
        print("Warning: NLTK data download failed. TextBlob may have limited functionality.")
        pass

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
    'experience_intelligence',
    default_args=default_args,
    description='Analyze experiences for recommendations and chatbot intelligence',
    schedule=timedelta(hours=24),  # Run every 24 hours
    start_date=datetime(2024, 10, 1),
    catchup=False,
    tags=['analytics', 'recommendations', 'experience-intelligence'],
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
        WHERE pipeline_name = 'experience_intelligence'
    """)
    
    # Determine if this is a full refresh day (every Monday)
    execution_date = context['execution_date']
    is_full_refresh = execution_date.weekday() == 0  # 0 = Monday
    
    # Check if experience_intelligence table exists and has data
    # If empty, force full refresh (auto-recovery mechanism)
    intelligence_table_count = pg_hook.get_first("""
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_name = 'experience_intelligence'
    """)
    
    if intelligence_table_count and intelligence_table_count[0] > 0:
        # Table exists, check if it has data
        intelligence_count = pg_hook.get_first("SELECT COUNT(*) FROM experience_intelligence")
        if intelligence_count and intelligence_count[0] == 0:
            print("WARNING: experience_intelligence table is empty. Forcing full refresh for recovery.")
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

def extract_experience_data(**context):
    """Extract experience, review, and booking data for intelligence processing (incremental or full)"""
    
    pg_hook = PostgresHook(postgres_conn_id='trippy_db')
    
    # Get last run timestamp from previous task
    watermark_data = context['ti'].xcom_pull(task_ids='get_last_run_timestamp')
    last_run = watermark_data['last_run_timestamp']
    is_full_refresh = watermark_data['is_full_refresh']
    
    # Extract comprehensive experience data
    # In incremental mode: get experiences updated/created since last run OR with new reviews/bookings
    experience_query = f"""
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
        e.total_stars,
        e.total_reviews,
        e.average_rating,
        e.created_at,
        u.first_name as guide_first_name,
        u.last_name as guide_last_name,
        array_agg(DISTINCT et.tags) FILTER (WHERE et.tags IS NOT NULL) as tags
    FROM experiences e
    LEFT JOIN users u ON e.guide_id = u.user_id
    LEFT JOIN experience_tags et ON e.experience_id = et.experience_experience_id
    LEFT JOIN review r ON e.experience_id = r.experience_id
    LEFT JOIN experience_schedule es ON e.experience_id = es.experience_id
    LEFT JOIN booking b ON es.schedule_id = b.experience_schedule_id
    WHERE e.status = 'ACTIVE'
    {f"AND (e.created_at > '{last_run}' OR e.updated_at > '{last_run}' OR r.created_at > '{last_run}' OR b.booking_date > '{last_run}')" if not is_full_refresh else ""}
    GROUP BY e.experience_id, e.title, e.short_description, e.full_description, 
             e.highlights, e.category, e.price, e.duration, e.location, 
             e.latitude, e.longitude, e.country, e.participants_allowed, 
             e.total_stars, e.total_reviews, e.average_rating, e.created_at,
             u.first_name, u.last_name
    """
    
    # Execute experience query first to get the list of experiences to process
    experience_df = pd.read_sql(experience_query, pg_hook.get_sqlalchemy_engine())
    
    print(f"Extracted {len(experience_df)} experiences for processing")
    
    # If no experiences to process, return empty data
    if len(experience_df) == 0:
        return {
            'experience_data': '[]',
            'review_data': '[]',
            'booking_data': '[]',
            'itinerary_data': '[]',
            'is_full_refresh': is_full_refresh
        }
    
    # Get list of experience IDs to process
    experience_ids = experience_df['experience_id'].tolist()
    experience_ids_str = ','.join(map(str, experience_ids))
    
    # Extract review data with sentiment indicators (ALL reviews for selected experiences)
    review_query = f"""
    SELECT 
        r.experience_id,
        r.rating,
        r.title as review_title,
        r.comment,
        r.created_at as review_date,
        u.first_name as reviewer_first_name
    FROM review r
    JOIN users u ON r.reviewer_id = u.user_id
    WHERE r.comment IS NOT NULL AND r.comment != ''
    AND r.experience_id IN ({experience_ids_str})
    ORDER BY r.created_at DESC
    """
    
    # Extract booking patterns and popularity data (ALL bookings for selected experiences)
    booking_query = f""" 
    SELECT 
        e.experience_id,
        COUNT(b.booking_id) as total_bookings,
        COUNT(CASE WHEN b.status = 'COMPLETED' THEN 1 END) as completed_bookings,
        AVG(b.total_amount) as avg_booking_amount,
        COUNT(DISTINCT b.traveler_id) as unique_travelers,
        MIN(b.booking_date) as first_booking_date,
        MAX(b.booking_date) as latest_booking_date,
        -- Seasonal patterns
        COUNT(CASE WHEN EXTRACT(MONTH FROM es.start_date_time) IN (12,1,2) THEN 1 END) as winter_bookings,
        COUNT(CASE WHEN EXTRACT(MONTH FROM es.start_date_time) IN (3,4,5) THEN 1 END) as spring_bookings,
        COUNT(CASE WHEN EXTRACT(MONTH FROM es.start_date_time) IN (6,7,8) THEN 1 END) as summer_bookings,
        COUNT(CASE WHEN EXTRACT(MONTH FROM es.start_date_time) IN (9,10,11) THEN 1 END) as autumn_bookings,
        -- Recent popularity (last 30 days)
        COUNT(CASE WHEN b.booking_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_bookings
    FROM experiences e
    LEFT JOIN experience_schedule es ON e.experience_id = es.experience_id
    LEFT JOIN booking b ON es.schedule_id = b.experience_schedule_id
    WHERE e.experience_id IN ({experience_ids_str})
    GROUP BY e.experience_id
    """
    
    # Extract itinerary data for content richness (only for selected experiences)
    itinerary_query = f"""
    SELECT 
        ei.experience_id,
        array_agg(ei.stop_order ORDER BY ei.stop_order) as stop_orders,
        array_agg(ei.stop_type ORDER BY ei.stop_order) as stop_types,
        array_agg(ei.location_name ORDER BY ei.stop_order) as location_names,
        array_agg(ei.duration ORDER BY ei.stop_order) as durations,
        COUNT(*) as total_stops
    FROM experience_itinerary ei
    WHERE ei.experience_id IN ({experience_ids_str})
    GROUP BY ei.experience_id
    """
    
    # Execute remaining queries
    review_df = pd.read_sql(review_query, pg_hook.get_sqlalchemy_engine())
    booking_df = pd.read_sql(booking_query, pg_hook.get_sqlalchemy_engine())
    itinerary_df = pd.read_sql(itinerary_query, pg_hook.get_sqlalchemy_engine())
    
    print(f"Extracted {len(review_df)} reviews")
    print(f"Extracted booking data for {len(booking_df)} experiences")
    print(f"Extracted itinerary data for {len(itinerary_df)} experiences")
    
    # Save to XCom for next task
    return {
        'experience_data': experience_df.to_json(orient='records'),
        'review_data': review_df.to_json(orient='records'),
        'booking_data': booking_df.to_json(orient='records'),
        'itinerary_data': itinerary_df.to_json(orient='records'),
        'is_full_refresh': is_full_refresh
    }

def analyze_content_features(**context):
    """Analyze content features and extract meaningful insights from experience descriptions"""
    
    # Get data from previous task
    data = context['ti'].xcom_pull(task_ids='extract_experience_data')
    
    experience_df = pd.read_json(data['experience_data'])
    review_df = pd.read_json(data['review_data'])
    
    # Handle potentially empty itinerary data
    itinerary_json = data['itinerary_data']
    if itinerary_json and itinerary_json != '[]':
        itinerary_df = pd.read_json(itinerary_json)
    else:
        # Create empty DataFrame with expected columns
        itinerary_df = pd.DataFrame(columns=['experience_id', 'stop_orders', 'stop_types', 
                                              'location_names', 'durations', 'total_stops'])
    
    content_features = []
    
    for _, experience in experience_df.iterrows():
        experience_id = experience['experience_id']
        
        # Combine all text content for comprehensive analysis
        text_content = []
        if pd.notna(experience['title']):
            text_content.append(experience['title'])
        if pd.notna(experience['short_description']):
            text_content.append(experience['short_description'])
        if pd.notna(experience['full_description']):
            text_content.append(experience['full_description'])
        if pd.notna(experience['highlights']):
            text_content.append(experience['highlights'])
        
        # Add itinerary content if available for an experience
        itinerary_data = itinerary_df[itinerary_df['experience_id'] == experience_id]
        if len(itinerary_data) > 0:
            # Combine stop types and location names for content analysis
            stop_types = itinerary_data['stop_types'].iloc[0]
            location_names = itinerary_data['location_names'].iloc[0]
            
            if stop_types:
                text_content.extend(stop_types)
            if location_names:
                text_content.extend(location_names)
        
        combined_content = ' '.join(text_content)
        
        # Extract content features
        content_analysis = {
            'experience_id': experience_id,
            'content_length': len(combined_content),
            'word_count': len(combined_content.split()),
            'has_itinerary': len(itinerary_data) > 0,
            'itinerary_stops': int(itinerary_data['total_stops'].iloc[0]) if len(itinerary_data) > 0 else 0,
            
            # Content quality indicators
            'has_highlights': pd.notna(experience['highlights']),
            'description_richness': len(experience['full_description']) if pd.notna(experience['full_description']) else 0,
            
            # Extract activity keywords
            'activity_keywords': extract_activity_keywords(combined_content),
            'difficulty_indicators': extract_difficulty_indicators(combined_content),
            'duration_category': categorize_duration(experience['duration']),
            'price_category': categorize_price(experience['price']),
            
            # Location and logistics
            'location_type': analyze_location_type(experience['location']),
            'has_coordinates': pd.notna(experience['latitude']) and pd.notna(experience['longitude']),
            
            # Combined content for similarity analysis
            'processed_content': clean_text_for_similarity(combined_content)
        }
        
        content_features.append(content_analysis)
    
    return json.dumps(content_features)

def extract_activity_keywords(text):
    """Extract activity-related keywords from text content"""
    if not text:
        return []
    
    # Define activity keyword categories
    activity_patterns = {
        'adventure': ['hiking', 'climbing', 'adventure', 'extreme', 'adrenaline', 'zip', 'rappel', 'trek'],
        'cultural': ['museum', 'historical', 'culture', 'heritage', 'tradition', 'local', 'authentic', 'temple', 'monument'],
        'nature': ['wildlife', 'nature', 'forest', 'mountain', 'beach', 'ocean', 'river', 'waterfall', 'scenic'],
        'food': ['food', 'culinary', 'cooking', 'taste', 'restaurant', 'market', 'cuisine', 'chef'],
        'relaxation': ['spa', 'wellness', 'relax', 'peaceful', 'meditation', 'yoga', 'massage'],
        'social': ['group', 'festival', 'celebration', 'community', 'party', 'nightlife', 'social'],
        'photography': ['photo', 'photography', 'instagram', 'scenic', 'viewpoint', 'sunset', 'sunrise']
    }
    
    text_lower = text.lower()
    found_keywords = {}
    
    for category, keywords in activity_patterns.items():
        # all keywords from keywords that appear in text_lower
        matches = [keyword for keyword in keywords if keyword in text_lower]
        if matches:
            found_keywords[category] = matches
    
    return found_keywords

def extract_difficulty_indicators(text):
    """Extract difficulty/fitness level indicators"""
    if not text:
        return 'unknown'
    
    text_lower = text.lower()
    
    if any(word in text_lower for word in ['easy', 'beginner', 'gentle', 'leisurely', 'relaxed']):
        return 'easy'
    elif any(word in text_lower for word in ['moderate', 'intermediate', 'average']):
        return 'moderate'
    elif any(word in text_lower for word in ['challenging', 'difficult', 'strenuous', 'advanced', 'expert']):
        return 'challenging'
    else:
        return 'unknown'

def categorize_duration(duration):
    """Categorize experience duration"""
    if pd.isna(duration):
        return 'unknown'
    
    try:
        duration_hours = float(duration)
        if duration_hours <= 2:
            return 'short'  # 2 hours or less
        elif duration_hours <= 6:
            return 'half_day'  # 2-6 hours
        elif duration_hours <= 12:
            return 'full_day'  # 6-12 hours
        else:
            return 'multi_day'  # More than 12 hours
    except (ValueError, TypeError):
        return 'unknown'

def categorize_price(price):
    """Categorize experience price"""
    if pd.isna(price):
        return 'unknown'
    
    try:
        price_value = float(price)
        if price_value <= 50:
            return 'budget'
        elif price_value <= 150:
            return 'moderate'
        elif price_value <= 300:
            return 'premium'
        else:
            return 'luxury'
    except (ValueError, TypeError):
        return 'unknown'

def analyze_location_type(location):
    """Analyze location type from location string"""
    if not location:
        return 'unknown'
    
    location_lower = location.lower()
    
    if any(word in location_lower for word in ['beach', 'coast', 'ocean', 'sea']):
        return 'coastal'
    elif any(word in location_lower for word in ['mountain', 'hill', 'peak', 'altitude']):
        return 'mountain'
    elif any(word in location_lower for word in ['city', 'urban', 'downtown', 'center']):
        return 'urban'
    elif any(word in location_lower for word in ['forest', 'jungle', 'woods', 'nature']):
        return 'nature'
    elif any(word in location_lower for word in ['desert', 'sand']):
        return 'desert'
    else:
        return 'mixed'

def clean_text_for_similarity(text):
    """Clean and prepare text for similarity analysis"""
    if not text:
        return ""
    
    # Remove special characters and normalize
    text = re.sub(r'[^a-zA-Z\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.lower().strip()

def analyze_sentiment_and_popularity(**context):
    """Analyze review sentiment and calculate popularity scores"""
    
    # Get data from previous tasks
    data = context['ti'].xcom_pull(task_ids='extract_experience_data')
    content_features = json.loads(context['ti'].xcom_pull(task_ids='analyze_content_features'))
    
    experience_df = pd.read_json(data['experience_data'])
    review_df = pd.read_json(data['review_data'])
    booking_df = pd.read_json(data['booking_data'])
    
    intelligence_data = []
    
    for _, experience in experience_df.iterrows():
        experience_id = experience['experience_id']
        
        # Get reviews for this experience
        exp_reviews = review_df[review_df['experience_id'] == experience_id]
        
        # Get booking data for this experience
        exp_bookings = booking_df[booking_df['experience_id'] == experience_id]
        booking_info = exp_bookings.iloc[0] if len(exp_bookings) > 0 else None
        
        # Get content features for this experience
        content_info = next((item for item in content_features if item['experience_id'] == experience_id), {})
        
        # Sentiment Analysis
        sentiment_scores = []
        review_themes = []
        
        for _, review in exp_reviews.iterrows():
            # Removes Empty or Missing Comments
            if pd.notna(review['comment']) and review['comment'].strip(): 
                # Analyze sentiment using TextBlob
                blob = TextBlob(review['comment'])
                sentiment_scores.append(blob.sentiment.polarity)
                
                # Extract themes/topics from reviews
                review_themes.extend(extract_review_themes(review['comment']))
        
        # Calculate sentiment metrics
        # Get the average sentiment score of all reviews
        avg_sentiment = np.mean(sentiment_scores) if sentiment_scores else 0.0
        sentiment_distribution = {
            'positive': len([s for s in sentiment_scores if s > 0.1]),
            'neutral': len([s for s in sentiment_scores if -0.1 <= s <= 0.1]),
            'negative': len([s for s in sentiment_scores if s < -0.1])
        }
        
        # Calculate popularity score (0-100)
        popularity_score = calculate_popularity_score(
            total_bookings=booking_info['total_bookings'] if booking_info is not None else 0,
            recent_bookings=booking_info['recent_bookings'] if booking_info is not None else 0,
            avg_rating=experience['average_rating'] if pd.notna(experience['average_rating']) else 0,
            total_reviews=experience['total_reviews'] if pd.notna(experience['total_reviews']) else 0,
            completion_rate=booking_info['completed_bookings'] / booking_info['total_bookings'] 
                           if booking_info is not None and booking_info['total_bookings'] > 0 else 0
        )
        
        # Calculate seasonal popularity
        seasonal_popularity = {}
        if booking_info is not None:
            total_seasonal = (booking_info['winter_bookings'] + booking_info['spring_bookings'] + 
                            booking_info['summer_bookings'] + booking_info['autumn_bookings'])
            if total_seasonal > 0:
                seasonal_popularity = {
                    'winter': booking_info['winter_bookings'] / total_seasonal,
                    'spring': booking_info['spring_bookings'] / total_seasonal,
                    'summer': booking_info['summer_bookings'] / total_seasonal,
                    'autumn': booking_info['autumn_bookings'] / total_seasonal
                }
        
        # Compile intelligence data
        intelligence_record = {
            'experience_id': experience_id,
            'title': experience['title'],
            'category': experience['category'],
            'location': experience['location'],
            'country': experience['country'],
            
            # Content intelligence
            'content_features': content_info,
            
            # Sentiment intelligence
            'sentiment_score': float(avg_sentiment),
            'sentiment_distribution': sentiment_distribution,
            'review_themes': dict(Counter(review_themes).most_common(10)),
            
            # Popularity intelligence
            'popularity_score': float(popularity_score),
            'seasonal_popularity': seasonal_popularity,
            'booking_velocity': float(booking_info['recent_bookings']) if booking_info is not None else 0.0,
            
            # Quality indicators
            'review_quality_score': calculate_review_quality_score(exp_reviews),
            'content_completeness_score': calculate_content_completeness(experience, content_info),
            
            # Recommendation features
            'recommendation_weight': calculate_recommendation_weight(popularity_score, avg_sentiment, 
                                                                  experience['average_rating'] if pd.notna(experience['average_rating']) else 0)
        }
        
        intelligence_data.append(intelligence_record)
    
    return json.dumps(intelligence_data)

def extract_review_themes(review_text):
    """Extract themes/topics from review text"""
    if not review_text:
        return []
    
    theme_keywords = {
        'guide_quality': ['guide', 'instructor', 'leader', 'host'],
        'value_for_money': ['worth', 'value', 'price', 'expensive', 'cheap', 'money'],
        'organization': ['organized', 'planned', 'schedule', 'timing', 'punctual'],
        'safety': ['safe', 'safety', 'secure', 'dangerous', 'risk'],
        'scenery': ['beautiful', 'scenic', 'view', 'landscape', 'stunning'],
        'difficulty': ['easy', 'hard', 'difficult', 'challenging', 'tough'],
        'group_size': ['crowded', 'intimate', 'small', 'large', 'group'],
        'weather': ['weather', 'rain', 'sunny', 'cold', 'hot'],
        'food': ['food', 'meal', 'lunch', 'snack', 'hungry'],
        'transportation': ['transport', 'pickup', 'bus', 'car', 'walk']
    }
    
    text_lower = review_text.lower()
    found_themes = []
    
    for theme, keywords in theme_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            found_themes.append(theme)
    
    return found_themes

def calculate_popularity_score(total_bookings, recent_bookings, avg_rating, total_reviews, completion_rate):
    """Calculate a comprehensive popularity score (0-100)"""
    
    # Normalize components (0-1 scale)
    booking_score = min(total_bookings / 100, 1.0)  # Cap at 100 bookings for normalization
    recent_score = min(recent_bookings / 10, 1.0)   # Cap at 10 recent bookings
    rating_score = avg_rating / 5.0 if avg_rating > 0 else 0
    review_score = min(total_reviews / 50, 1.0)     # Cap at 50 reviews
    completion_score = completion_rate
    
    # Weighted combination
    popularity = (
        booking_score * 0.3 +      # 30% booking volume
        recent_score * 0.25 +      # 25% recent activity
        rating_score * 0.25 +      # 25% rating quality
        review_score * 0.1 +       # 10% review volume
        completion_score * 0.1     # 10% completion rate
    )
    
    return min(popularity * 100, 100)  # Scale to 0-100

def calculate_review_quality_score(reviews_df):
    """Calculate review quality score based on review characteristics"""
    if len(reviews_df) == 0:
        return 0.0
    
    # Factors: review length, recent reviews, rating distribution
    avg_review_length = reviews_df['comment'].str.len().mean() if 'comment' in reviews_df.columns else 0
    length_score = min(avg_review_length / 200, 1.0)  # Normalize to 200 chars
    
    # Recent review activity (last 90 days)
    recent_reviews = len(reviews_df[pd.to_datetime(reviews_df['review_date']) >= 
                                   pd.Timestamp.now() - pd.Timedelta(days=90)])
    recency_score = min(recent_reviews / 10, 1.0)
    
    return (length_score * 0.7 + recency_score * 0.3) * 100

def calculate_content_completeness(experience, content_features):
    """Calculate content completeness score"""
    score = 0
    
    # Basic content
    if pd.notna(experience['title']): score += 10
    if pd.notna(experience['short_description']): score += 15
    if pd.notna(experience['full_description']): score += 20
    if pd.notna(experience['highlights']): score += 15
    if pd.notna(experience['price']): score += 10
    if pd.notna(experience['duration']): score += 10
    
    # Enhanced content
    if content_features.get('has_itinerary', False): score += 10
    if content_features.get('has_coordinates', False): score += 5
    if content_features.get('description_richness', 0) > 200: score += 5
    
    return min(score, 100)

def calculate_recommendation_weight(popularity_score, sentiment_score, avg_rating):
    """Calculate recommendation weight for ranking experiences"""
    
    # Normalize sentiment score (-1 to 1) to (0 to 1)
    normalized_sentiment = (sentiment_score + 1) / 2
    
    # Normalize rating (0 to 5) to (0 to 1)
    normalized_rating = avg_rating / 5.0 if avg_rating > 0 else 0
    
    # Normalize popularity (0 to 100) to (0 to 1)
    normalized_popularity = popularity_score / 100
    
    # Weighted combination
    weight = (
        normalized_popularity * 0.4 +    # 40% popularity
        normalized_rating * 0.35 +       # 35% rating
        normalized_sentiment * 0.25      # 25% sentiment
    )
    
    return weight * 100  # Scale to 0-100

def build_similarity_text(exp_data):
    """Build text representation for similarity computation from experience data"""
    content_features = exp_data.get('content_features', {})
    
    # Combine relevant text features for similarity
    similarity_text = []
    
    # Add category and activity keywords
    if exp_data.get('category'):
        similarity_text.append(exp_data['category'])
    
    # Add activity keywords
    activity_keywords = content_features.get('activity_keywords', {})
    for category, keywords in activity_keywords.items():
        similarity_text.extend(keywords)
    
    # Add difficulty and duration info
    similarity_text.append(content_features.get('difficulty_indicators', ''))
    similarity_text.append(content_features.get('duration_category', ''))
    similarity_text.append(content_features.get('price_category', ''))
    similarity_text.append(content_features.get('location_type', ''))
    
    # Add processed content
    if content_features.get('processed_content'):
        similarity_text.append(content_features['processed_content'][:500])  # Limit length
    
    return ' '.join(filter(None, similarity_text))

def compute_experience_similarities(**context):
    """Compute experience similarities for recommendation engine
    
    NOTE: This function always computes similarities using ALL experiences by merging:
    - Existing experiences from the database
    - New/updated experiences from the current run (not yet saved to DB)
    
    This ensures new experiences are compared against the full catalog, not just other
    new experiences. Only the processed experiences get their similarity records updated
    in the database.
    """
    
    # Get intelligence data from current run (might be only a few experiences in incremental mode)
    intelligence_json = context['ti'].xcom_pull(task_ids='analyze_sentiment_and_popularity')
    intelligence_data = json.loads(intelligence_json)
    
    # Get ALL experiences from database for complete similarity computation
    pg_hook = PostgresHook(postgres_conn_id='trippy_db')
    
    # Create experience_intelligence table if it doesn't exist (needed for first run)
    create_intelligence_table = """
    CREATE TABLE IF NOT EXISTS experience_intelligence (
        experience_id BIGINT PRIMARY KEY,
        intelligence_data JSONB,
        popularity_score DECIMAL(5,2),
        sentiment_score DECIMAL(4,3),
        recommendation_weight DECIMAL(5,2),
        content_completeness_score INTEGER,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """
    pg_hook.run(create_intelligence_table)
    
    # Load ALL experience intelligence data from database for similarity comparison
    all_experiences_query = """
    SELECT 
        experience_id,
        intelligence_data
    FROM experience_intelligence
    ORDER BY experience_id
    """
    
    all_exp_df = pd.read_sql(all_experiences_query, pg_hook.get_sqlalchemy_engine())
    
    # If table is empty (first run), use only current run's data
    if len(all_exp_df) == 0:
        print("First run detected: experience_intelligence table is empty")
        print(f"Computing similarities using {len(intelligence_data)} experiences from current run only")
        
        # Use current run's intelligence data for similarity computation
        experience_texts = [build_similarity_text(exp) for exp in intelligence_data]
        experience_ids = [exp['experience_id'] for exp in intelligence_data]
    else:
        # Normal mode: MERGE database experiences with current run's new experiences
        print(f"Loaded {len(all_exp_df)} experiences from database")
        print(f"Current run processing {len(intelligence_data)} experiences")
        
        # Get IDs of experiences being processed in current run
        current_exp_ids = {exp['experience_id'] for exp in intelligence_data}
        
        # Merge: existing experiences from DB + new experiences from current run
        all_experiences = []

        # Add existing experiences from database (excluding any that are in current run to avoid duplicates)
        for _, row in all_exp_df.iterrows():
            if row['experience_id'] not in current_exp_ids:
                # Parse intelligence_data from JSON string to dict if needed
                intel_data = row['intelligence_data']
                if isinstance(intel_data, str):
                    intel_data = json.loads(intel_data)
                all_experiences.append(intel_data)

        # Add all experiences from current run (includes both new and updated)
        all_experiences.extend(intelligence_data)
        
        print(f"Computing similarities using {len(all_experiences)} total experiences (merged)")
        print(f"Will update similarity records for {len(intelligence_data)} processed experiences")
        
        # Prepare content for similarity analysis using ALL experiences
        experience_texts = [build_similarity_text(exp_data) for exp_data in all_experiences]
        experience_ids = [exp_data['experience_id'] for exp_data in all_experiences]
    
    # Compute TF-IDF vectors for ALL experiences
    # Use min_df=1 for small datasets to avoid filtering out all terms
    min_doc_freq = min(2, len(experience_texts))
    vectorizer = TfidfVectorizer(
        max_features=1000,
        stop_words='english',
        ngram_range=(1, 2),
        min_df=min_doc_freq
    )
    
    if len(experience_texts) > 1:
        # Convert text to TF-IDF vectors (for ALL experiences in database)
        tfidf_matrix = vectorizer.fit_transform(experience_texts)
        
        # Compute cosine similarity matrix (full matrix for ALL experiences)
        similarity_matrix = cosine_similarity(tfidf_matrix)
        
        print(f"Computed {similarity_matrix.shape[0]}x{similarity_matrix.shape[1]} similarity matrix")
        
        # Create similarity recommendations for ALL experiences
        all_similarities = {}
        for i, exp_id in enumerate(experience_ids):
            # Get top 10 similar experiences (excluding self)
            similar_indices = similarity_matrix[i].argsort()[-11:-1][::-1]  # Top 10, reverse order
            similar_experiences = [
                {
                    'experience_id': experience_ids[idx],
                    'similarity_score': float(similarity_matrix[i][idx])
                }
                for idx in similar_indices
                if similarity_matrix[i][idx] > 0.1  # Only include meaningful similarities
            ]
            
            all_similarities[exp_id] = similar_experiences
        
        # Only add similarity data to the experiences processed in THIS run
        for exp in intelligence_data:
            exp['similar_experiences'] = all_similarities.get(exp['experience_id'], [])
    else:
        # Not enough experiences to compute similarities
        for exp in intelligence_data:
            exp['similar_experiences'] = []
    
    return json.dumps(intelligence_data)

def save_intelligence_results(**context):
    """Save experience intelligence results to database"""
    
    # Get final intelligence data
    intelligence_json = context['ti'].xcom_pull(task_ids='compute_experience_similarities')
    intelligence_data = json.loads(intelligence_json)
    
    pg_hook = PostgresHook(postgres_conn_id='trippy_db')
    
    # Create intelligence tables if they don't exist
    create_tables_sql = """
    CREATE TABLE IF NOT EXISTS experience_intelligence (
        experience_id BIGINT PRIMARY KEY,
        intelligence_data JSONB,
        popularity_score DECIMAL(5,2),
        sentiment_score DECIMAL(4,3),
        recommendation_weight DECIMAL(5,2),
        content_completeness_score INTEGER,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS experience_similarities (
        experience_id BIGINT,
        similar_experience_id BIGINT,
        similarity_score DECIMAL(4,3),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (experience_id, similar_experience_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_experience_intelligence_popularity 
        ON experience_intelligence(popularity_score DESC);
    CREATE INDEX IF NOT EXISTS idx_experience_intelligence_recommendation 
        ON experience_intelligence(recommendation_weight DESC);
    CREATE INDEX IF NOT EXISTS idx_experience_similarities_score 
        ON experience_similarities(similarity_score DESC);
    """
    
    pg_hook.run(create_tables_sql)
    
    # Save experience intelligence data
    for exp in intelligence_data:
        experience_id = exp['experience_id']
        
        # Upsert main intelligence data
        upsert_intelligence_sql = """
        INSERT INTO experience_intelligence (
            experience_id, intelligence_data, popularity_score, 
            sentiment_score, recommendation_weight, content_completeness_score, last_updated
        )
        VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        ON CONFLICT (experience_id) 
        DO UPDATE SET 
            intelligence_data = EXCLUDED.intelligence_data,
            popularity_score = EXCLUDED.popularity_score,
            sentiment_score = EXCLUDED.sentiment_score,
            recommendation_weight = EXCLUDED.recommendation_weight,
            content_completeness_score = EXCLUDED.content_completeness_score,
            last_updated = CURRENT_TIMESTAMP
        """
        
        pg_hook.run(upsert_intelligence_sql, parameters=[
            experience_id,
            json.dumps(exp),
            exp['popularity_score'],
            exp['sentiment_score'],
            exp['recommendation_weight'],
            exp.get('content_completeness_score', 0)
        ])
        
        # Clear old similarities for this experience
        pg_hook.run("DELETE FROM experience_similarities WHERE experience_id = %s", 
                   parameters=[experience_id])
        
        # Insert new similarities
        for similar_exp in exp['similar_experiences']:
            insert_similarity_sql = """
            INSERT INTO experience_similarities (
                experience_id, similar_experience_id, similarity_score, last_updated
            )
            VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
            """
            
            pg_hook.run(insert_similarity_sql, parameters=[
                experience_id,
                similar_exp['experience_id'],
                similar_exp['similarity_score']
            ])
    
    print(f"Successfully processed intelligence data for {len(intelligence_data)} experiences")
    return "Experience intelligence pipeline completed successfully"

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
    
    pg_hook.run(upsert_watermark, parameters=['experience_intelligence'])
    
    # Get the updated timestamp for logging
    result = pg_hook.get_first("""
        SELECT last_run_timestamp 
        FROM pipeline_watermarks 
        WHERE pipeline_name = 'experience_intelligence'
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
    task_id='extract_experience_data',
    python_callable=extract_experience_data,
    dag=dag,
)

content_analysis_task = PythonOperator(
    task_id='analyze_content_features',
    python_callable=analyze_content_features,
    dag=dag,
)

sentiment_popularity_task = PythonOperator(
    task_id='analyze_sentiment_and_popularity',
    python_callable=analyze_sentiment_and_popularity,
    dag=dag,
)

similarity_task = PythonOperator(
    task_id='compute_experience_similarities',
    python_callable=compute_experience_similarities,
    dag=dag,
)

save_task = PythonOperator(
    task_id='save_intelligence_results',
    python_callable=save_intelligence_results,
    dag=dag,
)

update_watermark_task = PythonOperator(
    task_id='update_watermark',
    python_callable=update_watermark,
    dag=dag,
)

# Define task dependencies
# Flow: Get last run time -> Extract data -> Analyze content -> Analyze sentiment -> Compute similarities -> Save -> Update watermark
get_watermark_task >> extract_task >> content_analysis_task >> sentiment_popularity_task >> similarity_task >> save_task >> update_watermark_task
