from celery import shared_task
import logging
from ..services.auth import send_otp_email

logger = logging.getLogger(__name__)

@shared_task(
    bind=True, 
    autoretry_for=(Exception,), 
    retry_kwargs={'max_retries': 3}, 
    retry_backoff=True
)
def send_otp_email_task(self, to_email: str, code: str):
    logger.info(f"Starting Celery task to send OTP to {to_email}")
    try:
        send_otp_email(to_email=to_email, code=code)
    except Exception as exc:
        logger.warning(f"SMTP error. Retrying task for {to_email}")
        raise self.retry(exc=exc)