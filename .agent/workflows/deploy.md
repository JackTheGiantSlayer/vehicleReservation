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
5. Setup Nginx as a reverse proxy for SSL/HTTPS.
6. Verify the application is accessible via the domain.
