from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.utils import timezone
from decouple import config
import resend
from .models import Sympathizer

# Configure Resend
resend.api_key = config('RESEND_API_KEY', default='')

class CheckUserView(APIView):
    def post(self, request):
        cedula = request.data.get('cedula')
        if not cedula:
            return Response({'error': 'La cédula es requerida'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            sympathizer = Sympathizer.objects.get(cedula=cedula)
            
            # Determine if the user has a valid account setup
            has_user = False
            if sympathizer.user:
                # Only consider it a valid user if it's active and has a password set
                if sympathizer.user.is_active and sympathizer.user.has_usable_password():
                    has_user = True
            
            return Response({
                'exists': True,
                'has_user': has_user,
                'email': sympathizer.email,
                'masked_email': self.mask_email(sympathizer.email) if sympathizer.email else None
            })
        except Sympathizer.DoesNotExist:
            return Response({'exists': False}, status=status.HTTP_404_NOT_FOUND)

    def mask_email(self, email):
        if not email: return ""
        try:
            user, domain = email.split('@')
            return f"{user[:2]}***@{domain}"
        except:
            return email

class RequestPasswordSetupView(APIView):
    def post(self, request):
        cedula = request.data.get('cedula')
        try:
            sympathizer = Sympathizer.objects.get(cedula=cedula)
            if not sympathizer.email:
                return Response({'error': 'No hay correo electrónico registrado para este usuario'}, status=status.HTTP_400_BAD_REQUEST)
            
            # We need a user object to generate a token. If it doesn't exist, we can't use default_token_generator easily
            # without creating a user. 
            # Strategy: Create an inactive user if not exists.
            user = sympathizer.user
            if not user:
                user = User.objects.create_user(username=cedula, email=sympathizer.email, is_active=False)
                user.set_unusable_password()
                user.save()
                sympathizer.user = user
                sympathizer.save()
            
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            # Construct link using FRONTEND_URL from settings
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            link = f"{frontend_url}/set-password?uid={uid}&token={token}"

            print(f"\n\n--- PASSWORD SETUP LINK ---\n{link}\n---------------------------\n")

            # Send email using Resend
            try:
                resend.Emails.send({
                    "from": "Red de Simpatizantes <onboarding@resend.dev>",
                    "to": [sympathizer.email],
                    "subject": "Configura tu contraseña - Red de Simpatizantes",
                    "html": f"""
                        <h2>Hola {sympathizer.nombres},</h2>
                        <p>Haz click en el siguiente enlace para configurar tu contraseña:</p>
                        <p><a href="{link}" style="background-color: #6B5B95; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Configurar Contraseña</a></p>
                        <p>O copia este enlace en tu navegador:</p>
                        <p>{link}</p>
                        <p>Este enlace expira en 24 horas.</p>
                        <p>Si no solicitaste este correo, puedes ignorarlo.</p>
                    """
                })
            except Exception as e:
                print(f"Error sending email: {e}")
                return Response({'error': 'Error al enviar el correo'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({'message': 'Email enviado'})
            
        except Sympathizer.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

class SetPasswordView(APIView):
    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        password = request.data.get('password')
        
        if not uidb64 or not token or not password:
            return Response({'error': 'Datos incompletos'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Enlace inválido'}, status=status.HTTP_400_BAD_REQUEST)
        
        if default_token_generator.check_token(user, token):
            user.set_password(password)
            user.is_active = True
            user.save()
            
            # Update activated_at timestamp
            if hasattr(user, 'sympathizer'):
                user.sympathizer.activated_at = timezone.now()
                user.sympathizer.save()

            return Response({'message': 'Password set successfully'})
        else:
            return Response({'error': 'Token inválido o expirado'}, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        cedula = request.data.get('cedula')
        password = request.data.get('password')
        
        user = authenticate(username=cedula, password=password)
        if user:
            try:
                token, _ = Token.objects.get_or_create(user=user)
                return Response({
                    'token': token.key,
                    'user': {
                        'nombres': user.sympathizer.nombres,
                        'apellidos': user.sympathizer.apellidos,
                        'referral_code': user.sympathizer.referral_code
                    }
                })
            except Exception as e:
                print(f"DEBUG: Error in LoginView: {e}")
                return Response({'error': f'Error de inicio de sesión: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        print(f"DEBUG: Dashboard requested by user: {request.user.username}")
        try:
            sympathizer = request.user.sympathizer
            
            # Get only direct referrals
            direct_referrals = sympathizer.referrals.all().order_by('-created_at')
            
            referrals_data = []
            for ref in direct_referrals:
                # Get THEIR referrals (grandchildren)
                # We only fetch one level deep for the detail view as requested
                sub_referrals = ref.referrals.all().order_by('-created_at')
                sub_referrals_data = [{
                    'id': sub.id,
                    'nombres': sub.nombres,
                    'apellidos': sub.apellidos,
                    'cedula': sub.cedula,
                    'phone': sub.phone,
                    'email': sub.email,
                    'created_at': sub.created_at
                } for sub in sub_referrals]

                referrals_data.append({
                    'id': ref.id,
                    'nombres': ref.nombres,
                    'apellidos': ref.apellidos,
                    'cedula': ref.cedula,
                    'email': ref.email,
                    'phone': ref.phone,
                    'created_at': ref.created_at,
                    'referrals_count': ref.referrals.count(),
                    'sub_referrals': sub_referrals_data
                })
            
            return Response({
                'nombres': sympathizer.nombres,
                'apellidos': sympathizer.apellidos,
                'referral_code': sympathizer.referral_code,
                'referrals_count': sympathizer.referrals.count(), # Direct referrals count
                'referrals': referrals_data
            })
        except Exception as e:
            print(f"DEBUG: Error in DashboardView: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class NetworkView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            me = request.user.sympathizer
            
            # Data structures for layout
            nodes_dict = {} # id -> node data
            children_map = {} # id -> [child_ids]
            
            # 1. Build the tree structure (BFS/Traversal)
            # We need to traverse to find all nodes first
            
            # Initialize with Me
            to_visit = [me]
            visited = {me.id}
            
            # Helper to create node dict
            def create_node_data(sympathizer, type_node, level):
                return {
                    'id': sympathizer.id,
                    'nombres': sympathizer.nombres,
                    'apellidos': sympathizer.apellidos,
                    'cedula': sympathizer.cedula,
                    'telefono': sympathizer.phone,
                    'email': sympathizer.email,
                    'referrals_count': sympathizer.referrals.count(),
                    'type': type_node,
                    'level': level,
                    'x': 0, # Placeholder
                    'y': 0  # Placeholder
                }

            nodes_dict[me.id] = create_node_data(me, 'me', 0)
            children_map[me.id] = []

            # Add Sponsor if exists
            if me.referrer:
                sponsor = me.referrer
                nodes_dict[sponsor.id] = create_node_data(sponsor, 'sponsor', -1)
                children_map[sponsor.id] = [me.id] # Sponsor is parent of me
                # Note: We don't traverse up from sponsor, only down from me
            
            # BFS to populate nodes_dict and children_map
            queue = [(me, 0)]
            
            while queue:
                current, level = queue.pop(0)
                
                # Get children ordered by ID to ensure deterministic order
                direct_referrals = current.referrals.all().order_by('id')
                
                current_children_ids = []
                for ref in direct_referrals:
                    if ref.id not in visited:
                        visited.add(ref.id)
                        nodes_dict[ref.id] = create_node_data(ref, 'referral', level + 1)
                        children_map[ref.id] = []
                        current_children_ids.append(ref.id)
                        queue.append((ref, level + 1))
                
                children_map[current.id] = current_children_ids

            # 2. Calculate Layout (Reingold-Tilford simplified)
            # We calculate X positions based on a post-order traversal
            # Leaves get sequential X. Parents get average of children X.
            
            next_leaf_x = 0
            X_SPACING = 100
            
            def calculate_layout(node_id):
                nonlocal next_leaf_x
                
                children = children_map.get(node_id, [])
                
                if not children:
                    # Leaf
                    nodes_dict[node_id]['x'] = next_leaf_x
                    next_leaf_x += X_SPACING
                else:
                    # Internal node
                    child_xs = []
                    for child_id in children:
                        calculate_layout(child_id)
                        child_xs.append(nodes_dict[child_id]['x'])
                    
                    # Parent X is average of children X
                    nodes_dict[node_id]['x'] = sum(child_xs) / len(child_xs)

            # Run layout starting from 'me'
            calculate_layout(me.id)
            
            # If sponsor exists, place it above 'me'
            if me.referrer and me.referrer.id in nodes_dict:
                nodes_dict[me.referrer.id]['x'] = nodes_dict[me.id]['x']

            # 3. Construct Response
            final_nodes = list(nodes_dict.values())
            final_links = []
            
            # Create links based on children_map
            for parent_id, children_ids in children_map.items():
                for child_id in children_ids:
                    final_links.append({'source': parent_id, 'target': child_id})
            
            return Response({'nodes': final_nodes, 'links': final_links})
            
        except Exception as e:
            print(f"DEBUG: Error in NetworkView: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
