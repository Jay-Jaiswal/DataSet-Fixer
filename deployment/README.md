# Deployment Configuration

This directory contains all deployment-related files for DataFixer.

## Files

- **`Dockerfile`** - Multi-stage Docker container build configuration
- **`docker-compose.yml`** - Multi-service orchestration for development and production
- **`Procfile`** - Heroku deployment configuration
- **`runtime.txt`** - Python runtime version specification for cloud platforms
- **`start.sh`** - Unix startup script for production servers
- **`start.bat`** - Windows startup script for development
- **`start-robust.sh`** - Enhanced startup script with error handling
- **`deploy.py`** - Automated deployment script

## Quick Deployment

### Docker
```bash
# From project root
docker build -f deployment/Dockerfile -t datafixer .
docker run -p 8000:8000 datafixer
```

### Heroku
```bash
# Ensure Procfile and runtime.txt are in project root for Heroku
cp deployment/Procfile .
cp deployment/runtime.txt .
git add . && git commit -m "Add deployment files"
git push heroku main
```

### Railway/Render
These platforms auto-detect the configuration from the Dockerfile and start scripts.