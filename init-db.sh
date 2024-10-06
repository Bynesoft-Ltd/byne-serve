#!/bin/bash
set -e

echo "Starting database initialization..."

# Function to run SQL commands
run_sql() {
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "$1"
}

# Create user if not exists, otherwise update password
run_sql "
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$POSTGRES_USER') THEN
        CREATE USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD';
        RAISE NOTICE 'User \"$POSTGRES_USER\" created successfully';
    ELSE
        ALTER USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD';
        RAISE NOTICE 'Password updated for existing user \"$POSTGRES_USER\"';
    END IF;
END
\$\$;"

# Create database if not exists
run_sql "
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$POSTGRES_DB') THEN
        CREATE DATABASE $POSTGRES_DB WITH OWNER $POSTGRES_USER;
        RAISE NOTICE 'Database \"$POSTGRES_DB\" created successfully';
    ELSE
        RAISE NOTICE 'Database \"$POSTGRES_DB\" already exists';
    END IF;
END
\$\$;"

# Grant privileges
run_sql "
DO \$\$
BEGIN
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;
    RAISE NOTICE 'All privileges granted to \"$POSTGRES_USER\" on database \"$POSTGRES_DB\"';
END
\$\$;"

echo "Database initialization completed successfully."