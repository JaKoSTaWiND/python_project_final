import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

def send_otp_email(to_email: str, code: str) -> bool:
    subject = "Registration confirmation code"
    
    text_message = f"Your confirmation code: {code}. The code is valid for 5 minutes."
    
    html_message = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Confirmation email</h2>
        <p style="font-size: 16px; color: #555;">Use the code below to complete the verification.</p>
        <div style="background-color: #f4f4f6; text-align: center; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">{code}</span>
        </div>
        <p style="font-size: 12px; color: #999; text-align: center;">The code expires in 5 minutes. If you didn't request this code, simply ignore the email.</p>
    </div>
    """

    send_mail(
        subject=subject,
        message=text_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[to_email],
        html_message=html_message,
        fail_silently=False,
    )
    logger.info(f"OTP email successfully sent to {to_email}")
    return True