from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from products.models import Product, Size
from .models import Cart, CartItem

User = get_user_model()

class CartViewTests(APITestCase):

    def setUp(self):
        self.client = APIClient()
        
        self.user = User.objects.create_user(
            email="customer@test.com",
            password="test_password_123"
        )
        
        token = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

        self.product = Product.objects.create(
            sku="TST-PROD",
            name="TEST PRODUCT",
            price=150.00,
            is_active=True
        )
        self.size = Size.objects.create(name="XL")
        
        self.product.sizes.add(self.size)

        self.cart_url = reverse("client-cart")

    def test_get_cart_creates_implicitly_and_returns_200(self):
        self.assertFalse(Cart.objects.filter(user=self.user).exists())

        response = self.client.get(self.cart_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Cart.objects.filter(user=self.user).exists())

    def test_post_add_or_update_item_success(self):
        payload = {
            "product_id": self.product.id,
            "size_id": self.size.id,
            "quantity": 2
        }

        response = self.client.post(self.cart_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "CART UPDATED SUCCESSFULLY")
        
        cart = Cart.objects.get(user=self.user)
        cart_item = CartItem.objects.get(cart=cart, product=self.product, size=self.size)
        self.assertEqual(cart_item.quantity, 2)

    def test_delete_item_from_cart_success(self):
        cart = Cart.objects.create(user=self.user)
        cart_item = CartItem.objects.create(
            cart=cart,
            product=self.product,
            size=self.size,
            quantity=1
        )

        payload = {
            "cart_item_id": cart_item.id
        }

        response = self.client.delete(self.cart_url, data=payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "ITEM REMOVED FROM CART")
        self.assertFalse(CartItem.objects.filter(id=cart_item.id).exists())