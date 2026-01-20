"""
Django management command to assign passwords to users by cedula.
Usage:
    python manage.py assign_password <cedula> --password <password>
    python manage.py assign_password <cedula> --generate
    python manage.py assign_password <cedula> --admin --password <password>
"""
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from django.utils import timezone
from referrals.models import Sympathizer
from rest_framework.authtoken.models import Token
import secrets
import string


class Command(BaseCommand):
    help = 'Assign a password to a user by cedula. Creates the user if it does not exist.'

    def add_arguments(self, parser):
        parser.add_argument('cedula', type=str, help='Cedula of the sympathizer')
        parser.add_argument(
            '--password',
            type=str,
            help='Password to assign (if not provided with --generate, will prompt)'
        )
        parser.add_argument(
            '--generate',
            action='store_true',
            help='Generate a random secure password'
        )
        parser.add_argument(
            '--admin',
            action='store_true',
            help='Make this user a staff member (admin access)'
        )
        parser.add_argument(
            '--superuser',
            action='store_true',
            help='Make this user a superuser (full admin access)'
        )

    def generate_password(self, length=12):
        """Generate a secure random password."""
        alphabet = string.ascii_letters + string.digits + "!@#$%&*"
        return ''.join(secrets.choice(alphabet) for _ in range(length))

    def handle(self, *args, **options):
        cedula = options['cedula']
        password = options['password']
        generate = options['generate']
        make_admin = options['admin']
        make_superuser = options['superuser']

        # Find the sympathizer
        try:
            sympathizer = Sympathizer.objects.get(cedula=cedula)
        except Sympathizer.DoesNotExist:
            raise CommandError(f'Sympathizer with cedula "{cedula}" does not exist.')

        # Determine password
        if generate:
            password = self.generate_password()
            self.stdout.write(f'Generated password: {password}')
        elif not password:
            raise CommandError('Please provide --password or use --generate')

        # Create or get the user
        username = f'user_{cedula}'

        if sympathizer.user:
            user = sympathizer.user
            self.stdout.write(f'Updating existing user: {user.username}')
        else:
            # Create new user
            user = User.objects.create_user(
                username=username,
                email=sympathizer.email or '',
                first_name=sympathizer.nombres,
                last_name=sympathizer.apellidos,
            )
            sympathizer.user = user
            sympathizer.save()
            self.stdout.write(self.style.SUCCESS(f'Created new user: {username}'))

        # Set the password and activate user
        user.set_password(password)
        user.is_active = True

        # Mark sympathizer as activated (has password)
        sympathizer.activated_at = timezone.now()
        sympathizer.save()

        # Set admin permissions if requested
        if make_superuser:
            user.is_staff = True
            user.is_superuser = True
            self.stdout.write(self.style.WARNING('User set as SUPERUSER'))
        elif make_admin:
            user.is_staff = True
            self.stdout.write(self.style.WARNING('User set as STAFF (admin access)'))

        user.save()

        # Create or refresh token
        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)

        self.stdout.write(self.style.SUCCESS(f'\nPassword assigned successfully!'))
        self.stdout.write(f'Cedula: {cedula}')
        self.stdout.write(f'Username: {user.username}')
        self.stdout.write(f'Name: {sympathizer.full_name}')
        self.stdout.write(f'Token: {token.key}')

        if make_admin or make_superuser:
            self.stdout.write(self.style.WARNING(f'Admin access: YES'))
