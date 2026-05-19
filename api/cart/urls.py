from django.urls import path
from .views import CartView  # Импортируй созданную вьюху корзины

urlpatterns = [
    path('client/cart/', CartView.as_view(), name='client-cart'),
]