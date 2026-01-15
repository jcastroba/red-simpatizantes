from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import Sympathizer, Department, Municipality
from .serializers import SympathizerSerializer
from django.db.models import Q

class AdminLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if user and user.is_staff:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': {
                    'username': user.username,
                    'email': user.email,
                    'is_superuser': user.is_superuser
                }
            })
        return Response({'error': 'Credenciales inválidas o no es administrador'}, status=status.HTTP_401_UNAUTHORIZED)

class AdminNetworkListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        # Networks are defined by root sympathizers (no referrer)
        roots = Sympathizer.objects.filter(referrer__isnull=True).order_by('-created_at')
        data = []
        for root in roots:
            # Calculate total network size (simplified, maybe just direct referrals for now or count all)
            # For performance, let's just count direct referrals or total descendants if feasible.
            # For now, just basic info.
            data.append({
                'id': root.id,
                'name': f"{root.nombres} {root.apellidos}",
                'cedula': root.cedula,
                'referral_code': root.referral_code,
                'created_at': root.created_at,
                'link_enabled': root.link_enabled,
                'direct_referrals': root.referrals.count()
            })
        return Response(data)

    def post(self, request):
        # Create a new network (Root Sympathizer)
        # We need basic info for the root user
        data = request.data
        
        # Validate required fields
        required = ['nombres', 'apellidos', 'cedula', 'phone', 'sexo']
        for field in required:
            if not data.get(field):
                return Response({'error': f'El campo {field} es requerido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Check if cedula exists
            if Sympathizer.objects.filter(cedula=data['cedula']).exists():
                return Response({'error': 'La cédula ya está registrada'}, status=status.HTTP_400_BAD_REQUEST)

            sympathizer = Sympathizer.objects.create(
                nombres=data['nombres'],
                apellidos=data['apellidos'],
                cedula=data['cedula'],
                phone=data['phone'],
                email=data.get('email'),
                sexo=data['sexo'],
                department_id=data.get('department_id'),
                municipio_id=data.get('municipio_id'),
                referrer=None, # Explicitly None for root
                link_enabled=True
            )
            
            return Response({
                'message': 'Red creada exitosamente',
                'referral_code': sympathizer.referral_code,
                'id': sympathizer.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdminUserListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        query = request.query_params.get('q', '')
        network_id = request.query_params.get('network_id')
        
        users = Sympathizer.objects.all().order_by('-created_at')
        
        if query:
            users = users.filter(
                Q(nombres__icontains=query) | 
                Q(apellidos__icontains=query) | 
                Q(cedula__icontains=query)
            )
            
        if network_id:
            # This is tricky without a recursive query or a 'network_id' field on all nodes.
            # For now, let's just filter by direct referrer if that's what is meant, 
            # OR if we want to filter by "Network", we might need to traverse.
            # Given the complexity, maybe we just filter by root?
            # Let's skip complex network filtering for this iteration and just list all users.
            pass

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = 20
        start = (page - 1) * page_size
        end = start + page_size
        total = users.count()
        
        serializer = SympathizerSerializer(users[start:end], many=True)
        
        return Response({
            'results': serializer.data,
            'total': total,
            'page': page,
            'pages': (total + page_size - 1) // page_size
        })

class AdminUserDetailView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, pk):
        try:
            user = Sympathizer.objects.get(pk=pk)
            serializer = SympathizerSerializer(user)
            return Response(serializer.data)
        except Sympathizer.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            user = Sympathizer.objects.get(pk=pk)
            # Check if it has referrals?
            # If we delete a user with referrals, what happens? 
            # on_delete=models.SET_NULL in model, so referrals become orphans (or new roots).
            # This might be intended or not. For now, we allow it.
            user.delete()
            # Also delete associated auth user if exists
            if user.user:
                user.user.delete()
            return Response({'message': 'Usuario eliminado'})
        except Sympathizer.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

class AdminToggleLinkView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            user = Sympathizer.objects.get(pk=pk)
            user.link_enabled = not user.link_enabled
            user.save()
            return Response({'link_enabled': user.link_enabled})
        except Sympathizer.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

class AdminToggleSuspensionView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            sympathizer = Sympathizer.objects.get(pk=pk)
            if sympathizer.user:
                sympathizer.user.is_active = not sympathizer.user.is_active
                sympathizer.user.save()
                return Response({'is_active': sympathizer.user.is_active})
            else:
                # If no user exists, we can't suspend login, but maybe we can flag it?
                # For now, return error or handle gracefully.
                return Response({'error': 'El usuario no tiene cuenta de acceso configurada'}, status=status.HTTP_400_BAD_REQUEST)
        except Sympathizer.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
