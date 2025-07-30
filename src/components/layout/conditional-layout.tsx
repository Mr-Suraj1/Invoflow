"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  BarChart3,
  Truck,
  Warehouse,
  Receipt,
  Menu,
  X,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import UserBar from "@/components/user-bar";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Don't show sidebar for auth pages, home page, or error pages
  const shouldShowSidebar = !pathname.startsWith('/login') && 
                           !pathname.startsWith('/sign-up') && 
                           !pathname.startsWith('/forgot-account') &&
                           pathname !== '/' &&
                           !pathname.startsWith('/_');

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  const navigationItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/clients", icon: Users, label: "Clients" },
    { href: "/items", icon: Package, label: "Items" },
    { href: "/inventory", icon: Warehouse, label: "Inventory" },
    { href: "/suppliers", icon: Truck, label: "Suppliers" },
    { href: "/billing", icon: Receipt, label: "Billing" },
    { href: "/expenses", icon: DollarSign, label: "Expenses" },
    { href: "/reports", icon: BarChart3, label: "Reports" },
  ];

  const NavLinks = () => (
    <div className="space-y-2">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        
        return (
          <Link 
            key={item.href}
            href={item.href} 
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                : 'text-foreground hover:bg-muted'
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-card"
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-card shadow-sm border-r border-border">
        <div className="p-6 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground dark:text-white">
              InvoiceFlow
            </span>
          </Link>
        </div>
        
        <nav className="px-4 flex-1 overflow-y-auto">
          <NavLinks />
        </nav>

        {/* User Profile Section - Desktop */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <UserBar />
        </div>
      </aside>

      {/* Sidebar Navigation - Mobile */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground dark:text-white">
              InvoiceFlow
            </span>
          </Link>
        </div>
        
        <nav className="px-4 flex-1 overflow-y-auto">
          <NavLinks />
        </nav>

        {/* User Profile Section - Mobile */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <UserBar />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden h-16 flex-shrink-0"></div> {/* Spacer for mobile menu button */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
} 