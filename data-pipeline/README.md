# Data Pipeline Setup Guide

This guide will help you set up the Airflow data pipeline for the Trippy project.

## Quick Start

Airflow runs in Docker. See the main [README.md](../README.md) for initial setup.

From the **project root**:

```bash
docker-compose up -d
```

Access Airflow UI at http://localhost:8081

### Get Login Credentials


Then login with:
- **Username**: `admin`
- **Password**: `admin`

## Prerequisites

### PostgreSQL with pgvector Extension

The database uses the `pgvector/pgvector:pg16` Docker image (already configured in `docker-compose.yml`). This enables vector similarity search capabilities.

### Python Dependencies

The following packages are pre-installed in the Docker image:
- `apache-airflow` - Workflow orchestration
- `pandas`, `numpy` - Data processing
- `scikit-learn`, `textblob` - ML and NLP
- `openai>=1.0.0` - OpenAI API client
- `pgvector>=0.2.0` - Vector database support
- `psycopg2-binary` - PostgreSQL adapter

## Configuration

### Set Up Database Connection

Connect Airflow to your application database:

1. Go to **Admin > Connections** in Airflow UI
2. Click **+** to add a new connection
3. Fill in:
   - **Connection Id**: `trippy_db`
   - **Connection Type**: `Postgres`
   - **Host**: `db` (Docker service name)
   - **Database**: `appdb`
   - **Login**: `app`
   - **Password**: `secret`
   - **Port**: `5432`

### Test Your Setup

1. In Airflow UI, go to **DAGs**
2. Find `test_dag`
3. Toggle it ON and trigger it to verify everything works

## Development

Add new DAG files to `data-pipeline/airflow/dags/`. They'll appear in the UI automatically.

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f airflow-scheduler
docker-compose logs -f airflow-webserver
```

### Restart Services

```bash
docker-compose restart airflow-scheduler airflow-webserver
```

### Stop Services

```bash
# Stop but keep data
docker-compose down

# Stop and remove all data
docker-compose down -v
```

## Troubleshooting

### Common Issues

- **DAGs not appearing?** Check scheduler logs: `docker-compose logs -f airflow-scheduler`
- **Services unhealthy?** Check status: `docker-compose ps`
- **Need to rebuild?** Run:   
- **Connection issues?** Use Docker service names (`db`, not `localhost`) for connections between containers
- **Airflow not starting?** Wait 1-2 minutes after `docker-compose up` for initialization to complete

### Verify Your Setup

**Check pgvector extension:**
```bash
docker exec postgres-spring psql -U app -d appdb -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
```

**Check installed packages:**
```bash
docker exec airflow-scheduler python -m pip list | grep -E "openai|pgvector"
```