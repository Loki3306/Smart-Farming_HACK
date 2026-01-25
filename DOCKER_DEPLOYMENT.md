# Smart Farming Platform - Docker Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Docker 20.10+ and Docker Compose 2.0+
- 4GB+ RAM available
- 10GB+ disk space

### Environment Setup

1. **Copy environment template:**
```bash
cp .env.example .env
```

2. **Configure environment variables in `.env`:**
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# Database (for local dev)
DB_PASSWORD=your_secure_password

# Redis (optional for production)
REDIS_URL=redis://redis:6379

# Frontend URLs (for production)
VITE_API_URL=https://your-api-domain.com
VITE_DISEASE_MODEL_URL=https://your-disease-model-domain.com
```

## 📦 Development Deployment

### Start all services:
```bash
docker-compose up -d
```

### View logs:
```bash
docker-compose logs -f
```

### Stop all services:
```bash
docker-compose down
```

### Rebuild after code changes:
```bash
docker-compose up -d --build
```

## 🏭 Production Deployment

### Build and start production services:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### View production logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Stop production services:
```bash
docker-compose -f docker-compose.prod.yml down
```

## 🔧 Service Details

### Services Running:

1. **Backend API** (Port 8000)
   - Main API with all ML models
   - Recommendations engine
   - Regime management
   - IoT device management
   - Resource limits: 2 CPU, 2GB RAM

2. **Disease Detection Model** (Port 8001)
   - PyTorch-based disease detection
   - ResNet50 model
   - Resource limits: 2 CPU, 3GB RAM

3. **Frontend** (Port 5173 dev / 80 prod)
   - React + Vite application
   - Nginx in production
   - Resource limits: 0.5 CPU, 512MB RAM

4. **PostgreSQL** (Port 5432) - Dev only
   - Local database for development
   - Use Supabase in production

5. **Redis** (Port 6379)
   - Caching layer
   - Session storage

6. **MQTT Broker** (Ports 1883, 9001)
   - IoT device communication
   - Mosquitto broker

## 🔍 Health Checks

Check service health:
```bash
# Backend
curl http://localhost:8000/api/regime/health

# Disease Model
curl http://localhost:8001/health

# Frontend
curl http://localhost:5173/ # or http://localhost:80/ in production
```

## 📊 Monitoring

### View resource usage:
```bash
docker stats
```

### View container status:
```bash
docker-compose ps
```

## 🛠️ Troubleshooting

### Clear all data and restart:
```bash
docker-compose down -v
docker-compose up -d --build
```

### View specific service logs:
```bash
docker-compose logs -f backend
docker-compose logs -f disease-model
docker-compose logs -f frontend
```

### Access container shell:
```bash
docker-compose exec backend bash
docker-compose exec disease-model bash
```

### Check model files:
```bash
# Backend models
docker-compose exec backend ls -lh app/ml_models/saved_models/

# Disease model
docker-compose exec disease-model ls -lh models/
```

## 🔐 Security Notes

1. **Never commit `.env` file**
2. **Use strong passwords** for database
3. **Enable HTTPS** in production (use Nginx reverse proxy or cloud load balancer)
4. **Rotate API keys** regularly
5. **Use secrets management** in production (AWS Secrets Manager, etc.)

## 📈 Scaling

### Scale specific services:
```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Scale disease model to 2 instances
docker-compose up -d --scale disease-model=2
```

### Load Balancing:
Use Nginx or cloud load balancer (AWS ALB, GCP Load Balancer) to distribute traffic.

## 🚢 Cloud Deployment

### AWS ECS/Fargate:
```bash
# Install ECS CLI
# Configure AWS credentials
ecs-cli compose -f docker-compose.prod.yml up
```

### Google Cloud Run:
```bash
# Build and push images
docker build -t gcr.io/PROJECT_ID/smartfarm-backend -f backend/Dockerfile .
docker push gcr.io/PROJECT_ID/smartfarm-backend

# Deploy
gcloud run deploy smartfarm-backend --image gcr.io/PROJECT_ID/smartfarm-backend
```

### Azure Container Instances:
```bash
az container create --resource-group myResourceGroup \
  --file docker-compose.prod.yml
```

## 📝 Model Management

### All ML Models Included:

**Backend Models** (`backend/app/ml_models/saved_models/`):
- `crop_model.pkl` - Crop recommendation
- `disease_model.pkl` - Disease prediction
- `fertilizer_model.pkl` - Fertilizer recommendation
- `irrigation_model.pkl` - Irrigation planning
- `nutrient_model.pkl` - Nutrient analysis
- `water_demand_model.pkl` - Water requirement prediction
- `yield_model.pkl` - Yield prediction

**Disease Detection Model** (`disease_model/models/`):
- `plant_disease_resnet50_fast.pth` - PyTorch ResNet50 (90MB)

### Model Updates:
1. Place new model files in respective directories
2. Rebuild containers: `docker-compose up -d --build`
3. Verify: Check health endpoints

## 🎯 Performance Optimization

### Production Optimizations Applied:
- ✅ Multi-stage Docker builds
- ✅ Layer caching optimization
- ✅ Gzip compression (Nginx)
- ✅ Static asset caching
- ✅ Health checks with retries
- ✅ Resource limits
- ✅ Non-root user execution
- ✅ Logging with rotation

### Recommended Production Setup:
- Use managed database (Supabase/AWS RDS)
- Use managed Redis (AWS ElastiCache/Redis Cloud)
- Use CDN for frontend (CloudFlare/AWS CloudFront)
- Enable auto-scaling
- Set up monitoring (Prometheus/Grafana)
- Configure alerts

## 📞 Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables
3. Ensure all model files are present
4. Check network connectivity between services

## 🔄 Update Procedure

1. Pull latest code: `git pull`
2. Rebuild images: `docker-compose build`
3. Restart services: `docker-compose up -d`
4. Verify health: Check all health endpoints
