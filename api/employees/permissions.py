from rest_framework.permissions import BasePermission
from .models import Employee, EmployeeType

class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        if request.user.is_superuser:
            return True
            
        return isinstance(request.user, Employee)


class IsEmployeeSuperuser(IsEmployee):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
            
        return request.user.employee_type == EmployeeType.SUPERUSER