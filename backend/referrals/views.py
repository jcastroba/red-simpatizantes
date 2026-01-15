from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Sympathizer, Department, Municipality
from .serializers import SympathizerSerializer, DepartmentSerializer, MunicipalitySerializer

class LocationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    @action(detail=True, methods=['get'])
    def municipalities(self, request, pk=None):
        department = self.get_object()
        municipalities = department.municipalities.all()
        serializer = MunicipalitySerializer(municipalities, many=True)
        return Response(serializer.data)

class SympathizerViewSet(viewsets.ModelViewSet):
    queryset = Sympathizer.objects.all()
    serializer_class = SympathizerSerializer

    @action(detail=False, methods=['post'])
    def check_cedula(self, request):
        cedula = request.data.get('cedula')
        if not cedula:
            return Response({'error': 'La cédula es requerida'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            sympathizer = Sympathizer.objects.get(cedula=cedula)
            # Return hint
            phone = sympathizer.phone
            hint = f"{phone[0]}{'*' * (len(phone) - 3)}{phone[-2:]}" if len(phone) >= 3 else phone
            return Response({'exists': True, 'phone_hint': hint})
        except Sympathizer.DoesNotExist:
            return Response({'exists': False})

    @action(detail=False, methods=['post'])
    def verify_identity(self, request):
        cedula = request.data.get('cedula')
        phone = request.data.get('phone')
        email = request.data.get('email')

        if not cedula:
            return Response({'error': 'La cédula es requerida'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            sympathizer = Sympathizer.objects.get(cedula=cedula)
            verified = False
            if phone and sympathizer.phone == phone:
                verified = True
            elif email and sympathizer.email == email:
                verified = True
            
            if verified:
                serializer = self.get_serializer(sympathizer)
                return Response({'verified': True, 'data': serializer.data})
            else:
                return Response({'verified': False, 'error': 'Verificación fallida'}, status=status.HTTP_400_BAD_REQUEST)

        except Sympathizer.DoesNotExist:
            return Response({'error': 'Simpatizante no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def get_link_by_cedula(self, request):
        cedula = request.data.get('cedula')
        if not cedula:
            return Response({'error': 'La cédula es requerida'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            sympathizer = Sympathizer.objects.get(cedula=cedula)
            return Response({
                'referral_code': sympathizer.referral_code,
                'nombres': sympathizer.nombres,
                'apellidos': sympathizer.apellidos
            })
        except Sympathizer.DoesNotExist:
            return Response({'error': 'Simpatizante no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='referrer/(?P<code>[^/.]+)')
    def get_referrer(self, request, code=None):
        try:
            referrer = Sympathizer.objects.get(referral_code=code)
            return Response({'nombres': referrer.nombres, 'apellidos': referrer.apellidos})
        except Sympathizer.DoesNotExist:
            return Response({'error': 'Referidor no encontrado'}, status=status.HTTP_404_NOT_FOUND)

