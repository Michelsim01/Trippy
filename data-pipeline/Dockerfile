FROM apache/airflow:2.10.4-python3.11

# Install additional Python packages needed for DAGs
USER airflow
RUN pip install --no-cache-dir \
    pandas \
    numpy \
    scikit-learn \
    textblob \
    psycopg2-binary
