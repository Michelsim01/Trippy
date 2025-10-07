from datetime import datetime
from airflow import DAG
from airflow.operators.python import PythonOperator

def print_hello():
    print("Airflow is working!")
    return "Success"

dag = DAG(
    'test_dag',
    start_date=datetime(2024, 1, 1),
    schedule_interval=None,
    catchup=False
)

hello_task = PythonOperator(
    task_id='hello_task',
    python_callable=print_hello,
    dag=dag
)
