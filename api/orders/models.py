from django.db import models
from django.conf import settings
from products.models import Product 

class Order(models.Model):
    STATUS_CHOICES = [
        ('in_progress', 'IN PROGRESS'),
        ('sent', 'SENT'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders',
        verbose_name="Customer"
    )
    
    first_name = models.CharField(max_length=100, verbose_name="First Name")
    last_name = models.CharField(max_length=100, verbose_name="Last Name")
    city = models.CharField(max_length=100, verbose_name="City")
    address = models.TextField(verbose_name="Shipping Address")
    postal_code = models.CharField(max_length=20, verbose_name="Postal Code")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress', verbose_name="Status")
    
    total_price = models.DecimalField(decimal_places=2, max_digits=12, default=0.00, verbose_name="Total Price")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Order"
        verbose_name_plural = "Orders"

    def __str__(self):
        return f"Order #{self.id} - {self.first_name.upper()} {self.last_name.upper()} ({self.get_status_display()})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', verbose_name="Order")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='order_items', verbose_name="Product")
    size_name = models.CharField(max_length=50, verbose_name="Size At Purchase")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Price At Purchase")
    quantity = models.PositiveIntegerField(default=1, verbose_name="Quantity")

    class Meta:
        verbose_name = "Order Item"
        verbose_name_plural = "Order Items"

    def __str__(self):
        return f"Item {self.id} in Order #{self.order.id}"

    def get_cost(self):
        return self.price * self.quantity