from rest_framework.permissions import BasePermission
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import Employee, EmployeeType

class IsEmployeeSuperuser(BasePermission):
    def has_permission(self, request, view):
        if not request.user:
            return False
            
        return isinstance(request.user, Employee) and request.user.employee_type == EmployeeType.SUPERUSER