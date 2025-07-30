"use client"

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  Package, 
  Plus,
  Receipt,
  Filter
} from "lucide-react";
import Link from "next/link";
import { useBills } from "@/hooks/use-bills";
import { useInventory } from "@/hooks/use-inventory";
import { toast } from 'sonner';

interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalExpenses: number;
  expensesChange: number;
  netProfit: number;
  profitChange: number;
  stockItems: number;
  stockChange: number;
  totalClients: number;
}

interface RecentTransaction {
  id: string;
  type: 'invoice' | 'expense';
  description: string;
  amount: number;
  date: string;
  status: string;
}
    
export default function DashboardPage() {
  // Date filter state
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('all');
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Fetch real data from APIs
  const { data: bills = [], isLoading: isLoadingBills, refetch: refetchBills } = useBills();
  const { data: inventory = [], isLoading: isLoadingInventory, refetch: refetchInventory } = useInventory();

  // Date filtering logic
  const getFilteredBills = () => {
    if (dateFilter === 'all') return bills;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return bills.filter(bill => {
      const billDate = new Date(bill.billDate);
      
      switch (dateFilter) {
        case 'today':
          return billDate >= today;
        case 'week':
          return billDate >= startOfWeek;
        case 'month':
          return billDate >= startOfMonth;
        case 'custom':
          if (!customDateRange.from || !customDateRange.to) return true;
          const fromDate = new Date(customDateRange.from);
          const toDate = new Date(customDateRange.to);
          toDate.setHours(23, 59, 59, 999); // End of day
          return billDate >= fromDate && billDate <= toDate;
        default:
          return true;
      }
    });
  };

  // Calculate real-time stats
  const calculateStats = (): DashboardStats => {
    const filteredBills = getFilteredBills();
    
    // Calculate total revenue from paid bills
    const totalRevenue = filteredBills
      .filter(bill => bill.status === 'paid')
      .reduce((sum, bill) => sum + parseFloat(bill.total), 0);

    // Calculate total expenses (cost price of stock sold)
    // We need to calculate this from bill items and their associated inventory cost prices
    let totalExpenses = 0;
    
    // Get all paid bills
    const paidBills = filteredBills.filter(bill => bill.status === 'paid');
    
    // For each paid bill, calculate the cost of items sold
    paidBills.forEach(bill => {
      // Get bill items for this bill
      const billItemsForBill = bill.items || [];
      
      billItemsForBill.forEach((billItem: any) => {
        // Get cost price from the item data
        if (billItem.inventory?.item?.costPrice) {
          const costPrice = parseFloat(billItem.inventory.item.costPrice);
          const quantitySold = parseFloat(billItem.quantity);
          totalExpenses += costPrice * quantitySold;
        }
      });
    });

    // Calculate net profit (revenue - expenses)
    const netProfit = totalRevenue - totalExpenses;

    // Calculate total clients (unique clients from filtered bills)
    const uniqueClients = new Set(filteredBills.map(bill => bill.client.id));
    const totalClients = uniqueClients.size;

    // Calculate stock items (unique items from inventory, not bills)
    const uniqueItems = new Set(inventory.map(inv => inv.item.name));
    const stockItems = uniqueItems.size;

    return {
      totalRevenue,
      revenueChange: 0, // Would need historical data to calculate
      totalExpenses,
      expensesChange: 0,
      netProfit,
      profitChange: 0,
      stockItems,
      stockChange: 0,
      totalClients,
    };
  };

  // Generate recent transactions from bills
  const generateRecentTransactions = (): RecentTransaction[] => {
    const filteredBills = getFilteredBills();
    return filteredBills
      .slice(0, 5) // Show last 5 transactions
      .map(bill => ({
        id: bill.id,
        type: 'invoice' as const,
        description: `Invoice #${bill.invoiceNumber} - ${bill.client.name}`,
        amount: parseFloat(bill.total),
        date: bill.billDate,
        status: bill.status,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const stats = calculateStats();
  const recentTransactions = generateRecentTransactions();

  // Calculate additional stats
  const filteredBills = getFilteredBills();
  const totalBills = filteredBills.length;
  const paidBills = filteredBills.filter(bill => bill.status === 'paid').length;
  const averageBillAmount = totalBills > 0 ? stats.totalRevenue / totalBills : 0;
  const isLoading = isLoadingBills || isLoadingInventory;



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatChange = (change: number) => {
    // Don't show percentage if change is 0 and there's no base data
    if (change === 0) {
      return (
        <p className="text-xs text-muted-foreground mt-1">Cost of items sold</p>
      );
    }
    
    const isPositive = change > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{Math.abs(change)}%</span>
      </div>
    );
  };

  const formatStockChange = (change: number) => {
    // Don't show percentage if change is 0 and there's no base data
    if (change === 0) {
      return (
        <p className="text-xs text-muted-foreground mt-1">Items in inventory</p>
      );
    }
    
    const isPositive = change > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{Math.abs(change)}%</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              InvoiceFlow Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your invoices, expenses, and inventory
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium hidden sm:inline">Filter:</span>
            </div>
            
            <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Till Now</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !customDateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange.from ? (
                        format(customDateRange.from, "LLL dd, y")
                      ) : (
                        <span>From date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customDateRange.from}
                      onSelect={(date) => setCustomDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !customDateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange.to ? (
                        format(customDateRange.to, "LLL dd, y")
                      ) : (
                        <span>To date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customDateRange.to}
                      onSelect={(date) => setCustomDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {dateFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFilter('all');
                  setCustomDateRange({ from: undefined, to: undefined });
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}

            <Link href="/billing/new">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                New Bill
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">From paid bills only</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost of Stock Sold</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
              {formatChange(stats.expensesChange)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{formatCurrency(stats.netProfit)}</div>
              <p className="text-xs text-muted-foreground mt-1">Revenue - Cost of Stock Sold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.stockItems}</div>
              {formatStockChange(stats.stockChange)}
            </CardContent>
          </Card>
        </div>



        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bills</p>
                  <p className="text-xl sm:text-2xl font-bold">{totalBills}</p>
                </div>
                <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid Bills</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{paidBills}</p>
                </div>
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Due Bills</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">{filteredBills.filter(bill => bill.status === 'due').length}</p>
                </div>
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Due Amount</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">
                    ₹{filteredBills
                      .filter(bill => bill.status === 'due')
                      .reduce((sum, bill) => sum + parseFloat(bill.total), 0)
                      .toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
            <CardDescription>
              Your latest transactions and activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No recent activity</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your recent transactions will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.type === 'invoice' 
                          ? 'bg-green-100 dark:bg-green-900' 
                          : 'bg-red-100 dark:bg-red-900'
                      }`}>
                        {transaction.type === 'invoice' ? (
                          <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground dark:text-white text-sm sm:text-base">
                          {transaction.description}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className={`font-bold text-sm sm:text-base ${
                        transaction.type === 'invoice' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'invoice' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                      <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>


    </div>
  );
}