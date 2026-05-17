import uuid
from django.db import models
from django.contrib.auth.hashers import make_password, check_password

class EmployeeType(models.TextChoices):
    SUPERUSER = 'superuser', 'Superuser'
    STAFF = 'employee', 'Employee'

class Employee(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee_type = models.CharField(
        max_length=20, 
        choices=EmployeeType.choices, 
        default=EmployeeType.STAFF
    )
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    phone = models.CharField(max_length=20, blank=True, null=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'employees'

    def __str__(self):
        return f"{self.email} - {self.employee_type}"

    def save(self, *args, **kwargs):
        if self.password and not self.password.startswith(('pbkdf2_sha256$', 'argon2$', 'bcrypt')):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def verify_password(self, raw_password):
        return check_password(raw_password, self.password)