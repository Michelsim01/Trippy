from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import json

default_args = {
    'owner': 'trippy',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

# Creates an Airflow workflow that runs automatically every 6 hours
dag = DAG(
    'user_profile_analytics',
    default_args=default_args,
    description='Analyze user behavior and create preference profiles',
    schedule=timedelta(hours=6),  # Run every 6 hours
    start_date=datetime(2024, 10, 1),
    catchup=False,
    tags=['analytics', 'recommendations', 'user-profiling'],
)

def extract_user_data(**context):
    """Extract user survey, booking, and interaction data"""
    
    pg_hook = PostgresHook(postgres_conn_id='trippy_db')
    
    # Extract user survey data
    survey_query = """
    SELECT 
        us.user_id,
        us.travel_style,
        us.experience_budget,
        us.completed_at,
        array_agg(usi.interests) as interests
    FROM user_survey us
    LEFT JOIN user_survey_interests usi ON us.survey_id = usi.user_survey_survey_id
    GROUP BY us.user_id, us.travel_style, us.experience_budget, us.completed_at
    """
    
    # Extract booking behavior data
    booking_query = """
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
    GROUP BY b.traveler_id
    """
    
    # Extract review data for sentiment analysis
    review_query = """
    SELECT 
        r.reviewer_id,
        COUNT(*) as total_reviews,
        AVG(r.rating) as avg_rating_given,
        array_agg(e.category) as reviewed_categories
    FROM review r
    JOIN experiences e ON r.experience_id = e.experience_id
    GROUP BY r.reviewer_id
    """
    
    # Extract data from the database using SQL queries
    survey_df = pd.read_sql(survey_query, pg_hook.get_sqlalchemy_engine())
    booking_df = pd.read_sql(booking_query, pg_hook.get_sqlalchemy_engine())
    review_df = pd.read_sql(review_query, pg_hook.get_sqlalchemy_engine())
    
    # Save to XCom for next task
    return {
        'survey_data': survey_df.to_json(orient='records'),
        'booking_data': booking_df.to_json(orient='records'),
        'review_data': review_df.to_json(orient='records')
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
            
            # Interest categories (one-hot encoded based on survey data if available)
            'interest_adventure': 1 if len(user_survey) > 0 and any('hiking' in str(interest) or 'climbing' in str(interest) for interest in user_survey['interests'].iloc[0] or []) else 0,
            'interest_cultural': 1 if len(user_survey) > 0 and any('museum' in str(interest) or 'historical' in str(interest) for interest in user_survey['interests'].iloc[0] or []) else 0,
            'interest_relaxation': 1 if len(user_survey) > 0 and any('spa' in str(interest) or 'wellness' in str(interest) for interest in user_survey['interests'].iloc[0] or []) else 0,
            'interest_social': 1 if len(user_survey) > 0 and any('group' in str(interest) or 'festival' in str(interest) for interest in user_survey['interests'].iloc[0] or []) else 0,
            'interest_nature': 1 if len(user_survey) > 0 and any('wildlife' in str(interest) or 'photography' in str(interest) for interest in user_survey['interests'].iloc[0] or []) else 0,
            
            # Budget preference (encoded based on numerical ranges)
            'budget_score': encode_budget_score(user_survey['experience_budget'].iloc[0]) if len(user_survey) > 0 else 2
        }
        
        features.append(feature_vector)
    
    return json.dumps(features)

def cluster_users(**context):
    """Perform K-means clustering on user features"""
    
    # Get processed features
    features_json = context['ti'].xcom_pull(task_ids='process_user_features')
    features = json.loads(features_json)
    
    df = pd.DataFrame(features)
    
    # Select numerical features for clustering
    clustering_features = [
        'interests_count', 'total_bookings', 'avg_booking_amount', 
        'completion_rate', 'countries_visited', 'review_activity', 
        'avg_rating_given', 'interest_adventure', 'interest_cultural', 
        'interest_relaxation', 'interest_social', 'interest_nature', 'budget_score'
    ]
    
    # Fill NaN values with 0
    X = df[clustering_features].fillna(0)
    
    # Normalize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Perform K-means clustering (4 clusters for different traveler types)
    kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X_scaled)
    
    # Add cluster labels to user data
    df['cluster'] = clusters
    
    # Create cluster profiles
    cluster_profiles = {}
    for cluster_id in range(4):
        cluster_users = df[df['cluster'] == cluster_id]
        
        profile = {
            'cluster_id': int(cluster_id),
            'user_count': len(cluster_users),
            'avg_budget_score': float(cluster_users['budget_score'].mean()),
            'dominant_travel_style': cluster_users['travel_style'].mode().iloc[0] if len(cluster_users) > 0 else 'unknown',
            'avg_booking_amount': float(cluster_users['avg_booking_amount'].mean()),
            'interest_preferences': {
                'adventure': float(cluster_users['interest_adventure'].mean()),
                'cultural': float(cluster_users['interest_cultural'].mean()),
                'relaxation': float(cluster_users['interest_relaxation'].mean()),
                'social': float(cluster_users['interest_social'].mean()),
                'nature': float(cluster_users['interest_nature'].mean())
            }
        }
        cluster_profiles[cluster_id] = profile
    
    return {
        'user_clusters': df[['user_id', 'cluster']].to_json(orient='records'), # Save user cluster assignments
        'cluster_profiles': json.dumps(cluster_profiles) # Save cluster profiles
    }

def save_analytics_results(**context):
    """Save clustering results and user profiles to database"""
    
    # Get clustering results
    results = context['ti'].xcom_pull(task_ids='cluster_users')
    user_clusters = json.loads(results['user_clusters'])
    cluster_profiles = json.loads(results['cluster_profiles'])
    
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
        
        upsert_user_sql = """
        INSERT INTO user_analytics_profile (user_id, cluster_id, profile_data, last_updated)
        VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            cluster_id = EXCLUDED.cluster_id,
            profile_data = EXCLUDED.profile_data,
            last_updated = CURRENT_TIMESTAMP
        """
        
        pg_hook.run(upsert_user_sql, parameters=[user_id, cluster_id, json.dumps({})])
    
    # Save cluster profiles
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
    
    print(f"Successfully updated profiles for {len(user_clusters)} users across {len(cluster_profiles)} clusters")
    return "Analytics pipeline completed successfully"

# Define tasks
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

# Define task dependencies
extract_task >> process_task >> cluster_task >> save_task