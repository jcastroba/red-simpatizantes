import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from decouple import config

def create_database():
    dbname = config('DB_NAME', default='referrals_db')
    user = config('DB_USER', default='postgres')
    password = config('DB_PASSWORD', default='password')
    host = config('DB_HOST', default='localhost')
    port = config('DB_PORT', default='5432')

    try:
        # Connect to default 'postgres' database to create the new one
        con = psycopg2.connect(dbname='postgres', user=user, host=host, password=password, port=port)
        con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = con.cursor()
        
        # Check if database exists
        cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{dbname}'")
        exists = cur.fetchone()
        
        if not exists:
            cur.execute(f'CREATE DATABASE {dbname}')
            print(f"Base de datos '{dbname}' creada exitosamente.")
        else:
            print(f"La base de datos '{dbname}' ya existe.")
            
        cur.close()
        con.close()
    except Exception as e:
        print(f"Error al crear la base de datos: {e}")
        print("Por favor verifica tus credenciales en el archivo .env")

if __name__ == "__main__":
    create_database()
