'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, DollarSign, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

// Schema for billing form
const billingFormSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  billDate: z.string().min(1, 'Bill date is required'),
  dueDate: z.string().optional(),
  status: z.enum(['due', 'paid']),
  items: z.array(z.object({
    inventoryId: z.string().min(1, 'Item is required'),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    sellingPrice: z.number().min(0, 'Price must be non-negative')
  })).min(1, 'At least one item is required'),
  extraCharges: z.array(z.object({
    name: z.string().min(1, 'Charge name is required'),
    amount: z.number().min(0, 'Amount must be non-negative')
  })),
  taxRate: z.number().min(0).max(100),
  notes: z.string().optional()
});

export type BillingFormData = z.infer<typeof billingFormSchema>;

function NewBillingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [availableInventory, setAvailableInventory] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [editingBill, setEditingBill] = useState<any>(null);

  const form = useForm<BillingFormData>({
    resolver: zodResolver(billingFormSchema),
    defaultValues: {
      billDate: new Date().toISOString().split('T')[0],
      status: 'due',
      items: [{ inventoryId: '', quantity: 1, sellingPrice: 0 }],
      extraCharges: [],
      taxRate: 0,
      notes: ''
    }
  });

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = form;
  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: 'items'
  });
  const { fields: chargeFields, append: appendCharge, remove: removeCharge } = useFieldArray({
    control,
    name: 'extraCharges'
  });

  const watchedItems = watch('items');
  const watchedClientId = watch('clientId');
  const watchedExtraCharges = watch('extraCharges');
  const watchedTaxRate = watch('taxRate');

  // Calculate totals
  const subtotal = watchedItems.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0);
  const extraChargesTotal = watchedExtraCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const tax = (subtotal + extraChargesTotal) * (watchedTaxRate / 100);
  const grandTotal = subtotal + extraChargesTotal + tax;

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clients
        const clientsResponse = await fetch('/api/clients');
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          setClients(clientsData);
        }

        // Fetch inventory
        const inventoryResponse = await fetch('/api/inventory');
        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json();
          setAvailableInventory(inventoryData.filter((inv: any) => parseFloat(inv.availableQuantity) > 0));
        }

        // If in edit mode, fetch the bill to edit
        if (isEditMode) {
          // Get the bill from sessionStorage (set by billing page)
          const storedBill = sessionStorage.getItem('editingBill');
          if (storedBill) {
            const bill = JSON.parse(storedBill);
            setEditingBill(bill);
            
            // Pre-fill the form with bill data
            setValue('clientId', bill.clientId);
            setValue('billDate', new Date(bill.billDate).toISOString().split('T')[0]);
            setValue('dueDate', bill.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : '');
            setValue('status', bill.status);
            setValue('taxRate', parseFloat(bill.taxRate || 0));
            setValue('notes', bill.notes || '');

            // Set items
            if (Array.isArray(bill.items) && bill.items.length > 0) {
              // Remove default item first
              removeItem(0);
              // Add bill items
              bill.items.forEach((item: any) => {
                appendItem({
                  inventoryId: item.inventoryId,
                  quantity: parseFloat(item.quantity),
                  sellingPrice: parseFloat(item.sellingPrice)
                });
              });
            }

            // Set extra charges
            if (Array.isArray(bill.extraCharges) && bill.extraCharges.length > 0) {
              bill.extraCharges.forEach((charge: any) => {
                appendCharge({
                  name: charge.name,
                  amount: parseFloat(charge.amount)
                });
              });
            }

            // Clear the stored bill
            sessionStorage.removeItem('editingBill');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoadingClients(false);
        setIsLoadingInventory(false);
      }
    };

    fetchData();
  }, [isEditMode, setValue, appendItem, appendCharge, removeItem]);

  const handleInventorySelect = (index: number, inventoryId: string) => {
    const selectedInventory = availableInventory.find(inv => inv.id === inventoryId);
    if (selectedInventory) {
      setValue(`items.${index}.sellingPrice`, parseFloat(selectedInventory.sellingPrice || 0));
    }
  };

  const onSubmit: SubmitHandler<BillingFormData> = async (data) => {
    setIsLoading(true);
    try {
      const url = isEditMode && editingBill ? `/api/bills/${editingBill.id}` : '/api/bills';
      const method = isEditMode && editingBill ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(isEditMode ? 'Bill updated successfully!' : 'Bill created successfully!');
        router.push('/billing');
      } else {
        const error = await response.json();
        toast.error(error.message || (isEditMode ? 'Failed to update bill' : 'Failed to create bill'));
      }
    } catch (error) {
      console.error('Error saving bill:', error);
      toast.error(isEditMode ? 'Failed to update bill' : 'Failed to create bill');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingClients || isLoadingInventory) {
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
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {isEditMode ? 'Edit Bill' : 'Create New Bill'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? 'Update bill details and regenerate invoice' : 'Create professional invoices from your inventory items'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Invoice Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Client</Label>
                <Select 
                  value={watchedClientId || ''} 
                  onValueChange={(value) => setValue('clientId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clientId && (
                  <p className="text-xs text-red-500">{errors.clientId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Invoice Date</Label>
                <Input
                  type="date"
                  {...register('billDate')}
                />
                {errors.billDate && (
                  <p className="text-xs text-red-500">{errors.billDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Due Date</Label>
                <Input
                  type="date"
                  {...register('dueDate')}
                />
                {errors.dueDate && (
                  <p className="text-xs text-red-500">{errors.dueDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select 
                  defaultValue="due"
                  value={watch('status')} 
                  onValueChange={(value: 'due' | 'paid') => setValue('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="due">Due</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-xs text-red-500">{errors.status.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Items</CardTitle>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => appendItem({ inventoryId: '', quantity: 1, sellingPrice: 0 })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {itemFields.map((field, index) => (
                <div key={field.id} className="flex flex-col lg:flex-row lg:items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <Select 
                      value={watchedItems[index]?.inventoryId || ''} 
                      onValueChange={(value) => {
                        setValue(`items.${index}.inventoryId`, value);
                        handleInventorySelect(index, value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableInventory.map((inv) => (
                          <SelectItem key={inv.id} value={inv.id}>
                            <div>
                              <div className="font-medium">{inv.item.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Available: {parseFloat(inv.availableQuantity).toFixed(2)} {inv.item.unit || 'pcs'}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3 lg:gap-2">
                    <div className="w-20">
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="text-center"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        placeholder="1"
                      />
                    </div>

                    <div className="w-24">
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="pl-6"
                          {...register(`items.${index}.sellingPrice`, { valueAsNumber: true })}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="w-20 text-right font-medium">
                      ₹{((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.sellingPrice || 0)).toFixed(2)}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={itemFields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Extra Charges Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Extra Charges</CardTitle>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => appendCharge({ name: '', amount: 0 })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Charge
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chargeFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <Input
                      {...register(`extraCharges.${index}.name`)}
                      placeholder="Charge name"
                    />
                  </div>
                  <div className="w-32">
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-6"
                        {...register(`extraCharges.${index}.amount`, { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCharge(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {extraChargesTotal > 0 && (
                  <div className="flex justify-between">
                    <span>Extra Charges:</span>
                    <span className="font-medium">${extraChargesTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <span>Tax Rate:</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      {...register('taxRate', { valueAsNumber: true })}
                      className="w-20 h-8"
                    />
                    <span>%</span>
                  </div>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Textarea
                {...register('notes')}
                placeholder="Add any additional notes or terms..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Bill' : 'Create Bill')}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewBillingPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <NewBillingPageContent />
    </Suspense>
  );
} 