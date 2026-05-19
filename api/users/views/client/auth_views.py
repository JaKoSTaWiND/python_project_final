from django.shortcuts import render
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.serializers import EmailCheckSerializer, VerifyOPTSerializer, RegistrationSerializer, LoginSerializer

from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from users.services.auth import send_otp_email


import random

from django.conf import settings

User = get_user_model()

def get_token_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class EmailCheckView(APIView):
    def post(self, request):
        serializer = EmailCheckSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']

            is_user_exists = User.objects.filter(email=email).exists()

            if is_user_exists:
                return Response({"account_status": "exists"})
            
            else:
                otp_code = str(random.randint(100000, 999999))

                cache.set(f"otp_{email}", otp_code, timeout=300)
                
                try:
                    send_otp_email(to_email=email, code=otp_code)
                except Exception as e:
                    return Response(
                        {"error": "Failed to send email. Check server configuration."}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                return Response({"account_status": "new",
                                 "otp_status": "sended"}, 
                                 status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class VerifyOTPView(APIView):
    def post(self, request):
        serializer = VerifyOPTSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp_code = serializer.validated_data['otp_code']

            cached_code = cache.get(f"otp_{email}")

            if cached_code and cached_code == otp_code:
                cache.set(f"verified_{email}", True, timeout=600)
                cache.delete(f"otp_{email}")
                return Response({"otp_status": "success"}, status=status.HTTP_200_OK)
            
            return Response({"opt_status": "invalid code"}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class RegistrationView(APIView):
    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']

            is_verified = cache.get(f"verified_{email}")

            if not is_verified:
                return Response({"error": "confirm your email"}, status=403)
            
            user = User.objects.create_user(
                email=email,
                password=password
            )

            cache.delete(f"verified_{email}")

            tokens = get_token_for_user(user)

            return Response({
                "message": "user was created",
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                },
                "tokens": tokens
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            user = authenticate(request, username=email, password=password)
            
            if user:
                tokens = get_token_for_user(user)
                return Response({
                    "tokens": tokens,
                    "user": {"email": user.email}
                }, status=status.HTTP_200_OK)
            
            return Response({"error": "invalid password"}, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserMeView(APIView):
    permission_classes = [IsAuthenticated]
    # Явно указываем поддерживаемые типы аутентификации
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        user = request.user
        
        # Защитная проверка на случай, если аутентификация дала сбой, но пермишены пропустили (edge case)
        if user.is_anonymous:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
            
        return Response({
            "id": user.id,
            "email": user.email,
            # Если username нет в модели, берем часть email до собаки или пустую строку, чтобы фронтенд не упал
            "username": getattr(user, 'username', user.email.split('@')[0])
        }, status=status.HTTP_200_OK)