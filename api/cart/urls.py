from django.urls import path
from .views import CartView

urlpatterns = [
    path('client/cart/', CartView.as_view(), name='client-cart'),
]