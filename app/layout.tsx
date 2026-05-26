import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { MobileMenu } from "@/components/MobileMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getSession } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shoe Store System",
  description: "Inventory, sales, returns, and reports for a small shoe store.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shoe POS",
  },
  icons: {
    icon: "/app-icon.svg",
    apple: "/app-icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#5b7fb7",
};

const nav = [
  ["Dashboard", "/dashboard"],
  ["Add Stock", "/stock/add"],
  ["Sell Product", "/sell"],
  ["Return Product", "/return"],
  ["Inventory", "/inventory"],
  ["Alerts", "/alerts"],
  ["History", "/history"],
  ["Reports", "/reports"],
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const visibleNav = session?.role === "OWNER" ? [...nav, ["Users", "/users"]] : nav;

  return (
    <html lang="en">
      <body>
        {session ? (
          <div className="shell">
            <aside className="sidebar">
              <MobileMenu links={visibleNav} userName={session.name} userRole={session.role === "OWNER" ? "Owner" : "Staff"} />
              <div className="brand">Shoe Store</div>
              <div className="user-chip">
                <span>{session.name}</span>
                <strong>{session.role === "OWNER" ? "Owner" : "Staff"}</strong>
              </div>
              <nav className="nav">
                {visibleNav.map(([label, href]) => (
                  <Link key={href} href={href}>
                    {label}
                  </Link>
                ))}
              </nav>
            </aside>
            <main className="main">
              <div className="topbar">
                <ThemeToggle />
                <LogoutButton />
              </div>
              {children}
            </main>
          </div>
        ) : (
          <main className="auth-main">
            <ThemeToggle />
            {children}
          </main>
        )}
      </body>
    </html>
  );
}
