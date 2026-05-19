import Navbar from "@/components/layout/navbar"; 
import ProductGrid from "@/components/product/product-grid";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      
      <Navbar />

      <main className="flex-1 w-full max-w-[1400px] mx-auto py-8">
        
        <div className="px-4 sm:px-6 lg:px-8 mb-6">
          <h1 className="text-2xl font-bold tracking-tight uppercase">
            All products
          </h1>
        </div>

        <ProductGrid />
        
      </main>

    </div>
  );
}