from django.urls import path
from .views import EmployeeLoginView, AdminCreateEmployeeView, EmployeeListView, AdminDismissEmployeeView

urlpatterns = [
    path('admin/auth/login/', EmployeeLoginView.as_view(), name='employee-login'),
    path('admin/employees/create/', AdminCreateEmployeeView.as_view(), name='admin-create-employee'),
    path('admin/employees/list/', EmployeeListView.as_view(), name='employee-list'),
    
    path('admin/employees/<uuid:employee_id>/dismiss/', AdminDismissEmployeeView.as_view(), name='admin-dismiss-employee'),
]