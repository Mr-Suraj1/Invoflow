'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Receipt,
  Package,
  DollarSign,
  TrendingUp,
  MoreHorizontal,
  Filter,
  CalendarIcon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  const router = useRouter();
  const [bills, setBills] = useState<any[]>([]);
  const [availableInventory, setAvailableInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Date filter state
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('all');
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch bills with items
        const billsResponse = await fetch('/api/bills');
        if (billsResponse.ok) {
          const billsData = await billsResponse.json();
          setBills(billsData);
        }



        // Fetch inventory
        const inventoryResponse = await fetch('/api/inventory');
        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json();
          setAvailableInventory(inventoryData.filter((inv: any) => parseFloat(inv.availableQuantity) > 0));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case 'due':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Due</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/bills/${billId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setBills(bills.filter(bill => bill.id !== billId));
          toast.success('Bill deleted successfully');
        } else {
          toast.error('Failed to delete bill');
        }
      } catch (error) {
        console.error('Error deleting bill:', error);
        toast.error('Failed to delete bill');
      }
    }
  };

  const handleDownloadInvoice = async (bill: any) => {
    setDownloadingInvoice(bill.id);
    try {
      const response = await fetch(`/api/bills/${bill.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${bill.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Invoice downloaded successfully');
      } else {
        toast.error('Failed to download invoice');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const handleStatusUpdate = async (billId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bills/${billId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setBills(bills.map(bill => 
          bill.id === billId ? { ...bill, status: newStatus } : bill
        ));
        toast.success('Status updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleEditBill = (bill: any) => {
    // Store the bill data in sessionStorage for the edit form
    sessionStorage.setItem('editingBill', JSON.stringify(bill));
    router.push('/billing/new?edit=true');
  };

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

  const handleViewBill = (bill: any) => {
    setSelectedBill(bill);
    setIsDetailsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Billing
          </h1>
          <p className="text-muted-foreground mt-1">
            Create bills from inventory and generate invoices
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

              <Button 
            className="w-full sm:w-auto"
            onClick={() => router.push('/billing/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
            Create New Bill
              </Button>
        </div>
                </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getFilteredBills().length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableInventory.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{getFilteredBills().reduce((sum, bill) => sum + parseFloat(bill.total || 0), 0).toFixed(2)}
                      </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Bills</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getFilteredBills().filter(bill => bill.status === 'paid').length}
                      </div>
          </CardContent>
        </Card>
                    </div>
                    
      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
                        <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredBills().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {bills.length === 0 ? 'No bills found. Create your first bill to get started.' : 'No bills found for the selected date range.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  getFilteredBills().map((bill) => (
                    <TableRow 
                      key={bill.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewBill(bill)}
                    >
                      <TableCell className="font-medium">{bill.invoiceNumber}</TableCell>
                      <TableCell>{bill.client?.name || 'Unknown Client'}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {Array.isArray(bill.items) && bill.items.length > 0 ? (
                            bill.items.slice(0, 2).map((item: any, index: number) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium">
                                  {item.inventory?.item?.name || 'Unknown Item'}
                                </span>
                    </div>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">No items</span>
                          )}
                          {Array.isArray(bill.items) && bill.items.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{bill.items.length - 2} more items
                  </div>
                          )}
                </div>
                      </TableCell>
                      <TableCell>
                        {Array.isArray(bill.items) && bill.items.length > 0 ? (
                          <div className="text-sm">
                            {bill.items.reduce((total: number, item: any) => total + parseFloat(item.quantity), 0).toFixed(2)}
              </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">0</span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(bill.billDate).toLocaleDateString()}</TableCell>
                      <TableCell>₹{parseFloat(bill.total || 0).toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(bill.status)}</TableCell>
                      <TableCell>
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditBill(bill)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadInvoice(bill)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusUpdate(bill.id, bill.status === 'paid' ? 'due' : 'paid')}
                              >
                                {bill.status === 'paid' ? (
                                  <>
                                    <span className="mr-2">📋</span>
                                    Mark as Due
                                  </>
                                ) : (
                                  <>
                                    <span className="mr-2">✅</span>
                                    Mark as Paid
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteBill(bill.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
              </div>
                 </CardContent>
       </Card>

       {/* Bill Details Dialog */}
       <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
         <DialogContent className="w-[95vw] max-w-6xl overflow-visible">
           {selectedBill && (
              <>
                <DialogHeader>
                  <div className="flex justify-between items-center">
                    <DialogTitle className="text-2xl font-semibold">
                     Invoice #{selectedBill.invoiceNumber}
                    </DialogTitle>
                   <div className="flex items-center gap-2">
                     <span className="text-sm text-muted-foreground">Status:</span>
                     {getStatusBadge(selectedBill.status)}
                    </div>
                  </div>
                 <DialogDescription className="flex justify-between items-center">
                   <span>Created on {new Date(selectedBill.createdAt).toLocaleDateString()}</span>
                   <span className="text-sm text-muted-foreground">
                     Last updated: {new Date(selectedBill.updatedAt).toLocaleDateString()}
                    </span>
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* Client Info */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-4">
                    <div>
                     <h3 className="text-sm font-medium text-muted-foreground mb-2">Bill To:</h3>
                      <div className="space-y-1">
                       <p className="font-medium text-base">{selectedBill.client?.name || 'Unknown Client'}</p>
                       {selectedBill.client?.email && <p className="text-sm">{selectedBill.client.email}</p>}
                       {selectedBill.client?.phone && <p className="text-sm">{selectedBill.client.phone}</p>}
                       {selectedBill.client?.address && <p className="text-sm">{selectedBill.client.address}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="space-y-2">
                        <div className="flex justify-end gap-3">
                         <span className="text-muted-foreground text-sm">Invoice Date:</span>
                         <span className="font-medium">{new Date(selectedBill.billDate).toLocaleDateString()}</span>
                        </div>
                       {selectedBill.dueDate && (
                          <div className="flex justify-end gap-3">
                           <span className="text-muted-foreground text-sm">Due Date:</span>
                           <span className="font-medium">{new Date(selectedBill.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex justify-end gap-3 pt-2">
                         <span className="text-muted-foreground text-sm">Total:</span>
                         <span className="font-bold text-lg">${parseFloat(selectedBill.total || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Items Table */}
                  <div>
                   <h3 className="text-sm font-medium mb-3">Items</h3>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                         {Array.isArray(selectedBill.items) && selectedBill.items.length > 0 ? (
                           selectedBill.items.map((item: any) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.inventory?.item?.name || 'Unknown Item'}</TableCell>
                                <TableCell className="text-right">{parseFloat(item.quantity).toFixed(2)}</TableCell>
                                <TableCell className="text-right">₹{parseFloat(item.sellingPrice).toFixed(2)}</TableCell>
                                <TableCell className="text-right">₹{parseFloat(item.total).toFixed(2)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                             <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                No items found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  {/* Summary */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2 border-t pt-3">
                      <div className="flex justify-between">
                       <span className="text-muted-foreground">Subtotal:</span>
                       <span>₹{parseFloat(selectedBill.subtotal || 0).toFixed(2)}</span>
                      </div>
                     {parseFloat(selectedBill.extraChargesTotal || 0) > 0 && (
                        <div className="flex justify-between">
                         <span className="text-muted-foreground">Extra Charges:</span>
                         <span>₹{parseFloat(selectedBill.extraChargesTotal).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                       <span className="text-muted-foreground">Tax ({parseFloat(selectedBill.taxRate || 0)}%):</span>
                       <span>₹{parseFloat(selectedBill.tax || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>Total:</span>
                       <span>₹{parseFloat(selectedBill.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Notes */}
                 {selectedBill.notes && (
                    <div>
                     <h3 className="text-sm font-medium mb-2">Notes</h3>
                     <p className="text-muted-foreground text-sm bg-muted/50 p-3 rounded-md">{selectedBill.notes}</p>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                     onClick={() => setIsDetailsDialogOpen(false)}
                    >
                      Close
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                       setIsDetailsDialogOpen(false);
                       handleEditBill(selectedBill);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                   <Button 
                     variant="outline" 
                     onClick={() => handleDownloadInvoice(selectedBill)}
                     disabled={downloadingInvoice === selectedBill?.id}
                   >
                     <Download className="mr-2 h-4 w-4" />
                     {downloadingInvoice === selectedBill?.id ? 'Downloading...' : 'Download Invoice'}
                   </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button>
                         {selectedBill.status === 'due' ? 'Mark as Paid' : 'Update Status'}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                         handleStatusUpdate(selectedBill.id, 'due');
                         setSelectedBill({...selectedBill, status: 'due'});
                        }}>
                          Mark as Due
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                         handleStatusUpdate(selectedBill.id, 'paid');
                         setSelectedBill({...selectedBill, status: 'paid'});
                        }}>
                          Mark as Paid
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
    </div>
  );
} 