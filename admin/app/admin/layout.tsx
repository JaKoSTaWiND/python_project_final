"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ShieldAlert, Package } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Employees", href: "/admin/employees", icon: ShieldAlert },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Products", href: "/admin/products", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Боковая панель (Sidebar) — привязана к переменным shadcn */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col fixed h-screen left-0 top-0">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <span className="text-xl font-black tracking-wider text-primary select-none">
            OMS
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Проверяем, активен ли пункт меню
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors group ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Основной контент справа */}
      <div className="flex-1 pl-64">
        <main className="p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}