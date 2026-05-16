from django.urls import path
from .views import EmployeeLoginView, AdminCreateEmployeeView

urlpatterns = [
    path('admin/auth/login/', EmployeeLoginView.as_view(), name='employee-login'),
    path('admin/employees/create/', AdminCreateEmployeeView.as_view(), name='admin-create-employee'),
]