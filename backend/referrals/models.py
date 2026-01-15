from django.db import models
from django.contrib.auth.models import User
import random
import string

def generate_referral_code():
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        if not Sympathizer.objects.filter(referral_code=code).exists():
            return code

class Department(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Municipality(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='municipalities')
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name}, {self.department.name}"

class Sympathizer(models.Model):
    SEX_CHOICES = [
        ('M', 'MASCULINO'),
        ('F', 'FEMENINO'),
        ('O', 'OTRO'),
    ]

    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    cedula = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True, null=True, blank=True) # Email might be optional if phone is used, but user said "solicitemos tambien ... el correo"
    phone = models.CharField(max_length=10)
    sexo = models.CharField(max_length=1, choices=SEX_CHOICES)
    
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    municipio = models.ForeignKey(Municipality, on_delete=models.SET_NULL, null=True)
    
    referral_code = models.CharField(max_length=8, default=generate_referral_code, unique=True, editable=False)
    referrer = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='referrals')
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='sympathizer')
    link_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    activated_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"
