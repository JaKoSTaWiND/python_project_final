from django.urls import path
from .views import OrderCreateView, OrderListView, StripeWebhookView, AdminOrderListView, AdminOrderUpdateStatusView

urlpatterns = [
    path('client/orders/create/', OrderCreateView.as_view(), name='client-order-create'),
    path('client/orders/list/', OrderListView.as_view(), name='client-order-list'),
    path('client/orders/webhook/stripe/', StripeWebhookView.as_view(), name='stripe-webhook'),
    
    path('admin/orders/list/', AdminOrderListView.as_view(), name='admin-order-list'),
    path('admin/orders/<int:pk>/update-status/', AdminOrderUpdateStatusView.as_view(), name='admin-order-update-status'),
]