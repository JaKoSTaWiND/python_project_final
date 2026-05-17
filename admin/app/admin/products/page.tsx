"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X, Image as ImageIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

interface Size {
  id: number;
  name: string;
}

interface Product {
  id: number;
  sku: string;
  name: string;
  price: string;
  sizes: Size[];
  photo: string | null;
  is_active: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [availableSizes, setAvailableSizes] = useState<Size[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Стейты для модального окна добавления товара
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  
  // Данные формы
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Стейты для изменения статуса активности (архивации товара)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [productToToggle, setProductToToggle] = useState<Product | null>(null);

  const fetchData = async () => {
    try {
      // Параллельно запрашиваем список товаров и справочник размеров
      const [productsRes, sizesRes] = await Promise.all([
        apiFetch("/admin/products/list/"),
        apiFetch("/admin/products/sizes/list/").catch(() => null), // Не падать, если справочник пуст
      ]);

      if (!productsRes.ok) {
        if (productsRes.status === 401 || productsRes.status === 403) {
          throw new Error("Недостаточно прав для просмотра этой страницы");
        }
        throw new Error("Не удалось загрузить данные товаров");
      }

      const productsData = await productsRes.json();
      setProducts(productsData);

      if (sizesRes && sizesRes.ok) {
        const sizesData = await sizesRes.json();
        setAvailableSizes(sizesData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSizeCheckboxChange = (sizeId: number) => {
    setSelectedSizes((prev) =>
      prev.includes(sizeId) ? prev.filter((id) => id !== sizeId) : [...prev, sizeId]
    );
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      // Исполняем отправку через FormData, так как передаем бинарный файл (photo)
      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price);
      
      // Передаем массив ID размеров
      selectedSizes.forEach((id) => {
        formData.append("sizes", id.toString());
      });

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      // Отправляем на бэкенд. Внутри apiFetch у тебя должна быть обработка multipart данных
      const response = await apiFetch("/admin/products/create/", {
        method: "POST",
        // ВАЖНО: При передачи FormData заголовок Content-Type браузер должен выставить сам вместе с boundary
        body: formData, 
      });

      const result = await response.json();

      if (!response.ok) {
        if (typeof result === "object") {
          const firstKey = Object.keys(result)[0];
          const errorMsg = Array.isArray(result[firstKey]) ? result[firstKey][0] : JSON.stringify(result[firstKey]);
          throw new Error(`${firstKey}: ${errorMsg}`);
        }
        throw new Error("Не удалось создать товар");
      }

      await fetchData();
      setIsDialogOpen(false);
      
      // Сброс полей
      setName("");
      setPrice("");
      setSelectedSizes([]);
      setPhotoFile(null);

      toast.success("Товар успешно добавлен в каталог");
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerToggleActiveConfirm = (product: Product) => {
    setProductToToggle(product);
    setIsConfirmOpen(true);
  };

  const handleExecuteToggleActive = async () => {
    if (!productToToggle) return;
    const targetId = productToToggle.id;
    const nextStatus = !productToToggle.is_active;

    try {
      const response = await apiFetch(`/admin/products/${targetId}/toggle-active/`, {
        method: "POST",
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.detail || "Не удалось изменить статус товара");
      }

      // Оптимистично меняем статус в стейте таблицы
      setProducts((prev) =>
        prev.map((p) => (p.id === targetId ? { ...p, is_active: nextStatus } : p))
      );
      
      toast.success(nextStatus ? "Товар активирован" : "Товар переведен в архив");
    } catch (err: any) {
      console.error(err);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setIsConfirmOpen(false);
      setProductToToggle(null);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground animate-pulse">Загрузка каталога товаров...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md font-medium">
        Ошибка: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster richColors position="top-center" />

      {/* Хедер каталога */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Catalog management, inventory sizes, and pricing</p>
        </div>

        {/* Модальное окно добавления товара */}
        <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Dialog.Trigger asChild>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity cursor-pointer shadow-sm">
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </Dialog.Trigger>
          
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 bg-card text-card-foreground rounded-lg border border-border shadow-lg z-50 focus:outline-none">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-semibold tracking-tight">Add New Product</Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-muted-foreground hover:text-foreground rounded-sm p-1 cursor-pointer transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>
              
              <Dialog.Description className="text-sm text-muted-foreground mb-4">
                Enter details for the new product placement. SKU will be auto-generated.
              </Dialog.Description>

              {formError && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none"
                    placeholder="Nike Air Max 90"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Price (KZT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none"
                    placeholder="45000.00"
                  />
                </div>

                {/* Выбор массива размеров */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Available Sizes</label>
                  {availableSizes.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Справочник размеров пуст. Добавьте размеры через Django Admin.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {availableSizes.map((size) => {
                        const isChecked = selectedSizes.includes(size.id);
                        return (
                          <label
                            key={size.id}
                            className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium border rounded-md cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background border-input text-foreground hover:bg-muted"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleSizeCheckboxChange(size.id)}
                              className="sr-only" // Скрываем дефолтный чекбокс, стилизуем саму плашку
                            />
                            {size.name}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Кастомное поле выбора изображения */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Product Image</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-3 py-2 text-xs font-medium border border-input bg-background rounded-md hover:bg-muted cursor-pointer transition-colors">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      Choose File
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    <span className="text-xs text-muted-foreground truncate max-w-[240px]">
                      {photoFile ? photoFile.name : "No file chosen"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium border border-input bg-background rounded-md hover:bg-muted cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? "Saving..." : "Save Product"}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Таблица товаров */}
      <div className="rounded-md border border-border bg-card text-card-foreground overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-muted-foreground font-medium">
              <th className="p-4 w-[100px]">SKU</th>
              <th className="p-4">Photo</th>
              <th className="p-4">Name</th>
              <th className="p-4">Price</th>
              <th className="p-4">Sizes</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  В каталоге товаров пока нет записей.
                </td>
              </tr>
            ) : (
              products.map((prod) => (
                <tr key={prod.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-4 font-mono text-xs tracking-wider">{prod.sku}</td>
                  <td className="p-4">
                    {prod.photo ? (
                      <img
                        src={prod.photo}
                        alt={prod.name}
                        className="w-10 h-10 object-cover rounded-md border border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded-md border border-border flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium">{prod.name}</td>
                  <td className="p-4 font-medium">{prod.price} KZT</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {prod.sizes.length === 0 ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        prod.sizes.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground border border-border"
                          >
                            {s.name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-xs font-semibold">
                    {prod.is_active ? (
                      <span className="text-primary">Active</span>
                    ) : (
                      <span className="text-muted-foreground">Archived</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => triggerToggleActiveConfirm(prod)}
                      className={`px-3 py-1.5 text-xs font-medium bg-transparent border rounded-md transition-colors cursor-pointer ${
                        prod.is_active
                          ? "text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                          : "text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {prod.is_active ? "Archive" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* === SHADCN ALERT DIALOG COMPONENT ДЛЯ АРХИВАЦИИ === */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изменение статуса товара</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите {productToToggle?.is_active ? "перевести в архив" : "активировать"} товар{" "}
              <strong>{productToToggle?.name}</strong> (SKU: {productToToggle?.sku})? 
              {productToToggle?.is_active && " Скрытые товары перестанут отображаться на витрине для покупателей."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteToggleActive}
              className={productToToggle?.is_active ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:opacity-90"}
            >
              {productToToggle?.is_active ? "Архивировать" : "Активировать"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}