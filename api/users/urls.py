from django.urls import path
from .views.client.auth_views import EmailCheckView, VerifyOTPView, RegistrationView, LoginView, UserMeView
from .views.client.token_view import ClientTokenRefreshView
from .views.admin.create_user_views import AdminCreateUserView


urlpatterns = [
    path('client/auth/email-check/', EmailCheckView.as_view(), name='email-check'),
    path('client/auth/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('client/auth/registrtation/', RegistrationView.as_view(), name='registration'),
    path('client/auth/login/', LoginView.as_view(), name='login'),
    path('client/users/me/', UserMeView.as_view(), name='user_me'),
    
    path('client/auth/token/refresh/', ClientTokenRefreshView.as_view(), name='token_refresh'),
    
    path('admin/employee/create-user/', AdminCreateUserView.as_view(), name='create-user'),
]
