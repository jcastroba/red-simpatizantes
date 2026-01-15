# Guia de Despliegue - Red de Simpatizantes

## Requisitos Previos

- Docker y Docker Compose instalados
- Git (opcional, para clonar el repositorio)

## Despliegue Rapido con Docker

### 1. Configurar Variables de Entorno

Edita el archivo `.env` en la raiz del proyecto con tus valores:

```bash
# Genera una nueva SECRET_KEY segura
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

Actualiza estos valores en `.env`:
- `SECRET_KEY`: La clave generada
- `DB_PASSWORD`: Una contrasena segura para PostgreSQL
- `ALLOWED_HOSTS`: Tu dominio (ej: `midominio.com,www.midominio.com`)
- `CORS_ALLOWED_ORIGINS`: URL del frontend (ej: `https://midominio.com`)
- `FRONTEND_URL`: URL del frontend para enlaces en emails

### 2. Construir e Iniciar

```bash
# Construir las imagenes
docker-compose build

# Iniciar los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### 3. Inicializar la Base de Datos

En Windows:
```batch
scripts\init.bat
```

En Linux/Mac:
```bash
chmod +x scripts/init.sh
./scripts/init.sh
```

O manualmente:
```bash
# Ejecutar migraciones
docker-compose exec backend python manage.py migrate

# Cargar departamentos y municipios
docker-compose exec backend python populate_locations.py

# Crear superusuario
docker-compose exec backend python manage.py createsuperuser
```

### 4. Acceder a la Aplicacion

- **Frontend**: http://localhost
- **API Backend**: http://localhost:8000/api
- **Admin Django**: http://localhost:8000/admin

---

## Despliegue en Produccion (VPS)

### 1. Preparar el Servidor

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose-plugin
```

### 2. Clonar y Configurar

```bash
git clone <tu-repositorio>
cd ReferenciacionProject

# Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con valores de produccion
```

### 3. Configurar SSL con Nginx (Recomendado)

Crea un archivo `nginx-proxy.conf`:

```nginx
server {
    listen 80;
    server_name tudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name tudominio.com;

    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. Obtener Certificado SSL

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d tudominio.com
```

---

## Comandos Utiles

```bash
# Ver estado de los contenedores
docker-compose ps

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Reiniciar servicios
docker-compose restart

# Detener todo
docker-compose down

# Detener y eliminar volumenes (CUIDADO: elimina datos)
docker-compose down -v

# Ejecutar comandos en el backend
docker-compose exec backend python manage.py shell
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

# Backup de base de datos
docker-compose exec db pg_dump -U postgres referrals_db > backup.sql

# Restaurar backup
docker-compose exec -T db psql -U postgres referrals_db < backup.sql
```

---

## Configuracion de Email

El sistema usa Gmail SMTP para enviar correos. Necesitas:

1. Una cuenta de Gmail
2. Generar una "Contrasena de aplicacion" en:
   https://myaccount.google.com/apppasswords

3. Configurar en `.env`:
```
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-contrasena-de-aplicacion
DEFAULT_FROM_EMAIL=Red de Simpatizantes <tu-email@gmail.com>
```

---

## Solucion de Problemas

### Error de conexion a la base de datos
```bash
# Verificar que PostgreSQL esta corriendo
docker-compose logs db

# Reiniciar la base de datos
docker-compose restart db
```

### Error de migraciones
```bash
# Recrear migraciones
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
```

### Frontend no carga
```bash
# Verificar build del frontend
docker-compose logs frontend

# Reconstruir
docker-compose build frontend
docker-compose up -d frontend
```

### Emails no se envian
1. Verifica las credenciales de Gmail en `.env`
2. Asegurate de usar una "Contrasena de aplicacion"
3. Revisa los logs: `docker-compose logs backend | grep -i email`
