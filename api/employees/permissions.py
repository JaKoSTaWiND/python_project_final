from rest_framework.permissions import BasePermission
from .models import Employee, EmployeeType

class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return isinstance(request.user, Employee)


class IsEmployeeSuperuser(IsEmployee):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
            
        return request.user.employee_type == EmployeeType.SUPERUSER