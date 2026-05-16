from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated

from ...serializers import CreateUserSerializer
from django.contrib.auth import get_user_model

from employees.authentication import EmployeeJWTAuthentication
from employees.models import Employee

User = get_user_model()

class AdminCreateUserView(APIView):
    authentication_classes = [EmployeeJWTAuthentication]
    
    def post(self, request):
        if not request.user or not isinstance(request.user, Employee):
            return Response(
                {"detail": "Authentication credentials were not provided or you are not an employee."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CreateUserSerializer(data=request.data)
        
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            user = User.objects.create_user(
                email=email,
                password=password
            )
            
            return Response(
                {
                    "message": "User created successfully by admin.",
                    "user": {
                        "id": user.id,
                        "email": user.email
                    }
                }, 
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)