from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import Employee, EmployeeType
from .serializers import EmployeeLoginSerializer, EmployeeCreateSerializer
from .authentication import EmployeeJWTAuthentication
from .permissions import IsEmployeeSuperuser

class EmployeeLoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = EmployeeLoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']

            try:
                employee = Employee.objects.get(email=email)
            except Employee.DoesNotExist:
                return Response(
                    {"detail": "Invalid email or password."}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not employee.verify_password(password):
                return Response(
                    {"detail": "Invalid email or password."}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )

            refresh = RefreshToken()
            refresh['user_id'] = str(employee.id)
            refresh['employee_type'] = employee.employee_type

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'employee': {
                    'id': employee.id,
                    'email': employee.email,
                    'type': employee.employee_type
                }
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class AdminCreateEmployeeView(APIView):
    authentication_classes = [EmployeeJWTAuthentication]
    permission_classes = [IsEmployeeSuperuser]

    def post(self, request):
        serializer = EmployeeCreateSerializer(data=request.data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            
            employee = Employee(
                email=validated_data['email'],
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
                phone=validated_data.get('phone', None),
                password=validated_data['password'],
                employee_type=EmployeeType.STAFF
            )
            employee.save()

            return Response(
                {
                    "message": "Employee created successfully.",
                    "employee": {
                        "id": employee.id,
                        "email": employee.email,
                        "first_name": employee.first_name,
                        "last_name": employee.last_name,
                        "phone": employee.phone,
                        "type": employee.employee_type
                    }
                }, 
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class EmployeeListView(APIView):
    authentication_classes = [EmployeeJWTAuthentication]
    permission_classes = [] 

    def get(self, request):
        employees = Employee.objects.all().order_by('-date_joined')
        
        data = [
            {
                "id": str(emp.id),
                "email": emp.email,
                "first_name": emp.first_name,
                "last_name": emp.last_name,
                "phone": emp.phone if emp.phone else "—",
                "type": emp.employee_type,
            }
            for emp in employees
        ]
        return Response(data, status=status.HTTP_200_OK)
    
class EmployeeTokenRefreshView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        refresh_token_string = request.data.get("refresh")
        
        if not refresh_token_string:
            return Response(
                {"detail": "Refresh токен не передан."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            refresh = RefreshToken(refresh_token_string)
            
            data = {
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }
            return Response(data, status=status.HTTP_200_OK)
            
        except TokenError as e:
            return Response(
                {"detail": "invalid refresh token."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )