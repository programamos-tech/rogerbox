import { Buyer } from '@payments/checkout/domain/types';

export const createOrder = async ({
  courseId,
  amount,
  buyer,
}: {
  courseId: string;
  amount: number;
  buyer: Buyer;
}) => {
  const response = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseId,
      amount,
      customerEmail: buyer.email,
      customerName: `${buyer.firstName} ${buyer.lastName}`,
      buyer,
    }),
  });

  if (!response.ok) {
    throw new Error('Error creating order');
  }

  return response.json();
};
