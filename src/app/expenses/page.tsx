"use client";

import { useState, useEffect } from 'react';
import { Plus, DollarSign, Search, Filter, CalendarIcon, FileText, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { expenseSchema, ExpenseForm, ExpenseResponse, PurchaseBillResponse } from '@/lib/schemas';

export default function ExpensesPage() {
  // Date filter state
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('all');
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // State
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [purchaseBills, setPurchaseBills] = useState<PurchaseBillResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: '',
      description: '',
      amount: 0,
      expenseDate: new Date().toISOString().split('T')[0],
      notes: '',
      purchaseBillId: ''
    }
  });

  // Fetch data
  useEffect(() => {
    fetchExpenses();
    fetchPurchaseBills();
  }, []);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/expenses');
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPurchaseBills = async () => {
    try {
      const response = await fetch('/api/purchase-bills');
      if (response.ok) {
        const data = await response.json();
        setPurchaseBills(data.purchaseBills || []);
      }
    } catch (error) {
      console.error('Error fetching purchase bills:', error);
    }
  };

  // Date filtering logic
  const getFilteredExpensesByDate = () => {
    if (dateFilter === 'all') return expenses;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.expenseDate);
      
      switch (dateFilter) {
        case 'today':
          return expenseDate >= today;
        case 'week':
          return expenseDate >= startOfWeek;
        case 'month':
          return expenseDate >= startOfMonth;
        case 'custom':
          if (!customDateRange.from || !customDateRange.to) return true;
          const fromDate = new Date(customDateRange.from);
          const toDate = new Date(customDateRange.to);
          toDate.setHours(23, 59, 59, 999); // End of day
          return expenseDate >= fromDate && expenseDate <= toDate;
        default:
          return true;
      }
    });
  };

  // Filter expenses
  const getFilteredExpenses = () => {
    let filtered = getFilteredExpensesByDate();

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    return filtered;
  };

  // Calculate totals
  const calculateTotalExpenses = () => {
    return getFilteredExpenses().reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  };

  const calculateTotalExpensesByDate = () => {
    return getFilteredExpensesByDate().reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  };

  // Handle form submission
  const onSubmit = async (data: ExpenseForm) => {
    try {
      const response = await fetch('/api/expenses', {
        method: editingExpense ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingExpense ? { ...data, id: editingExpense.id } : data),
      });

      if (response.ok) {
        toast.success(editingExpense ? 'Expense updated successfully!' : 'Expense added successfully!');
        setIsExpenseDialogOpen(false);
        setEditingExpense(null);
        reset();
        fetchExpenses();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save expense');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Failed to save expense');
    }
  };

  // Handle edit
  const handleEdit = (expense: ExpenseResponse) => {
    setEditingExpense(expense);
    setValue('category', expense.category);
    setValue('description', expense.description);
    setValue('amount', parseFloat(expense.amount));
    setValue('expenseDate', expense.expenseDate.split('T')[0]);
    setValue('notes', expense.notes || '');
    setValue('purchaseBillId', expense.purchaseBillId || '');
    setIsExpenseDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Expense deleted successfully!');
        fetchExpenses();
      } else {
        toast.error('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Categories
  const categories = [
    'purchase',
    'shipping',
    'tax',
    'utilities',
    'rent',
    'salary',
    'marketing',
    'maintenance',
    'other'
  ];

  const filteredExpenses = getFilteredExpenses();
  const totalExpenses = calculateTotalExpenses();
  const totalExpensesByDate = calculateTotalExpensesByDate();

  if (isLoading) {
    return <div className="container mx-auto p-4 sm:p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white">
            Expense Management
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground mt-1">
            Track and manage business expenses
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
                  <CalendarComponent
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
                  <CalendarComponent
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

          <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full sm:w-auto"
                onClick={() => {
                  setEditingExpense(null);
                  reset();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={watch('category')} 
                    onValueChange={(value) => setValue('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    {...register('description')}
                    placeholder="Enter expense description"
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="expenseDate">Expense Date</Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    {...register('expenseDate')}
                  />
                  {errors.expenseDate && (
                    <p className="text-sm text-red-500 mt-1">{errors.expenseDate.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="purchaseBillId">Purchase Bill (Optional)</Label>
                  <Select 
                    value={watch('purchaseBillId')} 
                    onValueChange={(value) => setValue('purchaseBillId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select purchase bill (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Purchase Bill</SelectItem>
                      {purchaseBills.map((bill) => (
                        <SelectItem key={bill.id} value={bill.id}>
                          {bill.billNumber} - {bill.supplier?.name || 'No Supplier'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    {...register('notes')}
                    placeholder="Additional notes"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1"
                  >
                    {editingExpense ? 'Update Expense' : 'Add Expense'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsExpenseDialogOpen(false);
                      setEditingExpense(null);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalExpensesByDate.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {dateFilter === 'all' ? 'All time' : `Filtered by ${dateFilter}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered Expenses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredExpenses.length} expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{filteredExpenses.length > 0 ? (totalExpenses / filteredExpenses.length).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per expense
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            {filteredExpenses.length} of {expenses.length} expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground dark:text-white">No expenses found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {expenses.length === 0 ? 'Get started by adding your first expense.' : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Purchase Bill</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <span className="capitalize">{expense.category}</span>
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>₹{parseFloat(expense.amount).toFixed(2)}</TableCell>
                      <TableCell>{formatDate(expense.expenseDate)}</TableCell>
                      <TableCell>
                        {expense.purchaseBillId ? (
                          <span className="text-sm text-muted-foreground">
                            Linked to Bill
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {expense.notes ? (
                          <span className="text-sm">{expense.notes}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(expense)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(expense.id)}
                              className="text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 