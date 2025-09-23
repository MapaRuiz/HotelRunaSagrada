import { PaymentMethod } from "./payment-method";
import { Reservation } from "./reservation";

export type payment_status     = 'PENDING' | 'PAID' | 'REFUNDED' | string;
export interface Payment {
  payment_id: number;
  reservation_id: number;
  payment_method_id: number;
  amount: number;
  status: payment_status;
  tx_reference?: string | null;
  // Rel
  reservation?: Reservation;
  payment_method?: PaymentMethod;
}
