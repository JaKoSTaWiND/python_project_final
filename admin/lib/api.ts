const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Вспомогательная функция для обновления токена
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${getApiUrl()}/token/refresh/`, { // Убедись, что этот URL совпадает с роутом SimpleJWT в Django
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Refresh token expired");
    }

    const data = await response.json();
    // Сохраняем новый access токен (SimpleJWT обычно возвращает его в ключе 'access')
    localStorage.setItem("access_token", data.access);
    return data.access;
  } catch (error) {
    console.error("Критическая ошибка обновления токена:", error);
    // Если refresh-токен тоже протух — чистим хранилище и отправляем на логин
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }
}

export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("accessToken"); // или как ты хранишь токены

  // 1. Создаем базовые заголовки
  const headers = new Headers(options.headers);

  // 2. Добавляем токен авторизации, если он есть
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // 3. УМНАЯ ПРОВЕРКА: Если body — это FormData, мы НЕ СТАВИМ Content-Type.
  // Браузер выставит multipart/form-data и boundary автоматически.
  if (!(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  // Если это не FormData, не забываем сериализовать объект в JSON строку
  let finalBody = options.body;
  if (options.body && !(options.body instanceof FormData) && typeof options.body === "object") {
    finalBody = JSON.stringify(options.body);
  }

  return fetch(`http://localhost:8000/api/v1${url}`, { // твой базовый URL бэкенда
    ...options,
    headers,
    body: finalBody,
  });
}