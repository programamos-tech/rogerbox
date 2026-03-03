import { Buyer } from './types';

export const validateBuyer = (buyer: Buyer): boolean => {
  return [
    buyer.firstName,
    buyer.lastName,
    buyer.email,
    buyer.documentId,
    buyer.address,
  ].every((field) => field.trim() !== '');
};
