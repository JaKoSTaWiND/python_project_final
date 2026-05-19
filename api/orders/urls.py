from django.urls import path
from .views import OrderCreateView, OrderListView, StripeWebhookView

urlpatterns = [
    path('client/orders/create/', OrderCreateView.as_view(), name='client-order-create'),
    path('client/orders/list/', OrderListView.as_view(), name='client-order-list'),
    path('client/orders/webhook/stripe/', StripeWebhookView.as_view(), name='stripe-webhook'),
]