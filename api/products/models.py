import os
from django.db import models

def product_photo_path(instance, filename):
    return os.path.join('products', filename)


class Size(models.Model):

    name = models.CharField(max_length=20, unique=True)
    
    class Meta:
        verbose_name = "Size"
        verbose_name_plural = "Sizes"
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    id = models.BigAutoField(primary_key=True)
    
    sku = models.CharField(max_length=20, unique=True, editable=False, db_index=True)
    name = models.CharField(max_length=255, db_index=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    sizes = models.ManyToManyField(Size, related_name='products', blank=True)
    
    photo = models.ImageField(upload_to='products/', blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Product"
        verbose_name_plural = "Products"
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.sku}] {self.name}"

    def save(self, *args, **kwargs):
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