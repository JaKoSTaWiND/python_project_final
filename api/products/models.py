import os
from django.db import models

def product_photo_path(instance, filename):
    """Генерирует чистый путь для загрузки фото товаров."""
    return os.path.join('products', filename)


class Size(models.Model):
    """
    Справочник конкретных размеров (например: S, M, L, XL, 41, 42).
    """
    name = models.CharField(max_length=20, unique=True, verbose_name="Размер")
    
    class Meta:
        verbose_name = "Размер"
        verbose_name_plural = "Размеры"
        ordering = ['name'] # Базовая сортировка

    def __str__(self):
        return self.name


class Product(models.Model):
    id = models.BigAutoField(primary_key=True)
    
    # Артикул генерируется автоматически (000001)
    sku = models.CharField(max_length=20, unique=True, editable=False, db_index=True, verbose_name="Артикул")
    name = models.CharField(max_length=255, db_index=True, verbose_name="Название")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Цена")
    
    # МАССИВ РАЗМЕРОВ: Связь "Многие-ко-многим". 
    # У одного товара может быть много размеров, один размер может быть у многих товаров.
    sizes = models.ManyToManyField(Size, related_name='products', blank=True, verbose_name="Доступные размеры")
    
    photo = models.ImageField(upload_to='products/', blank=True, null=True, verbose_name="Фотография")
    is_active = models.BooleanField(default=True, db_index=True, verbose_name="Активен")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Товар"
        verbose_name_plural = "Товары"
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.sku}] {self.name}"

    def save(self, *args, **kwargs):
        """Автогенерация последовательных артикулов с ведущими нулями."""
        if not self.sku:
            last_product = Product.objects.all().order_by('id').last()
            if last_product and last_product.sku:
                try:
                    next_number = int(last_product.sku) + 1
                except ValueError:
                    next_number = 1
            else:
                next_number = 1
            
            self.sku = str(next_number).zfill(6)
            
        super().save(*args, **kwargs)