from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer

class CartView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartItemSerializer(data=request.data)
        
        if serializer.is_valid():
            product_id = serializer.validated_data['product_id']
            size_id = serializer.validated_data['size_id']
            quantity = serializer.validated_data.get('quantity', 1)

            if quantity <= 0:
                CartItem.objects.filter(cart=cart, product_id=product_id, size_id=size_id).delete()
                return Response({"message": "Товар удален из корзины"}, status=status.HTTP_200_OK)

            cart_item, created = CartItem.objects.update_or_create(
                cart=cart,
                product_id=product_id,
                size_id=size_id,
                defaults={'quantity': quantity}
            )
            
            return Response({"message": "Корзина успешно обновлена"}, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        cart = getattr(request.user, 'cart', None)
        if not cart:
            return Response({"error": "Корзина не найдена"}, status=status.HTTP_404_NOT_FOUND)
            
        item_id = request.data.get('cart_item_id')
        if not item_id:
            return Response({"error": "Не передан cart_item_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            item = CartItem.objects.get(id=item_id, cart=cart)
            item.delete()
            return Response({"message": "Позиция удалена из корзины"}, status=status.HTTP_200_OK)
        except CartItem.DoesNotExist:
            return Response({"error": "Элемент не найден в корзине"}, status=status.HTTP_404_NOT_FOUND)