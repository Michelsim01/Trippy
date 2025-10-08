# Data Pipeline Setup Guide

This guide will help you set up the Airflow data pipeline for the Trippy project.

## Prerequisites

- Python 3.8 or higher
- Access to the project's PostgreSQL database

## Setup Steps

### 1. Create Virtual Environment

```bash
cd data-pipeline
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Initialize Airflow

```bash
cd airflow
export AIRFLOW_HOME=$(pwd)  # Sets current directory as Airflow home
airflow db init
```

### 4. Create Admin User

```bash
airflow users create \
  --username admin \
  --firstname Admin \
  --lastname User \
  --role Admin \
  --email admin@example.com \
  --password admin
```

### 5. Set Up Database Connection

1. Start the Airflow webserver:
   ```bash
   airflow webserver --port 8081
   ```

2. In a new terminal, start the scheduler:
   ```bash
   cd data-pipeline/airflow
   export AIRFLOW_HOME=$(pwd)
   airflow scheduler
   ```

3. Open http://localhost:8081 in your browser
4. Login with username: `admin`, password: `admin`
5. Go to **Admin > Connections**
6. Click **+** to add a new connection
7. Fill in the following details:
   - **Connection Id**: `trippy_db`
   - **Connection Type**: `Postgres`
   - **Host**: localhost
   - **Login**: app
   - **Password**: secret
   - **Port**: `5332` 

### 6. Test Your Setup

1. In the Airflow UI, go to **DAGs**
2. You should see the test DAGs: `test_dag` and `test_db_connection`
3. Toggle them ON and trigger them to verify everything is working

## Development

- Add new DAG files to the `airflow/dags/` directory
- DAGs will automatically appear in the Airflow UI after a few seconds
- Follow existing DAG patterns in the `dags/` folder

## Important Notes

- Always activate the virtual environment before working: `source venv/bin/activate`
- Set `AIRFLOW_HOME` to the `airflow/` directory when running Airflow commands
- The Airflow database and logs are gitignored, so they won't interfere with version control
- Ask the project maintainer for database connection details

## Troubleshooting

- If DAGs don't appear, check the Airflow logs in `airflow/logs/`
- Ensure the database connection is properly configured
- Make sure both webserver and scheduler are running