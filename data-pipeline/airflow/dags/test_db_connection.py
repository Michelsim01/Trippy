from datetime import datetime
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook

def test_connection():
    # Get the connection
    pg_hook = PostgresHook(postgres_conn_id='trippy_db')
    conn = pg_hook.get_conn()
    cursor = conn.cursor()
    
    # Test query
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    print(f"Successfully connected! User count: {user_count}")
    
    cursor.close()
    conn.close()
    return "Connection successful"

dag = DAG(
    'test_db_connection',
    start_date=datetime(2024, 1, 1),
    schedule_interval=None,
    catchup=False
)

test_task = PythonOperator(
    task_id='test_postgres_connection',
    python_callable=test_connection,
    dag=dag
)