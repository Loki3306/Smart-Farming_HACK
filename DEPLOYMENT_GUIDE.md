# Regime System - Deployment Guide

## Overview
This guide covers deploying the Regime System (farming plans feature) using Docker and Docker Compose.

## Prerequisites
- Docker and Docker Compose installed
- Supabase project created (for production)
- Node.js 18+ and Python 3.13+ (for local development without Docker)

## Local Development with Docker Compose

### 1. Environment Setup
```bash
# Copy the environment template
cp .env.example .env

# Fill in your Supabase credentials in .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### 2. Build and Start Services
```bash
# Start all services (backend, frontend, postgres, redis)
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 3. Verify Services
```bash
# Backend health check
curl http://localhost:8000/api/regime/health

# Frontend health check
curl http://localhost:5173

# Database connection
docker-compose exec postgres psql -U regime_user -d regime_db -c "SELECT 1;"
```

### 4. Run Database Migrations
```bash
# If using local PostgreSQL:
docker-compose exec backend python -m alembic upgrade head

# Or run migrations from the migrations script:
docker-compose exec backend python -m app.db.migrations.run
```

### 5. Stop Services
```bash
docker-compose down

# Remove volumes (WARNING: deletes database)
docker-compose down -v
```

## Development Workflow

### Code Changes
- Backend changes: Auto-reloaded with Uvicorn (--reload flag)
- Frontend changes: Auto-reloaded with Vite dev server
- No container restart needed for code changes

### Running Tests
```bash
# Backend unit tests
docker-compose exec backend pytest backend/test_regime_service.py -v

# Backend integration tests
docker-compose exec backend pytest backend/test_regime_integration.py -v

# Frontend tests
docker-compose exec frontend pnpm run test
```

### Database Shell Access
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U regime_user -d regime_db

# View regime tables
SELECT * FROM regimes LIMIT 5;
SELECT * FROM regime_tasks WHERE regime_id = 'xxx';
```

## Production Deployment

### 1. Using Supabase (Recommended)
```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-service-role-key"

# Backend only (frontend on separate service)
docker-compose -f docker-compose.prod.yml up -d backend
```

### 2. Build Docker Images
```bash
# Build backend image
docker build -f backend/Dockerfile -t regime-api:latest ./

# Build frontend image
docker build -f client/Dockerfile -t regime-ui:latest ./

# Tag for registry
docker tag regime-api:latest your-registry/regime-api:latest
docker tag regime-ui:latest your-registry/regime-ui:latest

# Push to registry
docker push your-registry/regime-api:latest
docker push your-registry/regime-ui:latest
```

### 3. Deploy to Cloud
```bash
# Example: Azure Container Instances
az container create \
  --resource-group my-group \
  --name regime-api \
  --image your-registry/regime-api:latest \
  --environment-variables SUPABASE_URL=$SUPABASE_URL SUPABASE_KEY=$SUPABASE_KEY \
  --ports 8000
```

## Health Checks

### Backend Health
- Endpoint: `GET /api/regime/health`
- Expected Response: `{"status": "ok"}`
- Docker health check: Checks every 30s

### Frontend Health
- Endpoint: `GET http://localhost:5173`
- Expected Response: HTML page
- Docker health check: Uses wget

### Database Health
- Endpoint: `/api/regime/health` internally checks database
- Connection string: From `DATABASE_URL`

## Troubleshooting

### Service won't start
```bash
# Check logs
docker-compose logs backend
docker-compose logs postgres

# Verify environment variables
docker-compose config

# Rebuild services
docker-compose build --no-cache
```

### Database migration failed
```bash
# Check migration status
docker-compose exec backend python -m alembic current

# Rollback migration
docker-compose exec backend python -m alembic downgrade -1

# Retry
docker-compose exec backend python -m alembic upgrade head
```

### Port conflicts
```bash
# Change ports in docker-compose.yml or use environment variables
docker-compose --compatibility up -d
```

### Supabase connection issues
```bash
# Verify credentials
curl https://your-project.supabase.co/rest/v1/

# Test from container
docker-compose exec backend python -c "
import os
from supabase import create_client
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')
client = create_client(url, key)
print('Connected successfully')
"
```

## Performance Optimization

### Caching
- Redis is configured for regime data caching
- Cache TTL: 1 hour for regime lists, 30 min for tasks

### Database Indexing
- 26 strategic indexes on `regimes`, `regime_tasks`, `regime_executions`
- See `DB_Scripts/regime/01_create_tables.sql` for details

### Frontend Optimization
- Lazy loading for Regimes components
- React Query for server state caching
- Production build with tree-shaking and minification

## Security Considerations

### Environment Variables
- Never commit `.env` file (add to `.gitignore`)
- Use strong passwords for local development
- Rotate Supabase keys regularly

### CORS Configuration
- Frontend on `http://localhost:5173` (dev)
- Backend on `http://localhost:8000` (dev)
- Update CORS_ORIGINS for production

### Database Access
- RLS policies enforce `farmer_id` isolation
- Service role key only for backend operations
- Use anon key for frontend API calls

### API Security
- All endpoints require authentication (except health check)
- Rate limiting recommended for production
- Input validation on all endpoints

## Maintenance

### Regular Tasks
1. **Database backups**: Configure Supabase automated backups
2. **Log rotation**: Monitor `/var/log/docker/` growth
3. **Dependency updates**: Run `pnpm update` and `pip update` monthly
4. **Security patches**: Update base images regularly

### Monitoring
```bash
# Container resource usage
docker stats

# View recent logs
docker-compose logs --tail=100 backend

# Check container health
docker-compose ps
```

## Next Steps

1. **Set up CI/CD**: GitHub Actions or Azure DevOps for automated deployments
2. **Configure monitoring**: Datadog, New Relic, or CloudWatch
3. **Load testing**: K6 or JMeter for performance testing
4. **Backup strategy**: Automated daily backups to cloud storage
