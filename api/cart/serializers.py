from rest_framework import serializers
from .models import Cart, CartItem
from products.models import Product, Size

class CartProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'sku', 'name', 'price', 'photo', 'is_active']

class CartSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ['id', 'name']

class CartItemSerializer(serializers.ModelSerializer):
    product = CartProductSerializer(read_only=True)
    size = CartSizeSerializer(read_only=True)
    item_total_price = serializers.SerializerMethodField()

    product_id = serializers.IntegerField(write_only=True)
    size_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'size', 'product_id', 'size_id', 'quantity', 'item_total_price']

    def get_item_total_price(self, obj):
        return obj.quantity * obj.product.price

    def validate(self, data):
        try:
            product = Product.objects.get(id=data['product_id'], is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError({"product_id": "Товар не найден или деактивирован."})

        # Проверяем, привязан ли этот размер к данному товару в ManyToMany
        if not product.sizes.filter(id=data['size_id']).exists():
            raise serializers.ValidationError({"size_id": "Этот размер недоступен для данного товара."})

        return data


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_cart_price = serializers.SerializerMethodField()
    total_items_count = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_cart_price', 'total_items_count']

    def get_total_cart_price(self, obj):
        return sum(item.quantity * item.product.price for item in obj.items.all())

    def get_total_items_count(self, obj):
        return sum(item.quantity for item in obj.items.all())