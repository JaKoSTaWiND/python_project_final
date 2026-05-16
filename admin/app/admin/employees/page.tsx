"use client";

import { useEffect, useState } from "react";

interface Employee {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  type: "superuser" | "employee";
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const token = localStorage.getItem("access_token");

        if (!token) {
          throw new Error("Токен отсутствует. Пожалуйста, авторизуйтесь заново.");
        }

        const response = await fetch(`${apiUrl}/admin/employees/list/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error("Недостаточно прав для просмотра этой страницы");
          }
          throw new Error("Не удалось загрузить данные сотрудников");
        }

        const data = await response.json();
        setEmployees(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleDismiss = (id: string, email: string) => {
    console.log(`Dismiss triggered for ID: ${id}, Email: ${email}`);
    alert(`Действие Dismiss для ${email} пока не реализовано на бэкенде`);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground animate-pulse">Загрузка штата сотрудников...</div>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground mt-1">Organizational structure and personnel management</p>
        </div>
      </div>

      {/* Таблица в чистом стиле shadcn без хардкода цветов */}
      <div className="rounded-md border border-border bg-card text-card-foreground overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-muted-foreground font-medium">
              <th className="p-4">Employee Type</th>
              <th className="p-4">First Name</th>
              <th className="p-4">Last Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Phone</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  В таблице employees пока нет записей.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-muted/40 transition-colors">
                  {/* Employee Type (Текст или минималистичный бейдж) */}
                  <td className="p-4 font-medium uppercase tracking-wider text-xs">
                    <span className={emp.type === "superuser" ? "text-destructive" : "text-primary"}>
                      {emp.type}
                    </span>
                  </td>

                  {/* First Name */}
                  <td className="p-4">{emp.first_name || "—"}</td>

                  {/* Last Name */}
                  <td className="p-4">{emp.last_name || "—"}</td>

                  {/* Email */}
                  <td className="p-4 text-muted-foreground">{emp.email}</td>

                  {/* Phone */}
                  <td className="p-4 text-muted-foreground">{emp.phone || "—"}</td>

                  {/* Действие Dismiss */}
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDismiss(emp.id, emp.email)}
                      className="px-3 py-1.5 text-xs font-medium bg-transparent text-destructive border border-destructive rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}