"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ShieldAlert, Package } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Employees", href: "/admin/employees", icon: ShieldAlert },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Products", href: "/admin/products", icon: Package },
  ];

  return (
    <aside className="w-64 h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <span className="text-2xl font-black tracking-wider text-primary select-none">
          OMS
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors group ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}