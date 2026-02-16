---
description: How to deploy the application to a production server
---

# Deployment Workflow

1. Prepare a Linux server with Docker and Docker Compose.
2. Clone the repository to the server.
3. Update `docker-compose.yml` for production:
   - Set `FLASK_ENV=production`
   - Set `FLASK_DEBUG=0`
   - Change `SECRET_KEY` to a secure random string.
   - Update `REACT_APP_API_URL` to your production domain.
4. Run the build command:
// turbo
```bash
docker-compose up --build -d
```
5. Initialize the database (Required for first-time setup):
// turbo
```bash
# Run migrations to create tables
docker-compose exec backend flask db upgrade
# Run seed script to add default admin and settings
docker-compose exec backend python seed.py
```
6. Setup Nginx as a reverse proxy for SSL/HTTPS.
7. Verify the application is accessible via the domain.
