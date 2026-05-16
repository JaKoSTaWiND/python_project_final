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

// Кастомный fetch-клиент с интерцептором (перехватчиком) ошибок
export async function apiFetch(endpoint: string, options: FetchOptions = {}): Promise<Response> {
  const apiUrl = getApiUrl();
  const url = endpoint.startsWith("http") ? endpoint : `${apiUrl}${endpoint}`;
  
  // Инициализируем заголовки
  options.headers = options.headers || {};
  
  // Подставляем текущий токен доступа
  let token = localStorage.getItem("access_token");
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }
  options.headers["Content-Type"] = options.headers["Content-Type"] || "application/json";

  // Делаем базовый запрос
  let response = await fetch(url, options);

  // Если бэкенд ответил 401 (Токен протух), пытаемся обновиться
  if (response.status === 401) {
    console.warn("Access токен устарел, пытаюсь обновить...");
    
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      // Если обновили успешно — переписываем заголовок авторизации и повторяем запрос еще один раз
      options.headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(url, options);
    }
  }

  return response;
}