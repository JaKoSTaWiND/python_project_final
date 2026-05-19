from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny # ИМПОРТИРУЕМ ПОЛНЫЙ ДОСТУП
from django.shortcuts import get_object_or_404

from .models import Product, Size
from .serializers import ProductAdminListSerializer, SizeSerializer


class ProductAdminAPIView(generics.ListCreateAPIView):
    queryset = Product.objects.prefetch_related('sizes').all().order_by('-created_at')
    serializer_class = ProductAdminListSerializer
    parser_classes = [MultiPartParser, FormParser]
    
    permission_classes = [AllowAny]
    authentication_classes = []


class SizeListView(generics.ListAPIView):
    queryset = Size.objects.all().order_by('name')
    serializer_class = SizeSerializer
    
    permission_classes = [AllowAny]
    authentication_classes = []
    
class ClientProductListView(generics.ListAPIView):
    queryset = Product.objects.filter(is_active=True).order_by('-id')
    serializer_class = ProductAdminListSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

class ClientSizeListView(generics.ListAPIView):
    queryset = Size.objects.all().order_by('name')
    serializer_class = SizeSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    
class ClientProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True).prefetch_related('sizes')
    serializer_class = ProductAdminListSerializer
    
    permission_classes = [AllowAny]
    authentication_classes = []


class ProductToggleActiveView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        product.is_active = not product.is_active
        product.save()
        
        return Response(
            {
                "id": product.id,
                "is_active": product.is_active,
                "detail": f"Status changed to: {'active' if product.is_active else 'archived'}."
            }, 
            status=status.HTTP_200_OK
        )