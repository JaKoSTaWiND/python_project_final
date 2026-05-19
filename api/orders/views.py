import os
import stripe
from django.db import transaction
from django.conf import settings
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView

from employees.authentication import EmployeeJWTAuthentication
from .models import Order, OrderItem
from .serializers import OrderCreateSerializer, AdminOrderListSerializer
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
        serializer = OrderCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({"detail": "CART NOT FOUND"}, status=status.HTTP_400_BAD_REQUEST)

        cart_items = cart.items.all()
        if not cart_items.exists():
            return Response({"detail": "YOUR CART IS EMPTY"}, status=status.HTTP_400_BAD_REQUEST)

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

        try:
            stripe_amount = int(order.total_price * 100)

            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'kzt',
                        'product_data': {
                            'name': f"ORDER #{order.id} - {order.first_name.upper()} {order.last_name.upper()}",
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
            return Response(
                {"detail": f"STRIPE ERROR: {str(e).upper()}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        

class StripeWebhookView(APIView):
    permission_classes = [AllowAny]

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

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            metadata = session.get('metadata', {})
            order_id = metadata.get('order_id')
            user_id = metadata.get('user_id')

            if order_id and user_id:
                with transaction.atomic():
                    Order.objects.filter(id=order_id).update(status='sent')
                    Cart.objects.filter(user_id=user_id).delete()

        return Response(status=status.HTTP_200_OK)
    

class AdminOrderListView(APIView):
    authentication_classes = [EmployeeJWTAuthentication]
    permission_classes = []

    def get(self, request):
        orders = Order.objects.all().prefetch_related('items__product').order_by('-created_at')
        serializer = AdminOrderListSerializer(orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminOrderUpdateStatusView(APIView):
    authentication_classes = [EmployeeJWTAuthentication]
    permission_classes = []

    def patch(self, request, pk, *args, **kwargs):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "ORDER NOT FOUND"}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status")
        
        valid_statuses = [choice[0] for choice in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {"detail": f"INVALID STATUS. ALLOWED VALUES: {valid_statuses}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        order.save()
        
        return Response(
            {"id": order.id, "status": order.status, "detail": "STATUS UPDATED SUCCESSFULLY"}, 
            status=status.HTTP_200_OK
        )