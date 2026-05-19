"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronLeft, Loader2, PackageX, Calendar, MapPin } from "lucide-react";
import Navbar from "@/components/layout/navbar";
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

export default function ClientOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClientOrders = async () => {
      try {
        const response = await apiFetch("/client/orders/list/");
        
        if (response.status === 401) {
          router.push("/auth");
          return;
        }

        if (!response.ok) {
          throw new Error("FAILED TO LOAD ORDER HISTORY");
        }

        const data = await response.json();
        setOrders(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientOrders();
  }, [router]);

  const getStatusBadge = (status: "in_progress" | "sent") => {
    const styles = {
      in_progress: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
      sent: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    };
    const labels = {
      in_progress: "IN PROGRESS",
      sent: "SHIPPED",
    };
    return (
      <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${styles[status] || ""}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-tight mb-8"
        >
          <ChevronLeft className="w-4 h-4" /> BACK
        </button>

        <div className="flex flex-col space-y-1 border-b pb-4 mb-10">
          <h1 className="text-3xl font-black tracking-tighter uppercase">My Orders</h1>
          <p className="text-xs text-muted-foreground uppercase font-mono">Purchase history and delivery status</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 justify-center">
          
          <div className="hidden lg:block lg:col-span-2" />

          <div className="col-span-1 lg:col-span-8 space-y-4">
            {error ? (
              <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-none font-mono uppercase">
                ERROR: {error}
              </div>
            ) : orders.map((order) => (
              <Collapsible key={order.id} className="border border-input bg-card shadow-sm rounded-none overflow-hidden">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background/50 gap-4">
                  <CollapsibleTrigger className="flex flex-1 items-center justify-between cursor-pointer group text-left focus:outline-none">
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-12">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-mono uppercase">Order</span>
                        <span className="font-mono text-sm font-bold text-foreground">#{order.id}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-mono uppercase">Date</span>
                        <span className="text-sm font-medium flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {new Date(order.created_at).toLocaleDateString("en-US")}
                        </span>
                      </div>
                      <div className="flex flex-col col-span-2 sm:col-span-1">
                        <span className="text-xs text-muted-foreground font-mono uppercase">Amount</span>
                        <span className="font-black text-sm">{Number(order.total_price).toLocaleString("en-US")} KZT</span>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 mr-2" />
                  </CollapsibleTrigger>

                  <div className="flex items-center sm:justify-end">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                <CollapsibleContent className="border-t border-border bg-muted/10 p-4 sm:p-6 space-y-4 text-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className="space-y-2 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-6">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Shipping Address
                      </h3>
                      <div className="space-y-1 text-xs uppercase font-medium pt-1">
                        <p><span className="text-muted-foreground">Recipient:</span> {order.first_name} {order.last_name}</p>
                        <p><span className="text-muted-foreground">City:</span> {order.city}</p>
                        <p><span className="text-muted-foreground">Postal Code:</span> <span className="font-mono">{order.postal_code}</span></p>
                        <p><span className="text-muted-foreground">Address:</span> {order.address}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Items</h3>
                      <div className="divide-y divide-border/40 max-h-48 overflow-y-auto pr-1">
                        {(order.items || []).map((item) => (
                          <div key={item.id} className="flex justify-between items-center py-2 text-xs uppercase font-medium">
                            <span className="text-foreground/90 font-bold">
                              {item.product_name || "Product"} <span className="text-muted-foreground/80 font-normal">[{item.size_name}]</span>
                            </span>
                            <span className="font-mono text-muted-foreground">
                              {item.quantity} pcs × {Number(item.price).toLocaleString("en-US")} KZT
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </CollapsibleContent>

              </Collapsible>
            ))}

            {orders.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center p-12 border border-dashed border-input bg-card text-center space-y-2">
                <PackageX className="w-8 h-8 text-muted-foreground" />
                <div className="uppercase text-xs font-bold tracking-widest text-muted-foreground">
                  You haven't placed any orders yet.
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:block lg:col-span-2" />

        </div>
      </main>
    </div>
  );
}