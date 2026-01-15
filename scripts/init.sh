#!/bin/bash
# Initialization script for the Referrals application

echo "=== Iniciando configuracion de la aplicacion ==="

# Wait for database
echo "Esperando a que la base de datos este lista..."
sleep 5

# Run migrations
echo "Ejecutando migraciones..."
docker-compose exec backend python manage.py migrate

# Populate locations (departments and municipalities)
echo "Cargando departamentos y municipios de Colombia..."
docker-compose exec backend python populate_locations.py

# Create superuser (interactive)
echo ""
echo "=== Crear usuario administrador ==="
docker-compose exec backend python manage.py createsuperuser

echo ""
echo "=== Configuracion completada ==="
echo "La aplicacion esta lista para usar:"
echo "  - Frontend: http://localhost"
echo "  - Backend API: http://localhost:8000/api"
echo "  - Admin Django: http://localhost:8000/admin"
