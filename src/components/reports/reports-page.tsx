"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Download,
  FileText
} from "lucide-react";

interface ReportsData {
  salesOverview: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
  categoryBreakdown: Array<{ name: string; value: number; color: string }>;
  clientPerformance: Array<{ client: string; revenue: number; invoices: number }>;
  monthlyTrends: Array<{ month: string; invoices: number; clients: number; avgInvoice: number }>;
}

export default function ReportsPage() {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("last12months");

  const fetchReportsData = async () => {
    try {
      const response = await fetch(`/api/reports?range=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setReportsData(data);
      }
    } catch (error) {
      console.error('Failed to fetch reports data:', error);
      // Set sample data for demo
      setReportsData({
        salesOverview: [
          { month: 'Jan', revenue: 4500, expenses: 2100, profit: 2400 },
          { month: 'Feb', revenue: 5200, expenses: 2300, profit: 2900 },
          { month: 'Mar', revenue: 4800, expenses: 2200, profit: 2600 },
          { month: 'Apr', revenue: 6100, expenses: 2800, profit: 3300 },
          { month: 'May', revenue: 5500, expenses: 2500, profit: 3000 },
          { month: 'Jun', revenue: 6800, expenses: 3100, profit: 3700 },
          { month: 'Jul', revenue: 7200, expenses: 3300, profit: 3900 },
          { month: 'Aug', revenue: 6900, expenses: 3200, profit: 3700 },
          { month: 'Sep', revenue: 7500, expenses: 3400, profit: 4100 },
          { month: 'Oct', revenue: 8100, expenses: 3600, profit: 4500 },
          { month: 'Nov', revenue: 7800, expenses: 3500, profit: 4300 },
          { month: 'Dec', revenue: 8500, expenses: 3800, profit: 4700 }
        ],
        categoryBreakdown: [
          { name: 'Web Development', value: 45, color: '#3B82F6' },
          { name: 'Design Services', value: 25, color: '#10B981' },
          { name: 'Consulting', value: 20, color: '#F59E0B' },
          { name: 'Maintenance', value: 10, color: '#EF4444' }
        ],
        clientPerformance: [
          { client: 'Acme Corp', revenue: 15000, invoices: 8 },
          { client: 'Tech Solutions', revenue: 12500, invoices: 6 },
          { client: 'Creative Studio', revenue: 9800, invoices: 5 },
          { client: 'Digital Agency', revenue: 8200, invoices: 4 },
          { client: 'StartupXYZ', revenue: 6500, invoices: 3 }
        ],
        monthlyTrends: [
          { month: 'Jan', invoices: 12, clients: 8, avgInvoice: 375 },
          { month: 'Feb', invoices: 15, clients: 10, avgInvoice: 347 },
          { month: 'Mar', invoices: 14, clients: 9, avgInvoice: 343 },
          { month: 'Apr', invoices: 18, clients: 12, avgInvoice: 339 },
          { month: 'May', invoices: 16, clients: 11, avgInvoice: 344 },
          { month: 'Jun', invoices: 20, clients: 14, avgInvoice: 340 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [dateRange, fetchReportsData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value);
  };

  const exportReport = (format: 'pdf' | 'csv') => {
    // In a real app, this would generate and download the report
    toast.info(`Exporting report as ${format.toUpperCase()}...`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading reports...</div>
        </div>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">
            No data available
          </h3>
          <p className="text-muted-foreground">
            Create some invoices and clients to see reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground mt-1">
            Analyze your business performance and trends
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last30days">Last 30 days</SelectItem>
              <SelectItem value="last6months">Last 6 months</SelectItem>
              <SelectItem value="last12months">Last 12 months</SelectItem>
              <SelectItem value="thisyear">This year</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportReport('pdf')} className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={() => exportReport('csv')} className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground dark:text-white">
                  {formatCurrency(reportsData.salesOverview.reduce((sum, item) => sum + item.revenue, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-foreground dark:text-white">
                  {formatCurrency(reportsData.salesOverview.reduce((sum, item) => sum + item.expenses, 0))}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold text-foreground dark:text-white">
                  {formatCurrency(reportsData.salesOverview.reduce((sum, item) => sum + item.profit, 0))}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Avg Invoice</p>
                <p className="text-2xl font-bold text-foreground dark:text-white">
                  {formatCurrency(reportsData.monthlyTrends[reportsData.monthlyTrends.length - 1]?.avgInvoice || 0)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Sales Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Sales Overview */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses vs Profit</CardTitle>
              <CardDescription>
                Monthly comparison of revenue, expenses, and profit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportsData.salesOverview}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                  <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                  <Bar dataKey="profit" fill="#10B981" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Service Category</CardTitle>
                <CardDescription>
                  Breakdown of revenue by service type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportsData.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {reportsData.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>
                  Revenue percentage by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportsData.categoryBreakdown.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{category.value}%</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency((category.value / 100) * 50000)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clients */}
        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Clients by Revenue</CardTitle>
              <CardDescription>
                Your highest value clients and their contribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportsData.clientPerformance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="client" type="category" width={100} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice & Client Trends</CardTitle>
                <CardDescription>
                  Monthly trends in invoices and client acquisition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportsData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="invoices" stroke="#3B82F6" name="Invoices" />
                    <Line type="monotone" dataKey="clients" stroke="#10B981" name="New Clients" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Invoice Value</CardTitle>
                <CardDescription>
                  Trend of average invoice value over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={reportsData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area 
                      type="monotone" 
                      dataKey="avgInvoice" 
                      stroke="#F59E0B" 
                      fill="#FEF3C7" 
                      name="Avg Invoice"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 