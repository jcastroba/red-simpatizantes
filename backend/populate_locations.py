import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from referrals.models import Department, Municipality

def populate():
    # Todos los 125 municipios de Antioquia
    antioquia_municipios = [
        'Medellín', 'Abejorral', 'Abriaquí', 'Alejandría', 'Amagá', 'Amalfi', 'Andes', 'Angelópolis',
        'Angostura', 'Anorí', 'Anzá', 'Apartadó', 'Arboletes', 'Argelia', 'Armenia', 'Barbosa',
        'Bello', 'Belmira', 'Betania', 'Betulia', 'Briceño', 'Buriticá', 'Cáceres', 'Caicedo',
        'Caldas', 'Campamento', 'Cañasgordas', 'Caracolí', 'Caramanta', 'Carepa', 'Carolina del Príncipe',
        'Caucasia', 'Chigorodó', 'Cisneros', 'Ciudad Bolívar', 'Cocorná', 'Concepción', 'Concordia',
        'Copacabana', 'Dabeiba', 'Donmatías', 'Ebéjico', 'El Bagre', 'El Carmen de Viboral',
        'El Peñol', 'El Retiro', 'El Santuario', 'Entrerríos', 'Envigado', 'Fredonia', 'Frontino',
        'Giraldo', 'Girardota', 'Gómez Plata', 'Granada', 'Guadalupe', 'Guarne', 'Guatapé',
        'Heliconia', 'Hispania', 'Itagüí', 'Ituango', 'Jardín', 'Jericó', 'La Ceja', 'La Estrella',
        'La Pintada', 'La Unión', 'Liborina', 'Maceo', 'Marinilla', 'Montebello', 'Murindó',
        'Mutatá', 'Nariño', 'Nechí', 'Necoclí', 'Olaya', 'Peque', 'Pueblorrico', 'Puerto Berrío',
        'Puerto Nare', 'Puerto Triunfo', 'Remedios', 'Rionegro', 'Sabanalarga', 'Sabaneta',
        'Salgar', 'San Andrés de Cuerquia', 'San Carlos', 'San Francisco', 'San Jerónimo',
        'San José de la Montaña', 'San Juan de Urabá', 'San Luis', 'San Pedro de los Milagros',
        'San Pedro de Urabá', 'San Rafael', 'San Roque', 'San Vicente Ferrer', 'Santa Bárbara',
        'Santa Fe de Antioquia', 'Santa Rosa de Osos', 'Santo Domingo', 'Segovia', 'Sonsón',
        'Sopetrán', 'Támesis', 'Tarazá', 'Tarso', 'Titiribí', 'Toledo', 'Turbo', 'Uramita',
        'Urrao', 'Valdivia', 'Valparaíso', 'Vegachí', 'Venecia', 'Vigía del Fuerte', 'Yalí',
        'Yarumal', 'Yolombó', 'Yondó', 'Zaragoza'
    ]

    # Crear departamento Antioquia
    dept, created = Department.objects.get_or_create(name='Antioquia')
    print(f"Departamento: Antioquia {'(creado)' if created else '(existente)'}")

    # Crear municipios
    count = 0
    for mun_name in antioquia_municipios:
        _, created = Municipality.objects.get_or_create(department=dept, name=mun_name)
        if created:
            count += 1

    print(f"Municipios creados: {count}")
    print(f"Total municipios Antioquia: {len(antioquia_municipios)}")

if __name__ == '__main__':
    populate()
