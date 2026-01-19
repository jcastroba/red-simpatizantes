"""
Views for the referrals application.
"""
import logging
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connection
from django.utils import timezone

from .models import Sympathizer, Department, Municipality
from .serializers import SympathizerSerializer, DepartmentSerializer, MunicipalitySerializer

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """Health check endpoint for monitoring."""

    def get(self, request):
        health_status = {
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'checks': {}
        }

        # Check database connection
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
            health_status['checks']['database'] = 'ok'
        except Exception as e:
            health_status['checks']['database'] = 'error'
            health_status['status'] = 'unhealthy'
            logger.error(f"Health check database error: {str(e)}")

        # Add basic stats
        try:
            health_status['checks']['sympathizers_count'] = Sympathizer.objects.count()
        except Exception:
            health_status['checks']['sympathizers_count'] = 'error'

        status_code = status.HTTP_200_OK if health_status['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(health_status, status=status_code)


class LocationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for departments and municipalities."""
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    @action(detail=True, methods=['get'])
    def municipalities(self, request, pk=None):
        department = self.get_object()
        municipalities = department.municipalities.all()
        serializer = MunicipalitySerializer(municipalities, many=True)
        return Response(serializer.data)


class SympathizerViewSet(viewsets.ModelViewSet):
    """ViewSet for sympathizers."""
    queryset = Sympathizer.objects.select_related('department', 'municipio', 'referrer').all()
    serializer_class = SympathizerSerializer

    @action(detail=False, methods=['post'])
    def check_cedula(self, request):
        """Check if a cedula exists and return a phone hint."""
        cedula = request.data.get('cedula')
        if not cedula:
            return Response({'error': 'La cedula es requerida'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sympathizer = Sympathizer.objects.only('phone').get(cedula=cedula)
            phone = sympathizer.phone
            hint = f"{phone[0]}{'*' * (len(phone) - 3)}{phone[-2:]}" if len(phone) >= 3 else phone
            return Response({'exists': True, 'phone_hint': hint})
        except Sympathizer.DoesNotExist:
            return Response({'exists': False})

    @action(detail=False, methods=['post'])
    def verify_identity(self, request):
        """Verify identity by phone or email."""
        cedula = request.data.get('cedula')
        phone = request.data.get('phone')
        email = request.data.get('email')

        if not cedula:
            return Response({'error': 'La cedula es requerida'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sympathizer = Sympathizer.objects.get(cedula=cedula)
            verified = False
            if phone and sympathizer.phone == phone:
                verified = True
            elif email and sympathizer.email and sympathizer.email.lower() == email.lower():
                verified = True

            if verified:
                serializer = self.get_serializer(sympathizer)
                return Response({'verified': True, 'data': serializer.data})
            else:
                logger.warning(f"Failed identity verification for cedula: {cedula[:4]}***")
                return Response({'verified': False, 'error': 'Verificacion fallida'}, status=status.HTTP_400_BAD_REQUEST)

        except Sympathizer.DoesNotExist:
            return Response({'error': 'Simpatizante no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def get_link_by_cedula(self, request):
        """Get referral link by cedula."""
        cedula = request.data.get('cedula')
        if not cedula:
            return Response({'error': 'La cedula es requerida'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sympathizer = Sympathizer.objects.only('referral_code', 'nombres', 'apellidos').get(cedula=cedula)
            return Response({
                'referral_code': sympathizer.referral_code,
                'nombres': sympathizer.nombres,
                'apellidos': sympathizer.apellidos
            })
        except Sympathizer.DoesNotExist:
            return Response({'error': 'Simpatizante no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='referrer/(?P<code>[^/.]+)')
    def get_referrer(self, request, code=None):
        """Get referrer info by code."""
        try:
            referrer = Sympathizer.objects.only('nombres', 'apellidos', 'link_enabled').get(referral_code=code)
            if not referrer.link_enabled:
                return Response({'error': 'Este enlace de referido esta deshabilitado'}, status=status.HTTP_403_FORBIDDEN)
            return Response({'nombres': referrer.nombres, 'apellidos': referrer.apellidos})
        except Sympathizer.DoesNotExist:
            return Response({'error': 'Referidor no encontrado'}, status=status.HTTP_404_NOT_FOUND)
