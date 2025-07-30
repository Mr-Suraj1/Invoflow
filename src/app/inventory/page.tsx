import { Suspense } from 'react';
import InventoryPage from '@/components/inventory/inventory-page';

export default function Page() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4 sm:p-6">Loading...</div>}>
      <InventoryPage />
    </Suspense>
  );
} 