'use client';

import { useStore } from '@/lib/store';
import NutritionalPlans from '@/components/NutritionalPlans';

export default function NutritionalPlansPage() {
  const { nutritionalPlans, purchaseNutritionalPlan } = useStore();

  const handlePurchase = (planId: string) => {
    // Simulate purchase
    purchaseNutritionalPlan(planId);
    alert('¡Plan nutricional comprado exitosamente!');
  };

  return (
    <NutritionalPlans 
      plans={nutritionalPlans} 
      onPurchase={handlePurchase}
    />
  );
}
