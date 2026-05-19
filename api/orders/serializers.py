from rest_framework import serializers
from .models import Order, OrderItem
from products.models import Product

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'sku', 'size_name', 'price', 'quantity', 'get_cost']
        read_only_fields = ['price']


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 
            'first_name', 
            'last_name', 
            'city', 
            'address', 
            'postal_code', 
            'status', 
            'total_price', 
            'items', 
            'created_at'
        ]
        read_only_fields = ['status', 'total_price', 'created_at']

    def validate_postal_code(self, value):
        clean_value = value.strip()
        if len(clean_value) < 4:
            raise serializers.ValidationError("Укажите корректный почтовый индекс.")
        return clean_value