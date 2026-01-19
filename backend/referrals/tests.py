"""
Tests for the referrals application.
Run with: pytest referrals/tests.py -v
"""
import pytest
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Sympathizer, Department, Municipality


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def department(db):
    return Department.objects.create(name="Antioquia")


@pytest.fixture
def municipality(db, department):
    return Municipality.objects.create(name="Medellin", department=department)


@pytest.fixture
def sympathizer(db, department, municipality):
    return Sympathizer.objects.create(
        nombres="Juan",
        apellidos="Perez",
        cedula="1234567890",
        email="juan@test.com",
        phone="3001234567",
        sexo="M",
        department=department,
        municipio=municipality,
    )


@pytest.fixture
def user_with_password(db, sympathizer):
    user = User.objects.create_user(
        username=sympathizer.cedula,
        email=sympathizer.email,
        password="testpassword123",
        is_active=True
    )
    sympathizer.user = user
    sympathizer.save()
    return sympathizer


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="admin",
        email="admin@test.com",
        password="adminpassword123"
    )


# ============ Model Tests ============

class TestSympathizerModel:
    def test_create_sympathizer(self, db, department, municipality):
        sympathizer = Sympathizer.objects.create(
            nombres="Test",
            apellidos="User",
            cedula="9876543210",
            email="test@test.com",
            phone="3009876543",
            sexo="F",
            department=department,
            municipio=municipality,
        )
        assert sympathizer.id is not None
        assert sympathizer.referral_code is not None
        assert len(sympathizer.referral_code) == 8

    def test_referral_code_unique(self, db, sympathizer):
        # Create another sympathizer and verify different code
        s2 = Sympathizer.objects.create(
            nombres="Another",
            apellidos="User",
            cedula="1111111111",
            phone="3001111111",
            sexo="M",
        )
        assert s2.referral_code != sympathizer.referral_code

    def test_full_name_property(self, db, sympathizer):
        assert sympathizer.full_name == "Juan Perez"

    def test_referral_relationship(self, db, sympathizer, department, municipality):
        # Create a referral
        referral = Sympathizer.objects.create(
            nombres="Referido",
            apellidos="Test",
            cedula="2222222222",
            phone="3002222222",
            sexo="M",
            referrer=sympathizer,
            department=department,
            municipio=municipality,
        )
        assert referral.referrer == sympathizer
        assert sympathizer.referrals.count() == 1
        assert sympathizer.get_direct_referrals_count() == 1


# ============ API Tests ============

class TestHealthCheck:
    def test_health_check_returns_healthy(self, api_client, db):
        response = api_client.get('/api/health/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'healthy'
        assert 'database' in response.data['checks']


class TestLocationAPI:
    def test_list_departments(self, api_client, department):
        response = api_client.get('/api/locations/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_get_municipalities(self, api_client, department, municipality):
        response = api_client.get(f'/api/locations/{department.id}/municipalities/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1


class TestSympathizerAPI:
    def test_check_cedula_exists(self, api_client, sympathizer):
        response = api_client.post('/api/sympathizers/check_cedula/', {'cedula': sympathizer.cedula})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['exists'] is True
        assert 'phone_hint' in response.data

    def test_check_cedula_not_exists(self, api_client, db):
        response = api_client.post('/api/sympathizers/check_cedula/', {'cedula': '9999999999'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['exists'] is False

    def test_get_referrer(self, api_client, sympathizer):
        response = api_client.get(f'/api/sympathizers/referrer/{sympathizer.referral_code}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['nombres'] == sympathizer.nombres

    def test_get_referrer_disabled_link(self, api_client, sympathizer):
        sympathizer.link_enabled = False
        sympathizer.save()
        response = api_client.get(f'/api/sympathizers/referrer/{sympathizer.referral_code}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestAuthAPI:
    def test_check_user_exists_no_password(self, api_client, sympathizer):
        response = api_client.post('/api/auth/check-user/', {'cedula': sympathizer.cedula})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['exists'] is True
        assert response.data['has_user'] is False

    def test_check_user_exists_with_password(self, api_client, user_with_password):
        response = api_client.post('/api/auth/check-user/', {'cedula': user_with_password.cedula})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['exists'] is True
        assert response.data['has_user'] is True

    def test_check_user_not_exists(self, api_client, db):
        response = api_client.post('/api/auth/check-user/', {'cedula': '9999999999'})
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.data['exists'] is False

    def test_login_success(self, api_client, user_with_password):
        response = api_client.post('/api/auth/login/', {
            'cedula': user_with_password.cedula,
            'password': 'testpassword123'
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'token' in response.data
        assert 'user' in response.data

    def test_login_invalid_password(self, api_client, user_with_password):
        response = api_client.post('/api/auth/login/', {
            'cedula': user_with_password.cedula,
            'password': 'wrongpassword'
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_suspended_user(self, api_client, user_with_password):
        user_with_password.is_suspended = True
        user_with_password.save()
        response = api_client.post('/api/auth/login/', {
            'cedula': user_with_password.cedula,
            'password': 'testpassword123'
        })
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_dashboard_requires_auth(self, api_client, db):
        response = api_client.get('/api/auth/dashboard/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_dashboard_with_auth(self, api_client, user_with_password):
        # Login first
        login_response = api_client.post('/api/auth/login/', {
            'cedula': user_with_password.cedula,
            'password': 'testpassword123'
        })
        token = login_response.data['token']

        # Access dashboard
        api_client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        response = api_client.get('/api/auth/dashboard/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['nombres'] == user_with_password.nombres


class TestAdminAPI:
    def test_admin_login_success(self, api_client, admin_user):
        response = api_client.post('/api/admin/login/', {
            'username': 'admin',
            'password': 'adminpassword123'
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'token' in response.data

    def test_admin_login_non_staff(self, api_client, user_with_password):
        response = api_client.post('/api/admin/login/', {
            'username': user_with_password.cedula,
            'password': 'testpassword123'
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_admin_networks_requires_auth(self, api_client, db):
        response = api_client.get('/api/admin/networks/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_admin_networks_with_auth(self, api_client, admin_user, sympathizer):
        # Login as admin
        login_response = api_client.post('/api/admin/login/', {
            'username': 'admin',
            'password': 'adminpassword123'
        })
        token = login_response.data['token']

        # Access networks
        api_client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        response = api_client.get('/api/admin/networks/')
        assert response.status_code == status.HTTP_200_OK

    def test_admin_toggle_suspension(self, api_client, admin_user, user_with_password):
        # Login as admin
        login_response = api_client.post('/api/admin/login/', {
            'username': 'admin',
            'password': 'adminpassword123'
        })
        token = login_response.data['token']

        # Toggle suspension
        api_client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        response = api_client.post(f'/api/admin/users/{user_with_password.id}/toggle-suspension/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_suspended'] is True

        # Verify in database
        user_with_password.refresh_from_db()
        assert user_with_password.is_suspended is True


# ============ Pytest Configuration ============

@pytest.fixture(scope='session')
def django_db_setup():
    """Configure Django for testing."""
    pass
