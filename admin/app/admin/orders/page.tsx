"use client";

import React, { useEffect, useState } from "react";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { apiFetch } from "@/lib/api";

interface OrderItem {
  id: number;
  product_name: string;
  size_name: string;
  price: string;
  quantity: number;
}

interface Order {
  id: number;
  first_name: string;
  last_name: string;
  city: string;
  address: string;
  postal_code: string;
  status: "in_progress" | "sent";
  total_price: string;
  created_at: string;
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const fetchOrders = async () => {
    try {
      const response = await apiFetch("/admin/orders/list/");
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Insufficient permissions to view orders");
        }
        throw new Error("Failed to load orders list");
      }
      
      const data = await response.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: number, newStatus: "in_progress" | "sent") => {
    setUpdatingOrderId(orderId);
    try {
      const response = await apiFetch(`/admin/orders/${orderId}/update-status/`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.detail || "Failed to update order status");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success(`Order #${orderId} status changed to ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md font-medium max-w-6xl mx-auto mt-6">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-foreground bg-background min-h-screen font-sans">
      <Toaster richColors position="top-center" />

      <div className="flex flex-col space-y-1 border-b pb-4">
        <h1 className="text-2xl font-black tracking-tight uppercase">Order Management</h1>
        <p className="text-xs text-muted-foreground uppercase font-mono">Total orders in system: {orders.length}</p>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <Collapsible key={order.id} className="border border-input bg-card shadow-sm rounded-none overflow-hidden">
            
            <div className="flex items-center justify-between p-4 bg-background/50 hover:bg-accent/20 transition-colors">
              <CollapsibleTrigger className="flex flex-1 items-center justify-between cursor-pointer group text-left">
                <div className="flex items-center gap-6">
                  <span className="font-mono text-sm font-bold text-foreground/80">#{order.id}</span>
                  <span className="font-black text-sm">{Number(order.total_price).toLocaleString()} KZT</span>
                  <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                    {new Date(order.created_at).toLocaleDateString("en-US")}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 mr-4" />
              </CollapsibleTrigger>

              <div className="flex items-center gap-2">
                <select
                  disabled={updatingOrderId === order.id}
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value as "in_progress" | "sent")}
                  className="h-9 px-3 bg-background border border-input rounded-none text-xs font-bold uppercase tracking-wider text-foreground focus:outline-none focus:border-foreground disabled:opacity-50 cursor-pointer font-sans"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="sent">Sent</option>
                </select>
              </div>
            </div>

            <CollapsibleContent className="border-t border-border bg-muted/20 p-5 space-y-4 text-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-1">Customer Info</h3>
                  <p className="font-medium uppercase"><span className="text-muted-foreground">Name:</span> {order.first_name} {order.last_name}</p>
                  <p className="font-medium uppercase"><span className="text-muted-foreground">City:</span> {order.city}</p>
                  <p className="font-medium uppercase"><span className="text-muted-foreground">Postal Code:</span> <span className="font-mono">{order.postal_code}</span></p>
                  <p className="font-medium uppercase"><span className="text-muted-foreground">Address:</span> {order.address}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-1">Order Items</h3>
                  <div className="divide-y divide-border/60 max-h-40 overflow-y-auto pr-1">
                    {(order.items || []).map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 text-xs uppercase font-medium">
                        <span className="text-foreground/90 font-bold">{item.product_name || "Product removed"} ({item.size_name})</span>
                        <span className="font-mono text-muted-foreground">
                          {item.quantity}x — {Number(item.price).toLocaleString()} KZT
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </CollapsibleContent>

          </Collapsible>
        ))}

        {orders.length === 0 && (
          <div className="text-center p-12 border border-dashed text-muted-foreground uppercase text-xs font-bold tracking-widest">
            No orders found
          </div>
        )}
      </div>
    </div>
  );
}