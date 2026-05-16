from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import Employee

class EmployeeJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        try:
            user_id = validated_token['user_id']
            return Employee.objects.get(id=user_id)
        except Employee.DoesNotExist:
            return None