from django.db import models
from django.conf import settings
from products.models import Product 

class Order(models.Model):
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('sent', 'Sent'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders',
        verbose_name="Покупатель"
    )
    
    first_name = models.CharField(max_length=100, verbose_name="Имя")
    last_name = models.CharField(max_length=100, verbose_name="Фамилия")
    city = models.CharField(max_length=100, verbose_name="Город")
    address = models.TextField(verbose_name="Адрес доставки")
    postal_code = models.CharField(max_length=20, verbose_name="Почтовый индекс")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress', verbose_name="Статус")
    
    total_price = models.DecimalField(decimal_places=2, max_digits=12, default=0.00, verbose_name="Итоговая стоимость")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Заказ"
        verbose_name_plural = "Заказы"

    def __str__(self):
        return f"Order #{self.id} - {self.first_name} {self.last_name} ({self.get_status_display()})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', verbose_name="Заказ")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='order_items', verbose_name="Товар")
    size_name = models.CharField(max_length=50, verbose_name="Размер на момент покупки")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Цена при покупке")
    quantity = models.PositiveIntegerField(default=1, verbose_name="Количество")

    class Meta:
        verbose_name = "Предмет заказа"
        verbose_name_plural = "Предметы заказа"

    def __str__(self):
        return f"Item {self.id} in Order #{self.order.id}"

    def get_cost(self):
        return self.price * self.quantity