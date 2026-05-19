from django.urls import path
from .views import ProductAdminAPIView, SizeListView, ProductToggleActiveView, ClientSizeListView, ClientProductListView, ClientProductDetailView

urlpatterns = [
    path('admin/products/list/', ProductAdminAPIView.as_view(), name='product-list-create'),
    
    path('admin/products/create/', ProductAdminAPIView.as_view(), name='product-create'),
    
    path('admin/products/sizes/list/', SizeListView.as_view(), name='sizes-list'),
    
    path('admin/products/<int:pk>/toggle-active/', ProductToggleActiveView.as_view(), name='product-toggle-active'),
    
    
    
    path('client/products/list/', ClientProductListView.as_view(), name='client-product-list'),
    
    path('client/products/sizes/list/', ClientSizeListView.as_view(), name='client-size-list'),
    
    path('client/products/<int:pk>/', ClientProductDetailView.as_view(), name='client-product-detail'),
]