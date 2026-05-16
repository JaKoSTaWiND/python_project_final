from rest_framework import serializers
from .models import Employee

class EmployeeLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
class EmployeeCreateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, allow_blank=True, required=False, default='')
    last_name = serializers.CharField(max_length=150, allow_blank=True, required=False, default='')
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, allow_blank=True, required=False, default=None, allow_null=True)
    password = serializers.CharField(max_length=255, min_length=8, write_only=True)
    password_confirm = serializers.CharField(max_length=255, min_length=8, write_only=True)

    def validate_email(self, value):
        if Employee.objects.filter(email=value).exists():
            raise serializers.ValidationError({"message": "an employee with this email already exists."})
        return value

    def validate(self, data):
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({"message": "Passwords do not match."})
        return data