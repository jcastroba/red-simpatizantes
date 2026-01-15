@echo off
REM Initialization script for Windows

echo === Iniciando configuracion de la aplicacion ===

REM Wait for database
echo Esperando a que la base de datos este lista...
timeout /t 10 /nobreak

REM Run migrations
echo Ejecutando migraciones...
docker-compose exec backend python manage.py migrate

REM Populate locations
echo Cargando departamentos y municipios de Colombia...
docker-compose exec backend python populate_locations.py

REM Create superuser
echo.
echo === Crear usuario administrador ===
docker-compose exec backend python manage.py createsuperuser

echo.
echo === Configuracion completada ===
echo La aplicacion esta lista para usar:
echo   - Frontend: http://localhost
echo   - Backend API: http://localhost:8000/api
echo   - Admin Django: http://localhost:8000/admin
pause
