from rest_framework import serializers
from .models import Product, Size

class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ['id', 'name']

class ProductAdminListSerializer(serializers.ModelSerializer):
    sizes = serializers.PrimaryKeyRelatedField(
        queryset=Size.objects.all(),
        many=True,
        required=False
    )
    
    class Meta:
        model = Product
        fields = ['id', 'sku', 'name', 'price', 'sizes', 'photo', 'is_active']
        read_only_fields = ['id', 'sku', 'is_active']

    def to_representation(self, instance):

        representation = super().to_representation(instance)
        representation['sizes'] = SizeSerializer(instance.sizes.all(), many=True).data
        return representation