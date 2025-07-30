import { Suspense } from 'react';
import ItemsPage from '@/components/items/items-page';

export default function Page() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4 sm:p-6">Loading...</div>}>
      <ItemsPage />
    </Suspense>
  );
} 