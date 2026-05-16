import "./globals.css";

export const metadata = {
  title: "OMS Admin",
  description: "Order Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}