const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Вспомогательная функция для обновления токена
async function refreshAccessToken(): Promise<string | null> {
  // 1. Читаем camelCase ключ, который реально создает AuthPage
  const refreshToken = localStorage.getItem("refreshToken"); 
  if (!refreshToken) return null;

  try {
    const baseUrl = getApiUrl();
    
    // 2. ИСПРАВЛЕНО: URL ведет строго на 'client/auth/token/refresh/' в соответствии с urls.py
    const response = await fetch(`${baseUrl}/client/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Refresh token expired or invalid");
    }

    const data = await response.json();
    
    // 3. ИСПРАВЛЕНО: Сохраняем в camelCase ('accessToken'), чтобы Navbar и apiFetch его увидели
    localStorage.setItem("accessToken", data.access);
    return data.access;
  } catch (error) {
    console.error("Критическая ошибка обновления токена:", error);
    
    // Если рефреш сломался — сессия полностью мертва, чистим всё
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    
    if (typeof window !== "undefined") {
      window.location.href = "/auth"; // Отправляем на авторизацию
    }
    return null;
  }
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Читаем camelCase токен
  let token = localStorage.getItem("accessToken"); 

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Обработка FormData и JSON-тела (KISS/YAGNI)
  if (!(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  let finalBody = options.body;
  if (options.body && !(options.body instanceof FormData) && typeof options.body === "object") {
    finalBody = JSON.stringify(options.body);
  }

  const baseUrl = getApiUrl();
  
  // Первый запрос к API
  let response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
    body: finalBody,
  });

  // ИНТЕРЦЕПТОР: Если получили 401, пробуем спасти сессию
  if (response.status === 401) {
    console.warn(`Access-токен протух при запросе к ${url}. Пытаемся обновиться...`);
    
    // Запускаем обновление токена
    const newAccessToken = await refreshAccessToken();
    
    if (newAccessToken) {
      // Если обновили успешно — пересоздаем заголовки с НОВЫМ токеном
      const retryHeaders = new Headers(options.headers);
      retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);
      
      if (!(options.body instanceof FormData)) {
        if (!retryHeaders.has("Content-Type")) {
          retryHeaders.set("Content-Type", "application/json");
        }
      }

      // Повторяем изначальный запрос с новыми данными
      response = await fetch(`${baseUrl}${url}`, {
        ...options,
        headers: retryHeaders,
        body: finalBody,
      });
    }
  }

  return response;
}