#!/bin/sh

echo "Running migrations..."
python manage.py migrate --noinput

echo "Loading initial data..."
python populate_locations.py || true

echo "Starting server..."
exec gunicorn --bind 0.0.0.0:${PORT:-8000} --workers 3 core.wsgi:application
