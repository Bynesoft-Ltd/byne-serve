1. Clone the repo.
2. Cd to /scripts and run wrap_model.py.
3. Create your .env.
3. Once the model's been wrapped, deploy the server with 
docker compose --env-file .env -f docker-compose.yml -p byne-serve up -d --build