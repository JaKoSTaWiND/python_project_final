from django.urls import path
from .views.client.auth_views import EmailCheckView, VerifyOTPView, RegistrationView, LoginView
from .views.admin.create_user_views import AdminCreateUserView


urlpatterns = [
    path('client/auth/email-check/', EmailCheckView.as_view(), name='email-check'),
    path('client/auth/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('client/auth/registrtation/', RegistrationView.as_view(), name='registration'),
    path('client/auth/login/', LoginView.as_view(), name='login'),
    
    path('admin/employee/create-user/', AdminCreateUserView.as_view(), name='create-user'),
]
