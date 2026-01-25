# 🐳 Docker Deployment - Quick Reference

## 🚀 One-Command Deployment

### Development (Windows):
```powershell
.\deploy.ps1 dev
```

### Development (Linux/Mac):
```bash
chmod +x deploy.sh
./deploy.sh dev
```

### Production:
```powershell
.\deploy.ps1 prod  # Windows
./deploy.sh prod   # Linux/Mac
```

## 📋 All Services

| Service | Port | Description | Resources |
|---------|------|-------------|-----------|
| Frontend | 5173 (dev) / 80 (prod) | React + Vite UI | 0.5 CPU, 512MB |
| Backend API | 8000 | FastAPI + ML Models | 2 CPU, 2GB |
| Disease Model | 8001 | PyTorch Disease Detection | 2 CPU, 3GB |
| PostgreSQL | 5432 | Database (dev only) | - |
| Redis | 6379 | Cache | 0.5 CPU, 512MB |
| MQTT | 1883, 9001 | IoT Broker | 0.25 CPU, 128MB |

## 🎯 Quick Commands

```powershell
# Start development
.\deploy.ps1 dev

# Start production
.\deploy.ps1 prod

# Stop all services
.\deploy.ps1 stop

# View logs
.\deploy.ps1 logs

# Check status
.\deploy.ps1 status

# Rebuild images
.\deploy.ps1 rebuild
```

## 🔍 Health Checks

```bash
# Backend
curl http://localhost:8000/api/regime/health

# Disease Model
curl http://localhost:8001/health

# Frontend
curl http://localhost:5173/  # dev
curl http://localhost:80/    # prod
```

## 📦 What's Included

### ML Models (All Working):
✅ Crop Recommendation Model
✅ Disease Prediction Model  
✅ Fertilizer Recommendation Model
✅ Irrigation Planning Model
✅ Nutrient Analysis Model
✅ Water Demand Prediction Model
✅ Yield Prediction Model
✅ Plant Disease Detection (ResNet50 - PyTorch)

### Features:
✅ Multi-stage optimized builds
✅ Health checks with auto-restart
✅ Resource limits
✅ Logging with rotation
✅ Security hardening
✅ Development hot-reload
✅ Production Nginx serving
✅ MQTT for IoT devices

## 🛠️ Troubleshooting

### Services won't start:
```powershell
# Check Docker is running
docker ps

# View logs
.\deploy.ps1 logs

# Rebuild from scratch
docker-compose down -v
.\deploy.ps1 rebuild
.\deploy.ps1 dev
```

### Port conflicts:
```powershell
# Check what's using ports
netstat -ano | findstr :8000
netstat -ano | findstr :5173

# Kill process or change ports in docker-compose.yml
```

### Model files missing:
```bash
# Check backend models
docker-compose exec backend ls -lh app/ml_models/saved_models/

# Check disease model
docker-compose exec disease-model ls -lh models/
```

## 📚 Full Documentation

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for complete documentation.

## 🎓 First Time Setup

1. **Install Docker Desktop**
   - Windows: https://docs.docker.com/desktop/install/windows-install/
   - Mac: https://docs.docker.com/desktop/install/mac-install/
   - Linux: https://docs.docker.com/engine/install/

2. **Configure Environment**
   ```powershell
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Deploy**
   ```powershell
   .\deploy.ps1 dev
   ```

4. **Access**
   - Frontend: http://localhost:5173
   - API Docs: http://localhost:8000/docs
   - Disease Model: http://localhost:8001/docs

## 🌐 Production Deployment

### Cloud Platforms:

**AWS:**
- ECS/Fargate: Use docker-compose.prod.yml
- Elastic Beanstalk: Multi-container Docker
- EC2: Docker Compose directly

**Google Cloud:**
- Cloud Run: Individual services
- GKE: Kubernetes conversion
- Compute Engine: Docker Compose

**Azure:**
- Container Instances: docker-compose.prod.yml
- AKS: Kubernetes
- App Service: Multi-container

**DigitalOcean:**
- App Platform: Dockerfile deployment
- Droplets: Docker Compose

## 💡 Tips

- Use `docker-compose.yml` for development
- Use `docker-compose.prod.yml` for production
- Models are loaded on container start
- First startup may take 2-3 minutes
- Production uses Nginx for better performance
- All services have health checks
- Logs are automatically rotated

## 🔒 Security

- Non-root user in production
- Environment variables for secrets
- HTTPS recommended (use reverse proxy)
- Regular security updates
- Resource limits prevent DoS

## 📞 Need Help?

1. Check logs: `.\deploy.ps1 logs`
2. Check status: `.\deploy.ps1 status`
3. Review DOCKER_DEPLOYMENT.md
4. Check Docker Desktop dashboard
