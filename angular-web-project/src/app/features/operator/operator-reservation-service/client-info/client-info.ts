import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ReservationLookupPayload } from '../../../../services/room';

@Component({
  selector: 'app-client-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-info.html',
  styleUrls: ['./client-info.css']
})
export class ClientInfoComponent {
  @Input() reservation: ReservationLookupPayload | null = null;
}
