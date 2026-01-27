"""
Email service for sending transactional emails via Resend API.
"""
import logging
from django.conf import settings
from django.template.loader import render_to_string
from decouple import config
import resend

logger = logging.getLogger(__name__)

# Configure Resend API
resend.api_key = config('RESEND_API_KEY', default='')


class EmailService:
    """Centralized email service using Resend API."""

    FROM_EMAIL = "Red de Simpatizantes <redsimpatizantes@towerup.co>"

    @classmethod
    def send_email(cls, to: str, subject: str, html_content: str) -> bool:
        """
        Send an email using Resend API.

        Args:
            to: Recipient email address
            subject: Email subject
            html_content: HTML content of the email

        Returns:
            bool: True if sent successfully, False otherwise
        """
        try:
            resend.Emails.send({
                "from": cls.FROM_EMAIL,
                "to": [to],
                "subject": subject,
                "html": html_content
            })
            logger.info(f"Email sent successfully to {to[:3]}***")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False

    @classmethod
    def send_password_setup(cls, sympathizer, setup_link: str) -> bool:
        """
        Send password setup email to a sympathizer.

        Args:
            sympathizer: Sympathizer model instance
            setup_link: Password setup URL

        Returns:
            bool: True if sent successfully
        """
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6B5B95 0%, #944D6B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Red de Simpatizantes</h1>
            </div>

            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Hola {sympathizer.nombres},</h2>

                <p>Has solicitado configurar tu contraseña para acceder a tu cuenta en la Red de Simpatizantes.</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{setup_link}"
                       style="background-color: #6B5B95; color: white; padding: 15px 30px;
                              text-decoration: none; border-radius: 5px; font-weight: bold;
                              display: inline-block;">
                        Configurar Contraseña
                    </a>
                </div>

                <p style="color: #666; font-size: 14px;">
                    O copia este enlace en tu navegador:<br>
                    <a href="{setup_link}" style="color: #6B5B95; word-break: break-all;">{setup_link}</a>
                </p>

                <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        ⏰ Este enlace expira en 24 horas.<br>
                        Si no solicitaste este correo, puedes ignorarlo de forma segura.
                    </p>
                </div>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                <p>&copy; 2025 Red de Simpatizantes. Todos los derechos reservados.</p>
            </div>
        </body>
        </html>
        """

        return cls.send_email(
            to=sympathizer.email,
            subject="Configura tu contraseña - Red de Simpatizantes",
            html_content=html_content
        )

    @classmethod
    def send_password_reset(cls, sympathizer, reset_link: str) -> bool:
        """
        Send password reset email to a sympathizer.

        Args:
            sympathizer: Sympathizer model instance
            reset_link: Password reset URL

        Returns:
            bool: True if sent successfully
        """
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6B5B95 0%, #944D6B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Red de Simpatizantes</h1>
            </div>

            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Hola {sympathizer.nombres},</h2>

                <p>Recibimos una solicitud para restablecer tu contraseña.</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}"
                       style="background-color: #6B5B95; color: white; padding: 15px 30px;
                              text-decoration: none; border-radius: 5px; font-weight: bold;
                              display: inline-block;">
                        Restablecer Contraseña
                    </a>
                </div>

                <p style="color: #666; font-size: 14px;">
                    O copia este enlace en tu navegador:<br>
                    <a href="{reset_link}" style="color: #6B5B95; word-break: break-all;">{reset_link}</a>
                </p>

                <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        ⏰ Este enlace expira en 24 horas.<br>
                        Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.
                        Tu contraseña actual seguirá funcionando.
                    </p>
                </div>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                <p>&copy; 2025 Red de Simpatizantes. Todos los derechos reservados.</p>
            </div>
        </body>
        </html>
        """

        return cls.send_email(
            to=sympathizer.email,
            subject="Restablece tu contraseña - Red de Simpatizantes",
            html_content=html_content
        )

    @classmethod
    def send_welcome(cls, sympathizer) -> bool:
        """
        Send welcome email to a new sympathizer.

        Args:
            sympathizer: Sympathizer model instance

        Returns:
            bool: True if sent successfully
        """
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6B5B95 0%, #944D6B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">¡Bienvenido/a!</h1>
            </div>

            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Hola {sympathizer.nombres},</h2>

                <p>¡Gracias por unirte a la Red de Simpatizantes!</p>

                <p>Tu registro ha sido completado exitosamente. Ahora puedes:</p>

                <ul style="color: #666;">
                    <li>Acceder a tu panel de control</li>
                    <li>Compartir tu enlace de referido</li>
                    <li>Ver el crecimiento de tu red</li>
                </ul>

                <div style="background: #fff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #6B5B95;">
                    <p style="margin: 0; color: #666;">
                        <strong>Tu código de referido:</strong><br>
                        <span style="font-size: 24px; font-family: monospace; color: #6B5B95;">{sympathizer.referral_code}</span>
                    </p>
                </div>

                <p>Comparte este código con tus conocidos para hacer crecer tu red.</p>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                <p>&copy; 2025 Red de Simpatizantes. Todos los derechos reservados.</p>
            </div>
        </body>
        </html>
        """

        return cls.send_email(
            to=sympathizer.email,
            subject="¡Bienvenido/a a la Red de Simpatizantes!",
            html_content=html_content
        )
