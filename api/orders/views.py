import stripe
from django.db import transaction
from django.conf import settings
from rest_framework import status
from rest_framework.generics import ListAPIView, CreateAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from .models import Order, OrderItem
from .serializers import OrderCreateSerializer
import os

from cart.models import Cart 

stripe.api_key = os.getenv(
    'STRIPE_SK', 
    'sk_test_51R1nsV2Xk42lcaDr9JjrIZJz9kJF2QXPsS3gAhomE3pbnFv59Mu48qrmK6U5HX8VtfYst8GatGLpzWzvEfRPEv3U00dMXbX79u'
)

class OrderListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderCreateSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items__product')


class OrderCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Передаем контекст запроса, чтобы сериализатор имел доступ к request
        serializer = OrderCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({"detail": "Корзина не найдена."}, status=status.HTTP_400_BAD_REQUEST)

        cart_items = cart.items.all()
        if not cart_items.exists():
            return Response({"detail": "Ваша корзина пуста."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            order = serializer.save(user=request.user, total_price=0.00)
            total_cart_price = 0
            order_items_to_create = []
            
            for item in cart_items:
                item_cost = item.product.price * item.quantity
                total_cart_price += item_cost
                order_items_to_create.append(
                    OrderItem(
                        order=order,
                        product=item.product,
                        size_name=item.size.name,
                        price=item.product.price,
                        quantity=item.quantity
                    )
                )
            
            OrderItem.objects.bulk_create(order_items_to_create)
            order.total_price = total_cart_price
            order.save()

        # Генерируем сессию Stripe Checkout
        try:
            # Внимание: если Stripe-аккаунт тестовый, KZT может не поддерживаться.
            # Для теста используем 'usd'. Если цена в тенге (например 100 000 KZT),
            # конвертни её или пока оставь для проверки шлюза.
            stripe_amount = int(order.total_price * 100)

            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'kzt',
                        'product_data': {
                            'name': f"Заказ #{order.id} - {order.first_name} {order.last_name}",
                        },
                        'unit_amount': stripe_amount,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3001')}/payment-success?order_id={order.id}",
                cancel_url=f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3001')}/orders",
                metadata={
                    "order_id": order.id,
                    "user_id": request.user.id
                }
            )
            
            return Response({"checkout_url": checkout_session.url}, status=status.HTTP_201_CREATED)

        except Exception as e:
            # Если Stripe выкинул ошибку, мы возвращаем её описание, 
            # чтобы фронтенд вывел реальную причину, а не гадал
            return Response(
                {"detail": f"Stripe Error: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
class StripeWebhookView(APIView):
    permission_classes = [AllowAny]  # Запросы шлет сам Stripe, тут нет JWT

    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        endpoint_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        # Обрабатываем успешный платеж
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            metadata = session.get('metadata', {})
            order_id = metadata.get('order_id')
            user_id = metadata.get('user_id')

            if order_id and user_id:
                with transaction.atomic():
                    # 1. Меняем статус заказа на 'sent' (или 'paid', если добавишь такой статус)
                    Order.objects.filter(id=order_id).update(status='sent')
                    
                    # 2. Только теперь со спокойной душой чистим корзину пользователя
                    Cart.objects.filter(user_id=user_id).delete()

        return Response(status=status.HTTP_200_OK)