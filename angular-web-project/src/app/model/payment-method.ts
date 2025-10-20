import { Payment } from "./payment";
import { User } from "./user";

export type payment_type = 'TARJETA' | 'PAYPAL' | 'EFECTIVO' | string;

export interface PaymentMethod {
  method_id: number;
  user_id: number;
  type: payment_type;            // TARJETA | PAYPAL | EFECTIVO
  last4?: string | null;
  holder_name?: string | null;
  billing_address?: string | null;
  // Rel
  user?: User;
}