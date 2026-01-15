import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from referrals.models import Department, Municipality

def populate():
    locations = {
        'Antioquia': ['Medellín', 'Bello', 'Envigado'],
        'Cundinamarca': ['Bogotá', 'Soacha', 'Zipaquirá'],
        'Valle del Cauca': ['Cali', 'Palmira', 'Buenaventura'],
        'Atlántico': ['Barranquilla', 'Soledad', 'Malambo'],
        'Bolívar': ['Cartagena', 'Magangué', 'Turbaco']
    }

    for dept_name, mun_list in locations.items():
        dept, created = Department.objects.get_or_create(name=dept_name)
        for mun_name in mun_list:
            Municipality.objects.get_or_create(department=dept, name=mun_name)
    
    print("Locations populated")

if __name__ == '__main__':
    populate()
