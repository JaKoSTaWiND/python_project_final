from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class EmailCheckSerializer(serializers.Serializer):
    email = serializers.EmailField()

class VerifyOPTSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6, min_length=6)

class RegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(max_length=255, min_length=8, write_only=True)
    password_confirm = serializers.CharField(max_length=255, min_length=8, write_only=True)
    
    def validate(self, data):
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({"message": "passwords are not equal"})
        return data
    
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    
class CreateUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(max_length=255, min_length=8, write_only=True)
    password_confirm = serializers.CharField(max_length=255, min_length=8, write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError({"message": "a user with this email already exists"})
        return value

    def validate(self, data):
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({"message": "passwords are not equal"})
        return data