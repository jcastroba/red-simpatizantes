from django.db import models
from django.contrib.auth.models import User
from simple_history.models import HistoricalRecords
import random
import string
import secrets


def generate_referral_code():
    """Generate a unique 8-character referral code using cryptographically secure random."""
    max_attempts = 100
    for _ in range(max_attempts):
        code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        if not Sympathizer.objects.filter(referral_code=code).exists():
            return code
    raise RuntimeError("Unable to generate unique referral code after maximum attempts")


class Department(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ['name']
        verbose_name = 'Departamento'
        verbose_name_plural = 'Departamentos'

    def __str__(self):
        return self.name


class Municipality(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='municipalities')
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ['name']
        verbose_name = 'Municipio'
        verbose_name_plural = 'Municipios'

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
    cedula = models.CharField(max_length=20, unique=True, db_index=True)
    email = models.EmailField(null=True, blank=True, db_index=True)  # Email opcional, no único
    phone = models.CharField(max_length=15)
    sexo = models.CharField(max_length=1, choices=SEX_CHOICES)

    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    municipio = models.ForeignKey(Municipality, on_delete=models.SET_NULL, null=True, blank=True)

    referral_code = models.CharField(max_length=8, default=generate_referral_code, unique=True, editable=False, db_index=True)
    referrer = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='referrals')
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='sympathizer')

    # Campo para identificar la red/político al que pertenece (solo para roots)
    network_name = models.CharField(max_length=100, null=True, blank=True, help_text="Nombre de la red/político (solo para fundadores)")

    link_enabled = models.BooleanField(default=True)
    is_suspended = models.BooleanField(default=False, help_text="Si está suspendido, no puede acceder al sistema")

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Audit history
    history = HistoricalRecords()

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Simpatizante'
        verbose_name_plural = 'Simpatizantes'
        indexes = [
            models.Index(fields=['nombres', 'apellidos']),
            models.Index(fields=['referrer']),
        ]

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"

    @property
    def full_name(self):
        return f"{self.nombres} {self.apellidos}"

    def get_direct_referrals_count(self):
        """Get count of direct referrals."""
        return self.referrals.count()

    def get_total_network_size(self):
        """Get total size of the network under this sympathizer (recursive)."""
        count = 0
        to_visit = list(self.referrals.all())
        while to_visit:
            current = to_visit.pop()
            count += 1
            to_visit.extend(list(current.referrals.all()))
        return count

    def get_root(self):
        """Get the root (founder) of this sympathizer's network."""
        current = self
        while current.referrer:
            current = current.referrer
        return current

    def get_network_name(self):
        """Get the network name from the root of the chain."""
        root = self.get_root()
        return root.network_name or f"Red de {root.full_name}"

    @property
    def is_root(self):
        """Check if this sympathizer is a root (no referrer)."""
        return self.referrer is None


class LevelLabel(models.Model):
    owner = models.ForeignKey(Sympathizer, on_delete=models.CASCADE, related_name='level_labels')
    level = models.PositiveIntegerField()
    name = models.CharField(max_length=100)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['level']
        unique_together = ('owner', 'level')
        verbose_name = 'Nombre de Nivel'
        verbose_name_plural = 'Nombres de Niveles'

    def __str__(self):
        return f"{self.owner.full_name} - Nivel {self.level}: {self.name}"
