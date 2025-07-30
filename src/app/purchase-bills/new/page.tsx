"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Package, Plus, Trash2, Truck, Calculator, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

// Local schema that matches form expectations
const localPurchaseBillSchema = z.object({
  supplierId: z.string(),
  billNumber: z.string().min(1, 'Bill number is required'),
  billDate: z.string().min(1, 'Bill date is required'),
  batchNumber: z.string(),
  taxRate: z.number().min(0).max(100),
  items: z.array(z.object({
    itemId: z.string().min(1, 'Item is required'),
    quantity: z.number().min(0.01, 'Quantity must be positive'),
    costPrice: z.number().min(0, 'Cost price must be positive'),
  })).min(1, 'At least one item is required'),
  extraCharges: z.array(z.object({
    name: z.string().min(1, 'Charge name is required'),
    amount: z.number().min(0, 'Amount must be positive'),
  })),
  notes: z.string().optional(),
  status: z.enum(['pending', 'received', 'cancelled']),
});

type LocalPurchaseBillForm = z.infer<typeof localPurchaseBillSchema>;

// Function to generate bill number
const generateBillNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PB-${year}${month}${day}-${random}`;
};

// Function to generate batch number from date
const generateBatchNumber = (date: string) => {
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

export default function CreatePurchaseBillPage() {
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm<LocalPurchaseBillForm>({
    resolver: zodResolver(localPurchaseBillSchema),
    defaultValues: {
      supplierId: 'none',
      billNumber: generateBillNumber(),
      billDate: new Date().toISOString().split('T')[0],
      batchNumber: generateBatchNumber(new Date().toISOString().split('T')[0]),
      taxRate: 0,
      items: [{ 
        itemId: '', 
        quantity: 0, 
        costPrice: 0, 
      }],
      extraCharges: [{
        name: 'Tax',
        amount: 0
      }],
      notes: '',
      status: 'pending'
    }
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: 'items'
  });

  const { fields: extraChargeFields, append: appendExtraCharge, remove: removeExtraCharge } = useFieldArray({
    control,
    name: 'extraCharges'
  });

  // Watch form values for calculations
  const watchedItems = watch('items');
  const watchedBatchNumber = watch('batchNumber');
  const watchedExtraCharges = watch('extraCharges');
  const watchedBillDate = watch('billDate');
  const watchedTaxRate = watch('taxRate'); // Added for tax rate

  // Update batch numbers when bill date changes
  useEffect(() => {
    if (watchedBillDate) {
      const batchNumber = generateBatchNumber(watchedBillDate);
      setValue('batchNumber', batchNumber);
    }
  }, [watchedBillDate, setValue]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch items
        const itemsResponse = await fetch('/api/items');
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          setItems(itemsData);
        }

        // Fetch suppliers
        const suppliersResponse = await fetch('/api/suppliers');
        if (suppliersResponse.ok) {
          const suppliersData = await suppliersResponse.json();
          setSuppliers(suppliersData);
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

  // Calculate totals
  const calculateSubtotal = () => {
    return watchedItems.reduce((sum, item) => {
      return sum + (item.quantity * item.costPrice);
    }, 0);
  };

  const calculateExtraChargesTotal = () => {
    return watchedExtraCharges.reduce((sum, charge) => {
      return sum + charge.amount;
    }, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return (subtotal * (watchedTaxRate / 100));
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const extraChargesTotal = calculateExtraChargesTotal();
    const taxAmount = calculateTax();
    return subtotal + extraChargesTotal + taxAmount;
  };

  // Handle item selection to auto-fill cost price
  const handleItemSelect = (itemIndex: number, itemId: string) => {
    const selectedItem = items.find(item => item.id === itemId);
    if (selectedItem) {
      setValue(`items.${itemIndex}.costPrice`, parseFloat(selectedItem.costPrice));
    }
  };

  // Add new item row
  const addItemRow = () => {
    const batchNumber = watchedBillDate ? generateBatchNumber(watchedBillDate) : '';
    appendItem({
      itemId: '',
      quantity: 0,
      costPrice: 0,
    });
  };

  // Add new extra charge
  const addExtraCharge = () => {
    appendExtraCharge({
      name: '',
      amount: 0
    });
  };

  // Handle form submission
  const onSubmit = async (data: LocalPurchaseBillForm) => {
    setIsSubmitting(true);
    try {
      // Convert "none" supplier to empty string for API
      const submitData = {
        ...data,
        supplierId: data.supplierId === 'none' ? '' : data.supplierId
      };

      const response = await fetch('/api/purchase-bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        toast.success('Purchase bill created successfully!');
        router.push('/inventory');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create purchase bill');
      }
    } catch (error) {
      console.error('Error creating purchase bill:', error);
      toast.error('Failed to create purchase bill');
    } finally {
      setIsSubmitting(false);
    }
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Create Purchase Bill
            </h1>
            <p className="text-muted-foreground mt-1">
              Add new stock through purchase bills
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="w-full">
                <Label htmlFor="supplierId" className="mb-2 block">Supplier</Label>
                <Select 
                  value={watch('supplierId')} 
                  onValueChange={(value) => setValue('supplierId', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select supplier (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Supplier</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full">
                <Label htmlFor="billNumber" className="mb-2 block">Bill Number</Label>
                <Input
                  id="billNumber"
                  {...register('billNumber')}
                  placeholder="Enter bill number"
                  className="w-full"
                />
                {errors.billNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.billNumber.message}</p>
                )}
              </div>

              <div className="w-full">
                <Label htmlFor="billDate" className="mb-2 block">Bill Date</Label>
                <Input
                  id="billDate"
                  type="date"
                  {...register('billDate')}
                  className="w-full"
                />
                {errors.billDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.billDate.message}</p>
                )}
              </div>

              <div className="w-full">
                <Label htmlFor="batchNumber" className="mb-2 block">Batch Number</Label>
                <Input
                  id="batchNumber"
                  {...register('batchNumber')}
                  placeholder="Auto-generated from bill date"
                  readOnly
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {itemFields.map((field, index) => (
                <div key={field.id} className="group relative border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <Label className="mb-2 block">Item</Label>
                      <Select 
                        value={watch(`items.${index}.itemId`)} 
                        onValueChange={(value) => {
                          setValue(`items.${index}.itemId`, value);
                          handleItemSelect(index, value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} ({item.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="mb-2 block">Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label className="mb-2 block">Cost Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.costPrice`, { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex items-end justify-center h-full">
                      {itemFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="h-10 w-10 p-0 text-muted-foreground hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Error messages below the input row */}
                  <div className="mt-2 space-y-1">
                    {errors.items?.[index]?.itemId && (
                      <p className="text-sm text-red-500">{errors.items[index]?.itemId?.message}</p>
                    )}
                    {errors.items?.[index]?.quantity && (
                      <p className="text-sm text-red-500">{errors.items[index]?.quantity?.message}</p>
                    )}
                    {errors.items?.[index]?.costPrice && (
                      <p className="text-sm text-red-500">{errors.items[index]?.costPrice?.message}</p>
                    )}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addItemRow}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Extra Charges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Extra Charges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Tax row (always present) */}
              <div className="flex items-center gap-2 py-2">
                <span className="font-medium">Tax</span>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={watchedTaxRate}
                  onChange={e => setValue('taxRate', parseFloat(e.target.value) || 0)}
                  className="w-20 h-8 px-2 text-sm"
                  placeholder="0"
                />
                <span className="text-sm">%</span>
                <span className="ml-auto">₹{calculateTax().toFixed(2)}</span>
              </div>
              {/* Other extra charges */}
              {extraChargeFields.map((field, index) => (
                field.name !== 'Tax' && (
                  <div key={field.id} className="flex gap-4">
                    <div className="flex-1">
                      <Label className="mb-2 block">Charge Name</Label>
                      <Input
                        {...register(`extraCharges.${index}.name`)}
                        placeholder="e.g., Shipping, Handling"
                      />
                    </div>
                    <div className="w-32">
                      <Label className="mb-2 block">Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`extraCharges.${index}.amount`, { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeExtraCharge(index)}
                        className="h-10 w-10 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addExtraCharge}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Extra Charge
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>₹{calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Extra Charges:</span>
                <span>₹{calculateExtraChargesTotal().toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register('notes')}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Creating...' : 'Create Purchase Bill'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
} 