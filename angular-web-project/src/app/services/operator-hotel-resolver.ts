import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { AuthService } from './auth';
import { StaffMemberService } from './staff-member';

/**
 * Service to resolve the hotel ID for an operator user.
 * 
 * Resolution strategy:
 * 1. Check if email matches pattern op1@hotel.com to op5@hotel.com -> return 1-5
 * 2. Otherwise, look up StaffMember by userId and return their hotel_id
 * 3. If no match found, return null
 */
@Injectable({ providedIn: 'root' })
export class OperatorHotelResolver {
  private auth = inject(AuthService);
  private staffApi = inject(StaffMemberService);

  /**
   * Resolves the hotel ID for the current logged-in operator.
   * @returns Observable<number | null> - hotel ID or null if not found
   */
  resolveHotelId(): Observable<number | null> {
    const user = this.auth.userSnapshot();
    if (!user) {
      return of(null);
    }

    // Strategy 1: Check email pattern op1@hotel.com - op5@hotel.com
    const emailMatch = user.email?.match(/^op(\d)@hotel\.com$/i);
    if (emailMatch) {
      const hotelId = parseInt(emailMatch[1], 10);
      if (hotelId >= 1 && hotelId <= 5) {
        return of(hotelId);
      }
    }

    // Strategy 2: Look up StaffMember
    return this.staffApi.getByUser(user.user_id).pipe(
      map(staff => staff?.hotel_id ?? null),
      catchError(() => of(null))
    );
  }

  /**
   * Checks if the current operator has access to hotel-specific features
   * (Contratar servicios, Reservas, etc.)
   * @returns Observable<boolean>
   */
  hasHotelAccess(): Observable<boolean> {
    return this.resolveHotelId().pipe(
      map(hotelId => hotelId !== null)
    );
  }

  /**
   * Gets full hotel information if operator has access
   * @returns Observable with hotelId and hasAccess
   */
  getHotelContext(): Observable<{ hotelId: number | null; hasAccess: boolean }> {
    return this.resolveHotelId().pipe(
      map(hotelId => ({
        hotelId,
        hasAccess: hotelId !== null
      }))
    );
  }
}
