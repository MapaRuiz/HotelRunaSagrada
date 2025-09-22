import { Payment } from "./payment";
import { User } from "./user";

export type payment_type       = 'CARD' | 'PAYPAL' | 'CASH' | string;

export interface PaymentMethod {
  method_id: number;
  user_id: number;
  type: payment_type;            // CARD | PAYPAL | CASH
  last4?: string | null;
  holder_name?: string | null;
  billing_address?: string | null;
  // Rel
  user?: User;
  payments?: Payment[];
}