from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.permissions import AllowAny

class ClientTokenRefreshView(TokenRefreshView):

    permission_classes = [AllowAny]
    authentication_classes = []