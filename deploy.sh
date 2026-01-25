#!/bin/bash

# Smart Farming Platform - Deployment Script
# Usage: ./deploy.sh [dev|prod|stop|rebuild|logs]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

check_requirements() {
    print_info "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    print_success "Requirements check passed"
}

check_env() {
    if [ ! -f .env ]; then
        print_error ".env file not found"
        print_info "Creating .env from .env.example..."
        cp .env.example .env
        print_info "Please configure .env file with your settings"
        exit 1
    fi
    print_success "Environment file found"
}

deploy_dev() {
    print_info "Starting development deployment..."
    check_requirements
    check_env
    
    docker-compose down
    docker-compose up -d --build
    
    print_success "Development environment started"
    print_info "Services:"
    print_info "  - Frontend: http://localhost:5173"
    print_info "  - Backend API: http://localhost:8000"
    print_info "  - Disease Model: http://localhost:8001"
    print_info "  - PostgreSQL: localhost:5432"
    print_info "  - Redis: localhost:6379"
    print_info "  - MQTT: localhost:1883"
    
    print_info "\nView logs with: docker-compose logs -f"
}

deploy_prod() {
    print_info "Starting production deployment..."
    check_requirements
    check_env
    
    # Check if required env vars are set
    if ! grep -q "SUPABASE_URL=" .env || ! grep -q "SUPABASE_KEY=" .env; then
        print_error "SUPABASE_URL and SUPABASE_KEY must be set in .env for production"
        exit 1
    fi
    
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml up -d --build
    
    print_success "Production environment started"
    print_info "Services:"
    print_info "  - Frontend: http://localhost:80"
    print_info "  - Backend API: http://localhost:8000"
    print_info "  - Disease Model: http://localhost:8001"
    
    print_info "\nView logs with: docker-compose -f docker-compose.prod.yml logs -f"
    print_info "\nHealth checks:"
    sleep 10
    curl -f http://localhost:8000/api/regime/health && print_success "Backend is healthy" || print_error "Backend health check failed"
    curl -f http://localhost:8001/health && print_success "Disease model is healthy" || print_error "Disease model health check failed"
}

stop_services() {
    print_info "Stopping all services..."
    docker-compose down
    docker-compose -f docker-compose.prod.yml down
    print_success "All services stopped"
}

rebuild() {
    print_info "Rebuilding all services..."
    docker-compose build --no-cache
    print_success "Rebuild complete"
}

show_logs() {
    print_info "Showing logs (Ctrl+C to exit)..."
    docker-compose logs -f
}

show_status() {
    print_info "Service Status:"
    docker-compose ps
    echo ""
    print_info "Resource Usage:"
    docker stats --no-stream
}

# Main script
case "$1" in
    dev)
        deploy_dev
        ;;
    prod)
        deploy_prod
        ;;
    stop)
        stop_services
        ;;
    rebuild)
        rebuild
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    *)
        echo "Smart Farming Platform - Deployment Script"
        echo ""
        echo "Usage: $0 {dev|prod|stop|rebuild|logs|status}"
        echo ""
        echo "Commands:"
        echo "  dev      - Start development environment"
        echo "  prod     - Start production environment"
        echo "  stop     - Stop all services"
        echo "  rebuild  - Rebuild all Docker images"
        echo "  logs     - Show logs from all services"
        echo "  status   - Show service status and resource usage"
        echo ""
        exit 1
        ;;
esac
