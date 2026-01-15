import os
import django
import random
import string

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from referrals.models import Sympathizer, Department, Municipality

def generate_random_digits(length=10):
    return ''.join(random.choices(string.digits, k=length))

def create_sympathizer(referrer, level_index, sibling_index, dept=None, mun=None):
    # Generate unique data
    while True:
        cedula = generate_random_digits(10)
        if not Sympathizer.objects.filter(cedula=cedula).exists():
            break
    
    first_name = f"Nivel{level_index}"
    last_name = f"Usuario{sibling_index}"
    email = f"user_{cedula}@test.com"
    phone = "3" + generate_random_digits(9)
    
    # Create User
    # Check if user exists (unlikely with random cedula but good practice)
    if User.objects.filter(username=cedula).exists():
        user = User.objects.get(username=cedula)
    else:
        user = User.objects.create_user(username=cedula, email=email, password='password123')
    
    # Create Sympathizer
    sympathizer = Sympathizer.objects.create(
        nombres=first_name,
        apellidos=last_name,
        cedula=cedula,
        email=email,
        phone=phone,
        sexo=random.choice(['M', 'F']),
        referrer=referrer,
        user=user,
        department=dept,
        municipio=mun
    )
    return sympathizer

def populate():
    root_cedula = "1000399184"
    
    print("Iniciando carga de datos de prueba...")
    
    # Get some location data if available
    dept = Department.objects.first()
    mun = Municipality.objects.first() if dept else None

    # Handle Root User
    try:
        root_sympathizer = Sympathizer.objects.get(cedula=root_cedula)
        print(f"Usuario raiz encontrado: {root_sympathizer}")
        root_user = root_sympathizer.user
    except Sympathizer.DoesNotExist:
        print("Usuario raiz no encontrado. Creando...")
        # Check if user exists but no sympathizer
        root_user, created = User.objects.get_or_create(username=root_cedula)
        if created:
            root_user.set_password('password123')
            root_user.save()
            
        root_sympathizer = Sympathizer.objects.create(
            nombres="Andres",
            apellidos="Torres",
            cedula=root_cedula,
            email="andres@torres.com",
            phone="3000000000",
            sexo='M',
            user=root_user,
            department=dept,
            municipio=mun
        )

    # Delete everyone else
    print("Eliminando usuarios antiguos (excepto raiz y superusuarios)...")
    # We want to keep the root user and any superusers (admin)
    users_to_keep = [root_user.id]
    for su in User.objects.filter(is_superuser=True):
        users_to_keep.append(su.id)
        
    count, _ = User.objects.exclude(id__in=users_to_keep).delete()
    print(f"Se eliminaron {count} registros antiguos.")

    print("Creando jerarquia de referidos...")
    
    # Level 1: 5 coordinators
    coordinators = []
    for i in range(5):
        s = create_sympathizer(root_sympathizer, 1, i+1, dept, mun)
        coordinators.append(s)
    print(f"Nivel 1: {len(coordinators)} Coordinadores creados.")

    # Level 2: 3 under each coordinator
    level2_users = []
    for coord in coordinators:
        for i in range(3):
            s = create_sympathizer(coord, 2, i+1, dept, mun)
            level2_users.append(s)
    print(f"Nivel 2: {len(level2_users)} usuarios creados.")

    # Level 3: 2 under each level 2
    level3_users = []
    for parent in level2_users:
        for i in range(2):
            s = create_sympathizer(parent, 3, i+1, dept, mun)
            level3_users.append(s)
    print(f"Nivel 3: {len(level3_users)} usuarios creados.")

    # Level 4: 1 under each level 3
    level4_users = []
    for parent in level3_users:
        for i in range(1):
            s = create_sympathizer(parent, 4, i+1, dept, mun)
            level4_users.append(s)
    print(f"Nivel 4: {len(level4_users)} usuarios creados.")
    
    # Level 5: 1 under 50% of level 4
    level5_users = []
    for i, parent in enumerate(level4_users):
        if i % 2 == 0: # Every other one
            s = create_sympathizer(parent, 5, i+1, dept, mun)
            level5_users.append(s)
    print(f"Nivel 5: {len(level5_users)} usuarios creados.")

    # Level 6: 1 under 50% of level 5
    level6_users = []
    for i, parent in enumerate(level5_users):
        if i % 2 == 0:
            s = create_sympathizer(parent, 6, i+1, dept, mun)
            level6_users.append(s)
    print(f"Nivel 6: {len(level6_users)} usuarios creados.")

    total_users = Sympathizer.objects.count()
    print(f"Proceso finalizado. Total de simpatizantes en BD: {total_users}")

if __name__ == '__main__':
    populate()
