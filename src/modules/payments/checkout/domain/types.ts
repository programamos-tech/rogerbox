export type DocumentType = 'CC' | 'NIT' | 'CE' | 'PP';

export interface Buyer {
  firstName: string;
  lastName: string;
  email: string;
  documentId: string;
  documentType: DocumentType;
  address: string;
}

export interface Course {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
}
