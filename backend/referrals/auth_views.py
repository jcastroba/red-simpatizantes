"""
Authentication views for the referrals application.
Includes rate limiting, structured logging, and optimized queries.
"""
import logging
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
from django.db.models import Prefetch
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

from .models import Sympathizer
from .services.email import EmailService

logger = logging.getLogger(__name__)


class CheckUserView(APIView):
    """Check if a user exists by cedula."""

    @method_decorator(ratelimit(key='ip', rate='20/m', method='POST', block=True))
    def post(self, request):
        cedula = request.data.get('cedula')
        if not cedula:
            return Response({'error': 'La cedula es requerida'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sympathizer = Sympathizer.objects.select_related('user').get(cedula=cedula)

            # Determine if the user has a valid account setup
            has_user = False
            if sympathizer.user:
                if sympathizer.user.is_active and sympathizer.user.has_usable_password():
                    has_user = True

            return Response({
                'exists': True,
                'has_user': has_user,
                'email': sympathizer.email,
                'masked_email': self._mask_email(sympathizer.email) if sympathizer.email else None
            })
        except Sympathizer.DoesNotExist:
            return Response({'exists': False}, status=status.HTTP_404_NOT_FOUND)

    @staticmethod
    def _mask_email(email: str) -> str:
        """Mask email for privacy."""
        if not email:
            return ""
        try:
            user_part, domain = email.split('@')
            masked = f"{user_part[:2]}{'*' * min(len(user_part) - 2, 5)}@{domain}"
            return masked
        except ValueError:
            return email


class RequestPasswordSetupView(APIView):
    """Request password setup email."""

    @method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True))
    def post(self, request):
        cedula = request.data.get('cedula')
        if not cedula:
            return Response({'error': 'La cedula es requerida'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sympathizer = Sympathizer.objects.select_related('user').get(cedula=cedula)

            if not sympathizer.email:
                logger.warning(f"Password setup requested for user without email: {cedula[:4]}***")
                return Response(
                    {'error': 'No hay correo electronico registrado para este usuario'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create an inactive user if not exists
            user = sympathizer.user
            if not user:
                user = User.objects.create_user(
                    username=cedula,
                    email=sympathizer.email,
                    is_active=False
                )
                user.set_unusable_password()
                user.save()
                sympathizer.user = user
                sympathizer.save()

            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            link = f"{frontend_url}/set-password?uid={uid}&token={token}"

            logger.info(f"Password setup requested for cedula: {cedula[:4]}***")

            # Send email using EmailService
            if EmailService.send_password_setup(sympathizer, link):
                return Response({'message': 'Email enviado'})
            else:
                return Response(
                    {'error': 'Error al enviar el correo'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Sympathizer.DoesNotExist:
            logger.warning(f"Password setup requested for non-existent cedula: {cedula[:4]}***")
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)


class ForgotPasswordView(APIView):
    """Request password reset email for existing users."""

    @method_decorator(ratelimit(key='ip', rate='3/m', method='POST', block=True))
    def post(self, request):
        cedula = request.data.get('cedula')
        if not cedula:
            return Response({'error': 'La cedula es requerida'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sympathizer = Sympathizer.objects.select_related('user').get(cedula=cedula)

            if not sympathizer.email:
                return Response(
                    {'error': 'No hay correo electronico registrado para este usuario'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not sympathizer.user or not sympathizer.user.has_usable_password():
                return Response(
                    {'error': 'Esta cuenta no tiene una contrasena configurada. Use la opcion de configurar contrasena.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = sympathizer.user
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            link = f"{frontend_url}/reset-password?uid={uid}&token={token}"

            logger.info(f"Password reset requested for cedula: {cedula[:4]}***")

            if EmailService.send_password_reset(sympathizer, link):
                return Response({'message': 'Email de recuperacion enviado'})
            else:
                return Response(
                    {'error': 'Error al enviar el correo'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Sympathizer.DoesNotExist:
            # Return success anyway to prevent enumeration attacks
            logger.info(f"Password reset requested for non-existent cedula")
            return Response({'message': 'Si el usuario existe, se enviara un correo de recuperacion'})


class SetPasswordView(APIView):
    """Set or reset password using token."""

    @method_decorator(ratelimit(key='ip', rate='10/m', method='POST', block=True))
    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        password = request.data.get('password')

        if not uidb64 or not token or not password:
            return Response({'error': 'Datos incompletos'}, status=status.HTTP_400_BAD_REQUEST)

        # Password validation
        if len(password) < 8:
            return Response(
                {'error': 'La contrasena debe tener al menos 8 caracteres'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            logger.warning(f"Invalid password set attempt with uid: {uidb64}")
            return Response({'error': 'Enlace invalido'}, status=status.HTTP_400_BAD_REQUEST)

        if default_token_generator.check_token(user, token):
            user.set_password(password)
            user.is_active = True
            user.save()

            # Update activated_at timestamp
            if hasattr(user, 'sympathizer'):
                user.sympathizer.activated_at = timezone.now()
                user.sympathizer.save()
                logger.info(f"Password set successfully for user: {user.username[:4]}***")

            return Response({'message': 'Contrasena configurada exitosamente'})
        else:
            logger.warning(f"Invalid or expired token for user: {user.username[:4]}***")
            return Response({'error': 'Token invalido o expirado'}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """User login endpoint."""

    @method_decorator(ratelimit(key='ip', rate='10/m', method='POST', block=True))
    def post(self, request):
        cedula = request.data.get('cedula')
        password = request.data.get('password')

        if not cedula or not password:
            return Response({'error': 'Cedula y contrasena son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=cedula, password=password)
        if user:
            try:
                # Check if sympathizer is suspended
                if hasattr(user, 'sympathizer') and user.sympathizer.is_suspended:
                    logger.warning(f"Login attempt by suspended user: {cedula[:4]}***")
                    return Response(
                        {'error': 'Tu cuenta esta suspendida. Contacta al administrador.'},
                        status=status.HTTP_403_FORBIDDEN
                    )

                token, _ = Token.objects.get_or_create(user=user)
                logger.info(f"Successful login for user: {cedula[:4]}***")
                return Response({
                    'token': token.key,
                    'user': {
                        'nombres': user.sympathizer.nombres,
                        'apellidos': user.sympathizer.apellidos,
                        'referral_code': user.sympathizer.referral_code
                    }
                })
            except Exception as e:
                logger.error(f"Error during login for {cedula[:4]}***: {str(e)}")
                return Response(
                    {'error': 'Error de inicio de sesion'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.warning(f"Failed login attempt for cedula: {cedula[:4]}***")
            return Response({'error': 'Credenciales invalidas'}, status=status.HTTP_401_UNAUTHORIZED)


class DashboardView(APIView):
    """User dashboard with referral data."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            sympathizer = request.user.sympathizer

            # Optimized query with prefetch_related for N+1 prevention
            direct_referrals = sympathizer.referrals.prefetch_related(
                Prefetch(
                    'referrals',
                    queryset=Sympathizer.objects.order_by('-created_at'),
                    to_attr='prefetched_sub_referrals'
                )
            ).order_by('-created_at')

            referrals_data = []
            for ref in direct_referrals:
                # Use prefetched data
                sub_referrals = getattr(ref, 'prefetched_sub_referrals', [])
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
                    'referrals_count': len(sub_referrals),
                    'sub_referrals': sub_referrals_data
                })

            return Response({
                'nombres': sympathizer.nombres,
                'apellidos': sympathizer.apellidos,
                'referral_code': sympathizer.referral_code,
                'referrals_count': len(referrals_data),
                'referrals': referrals_data
            })
        except Sympathizer.DoesNotExist:
            logger.error(f"Dashboard accessed by user without sympathizer: {request.user.username}")
            return Response(
                {'error': 'Perfil de simpatizante no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error in DashboardView: {str(e)}")
            return Response({'error': 'Error al cargar el dashboard'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NetworkView(APIView):
    """Network visualization data with optimized tree layout."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            me = request.user.sympathizer

            # Data structures for layout
            nodes_dict = {}
            children_map = {}

            # Helper to create node dict
            def create_node_data(sympathizer, type_node, level):
                return {
                    'id': sympathizer.id,
                    'nombres': sympathizer.nombres,
                    'apellidos': sympathizer.apellidos,
                    'cedula': sympathizer.cedula,
                    'telefono': sympathizer.phone,
                    'email': sympathizer.email,
                    'referrals_count': 0,  # Will be updated later
                    'type': type_node,
                    'level': level,
                    'x': 0,
                    'y': 0
                }

            nodes_dict[me.id] = create_node_data(me, 'me', 0)
            children_map[me.id] = []

            # Add Sponsor if exists
            if me.referrer:
                sponsor = me.referrer
                nodes_dict[sponsor.id] = create_node_data(sponsor, 'sponsor', -1)
                children_map[sponsor.id] = [me.id]

            # Optimized BFS with prefetch
            visited = {me.id}
            queue = [(me, 0)]

            while queue:
                current, level = queue.pop(0)

                # Get children with prefetching
                direct_referrals = current.referrals.only(
                    'id', 'nombres', 'apellidos', 'cedula', 'phone', 'email'
                ).order_by('id')

                current_children_ids = []
                for ref in direct_referrals:
                    if ref.id not in visited:
                        visited.add(ref.id)
                        nodes_dict[ref.id] = create_node_data(ref, 'referral', level + 1)
                        children_map[ref.id] = []
                        current_children_ids.append(ref.id)
                        queue.append((ref, level + 1))

                children_map[current.id] = current_children_ids
                # Update referrals count
                nodes_dict[current.id]['referrals_count'] = len(current_children_ids)

            # Calculate Layout (Reingold-Tilford simplified)
            next_leaf_x = 0
            X_SPACING = 100

            def calculate_layout(node_id):
                nonlocal next_leaf_x

                children = children_map.get(node_id, [])

                if not children:
                    nodes_dict[node_id]['x'] = next_leaf_x
                    next_leaf_x += X_SPACING
                else:
                    child_xs = []
                    for child_id in children:
                        calculate_layout(child_id)
                        child_xs.append(nodes_dict[child_id]['x'])
                    nodes_dict[node_id]['x'] = sum(child_xs) / len(child_xs)

            calculate_layout(me.id)

            # If sponsor exists, place it above 'me'
            if me.referrer and me.referrer.id in nodes_dict:
                nodes_dict[me.referrer.id]['x'] = nodes_dict[me.id]['x']

            # Construct Response
            final_nodes = list(nodes_dict.values())
            final_links = []

            for parent_id, children_ids in children_map.items():
                for child_id in children_ids:
                    final_links.append({'source': parent_id, 'target': child_id})

            return Response({'nodes': final_nodes, 'links': final_links})

        except Sympathizer.DoesNotExist:
            logger.error(f"Network accessed by user without sympathizer: {request.user.username}")
            return Response(
                {'error': 'Perfil de simpatizante no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error in NetworkView: {str(e)}")
            return Response({'error': 'Error al cargar la red'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
