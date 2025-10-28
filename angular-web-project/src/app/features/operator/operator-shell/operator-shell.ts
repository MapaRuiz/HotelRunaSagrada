import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { ShellBaseComponent } from '../../sharedShell';
import { OperatorHotelResolver } from '../../../services/operator-hotel-resolver';

@Component({
  standalone: true,
  selector: 'app-operator-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './operator-shell.html',
  styleUrls: ['./operator-shell.css']
})
export class OperatorShellComponent extends ShellBaseComponent implements OnInit {
  private hotelResolver = inject(OperatorHotelResolver);
  hasHotelAccess = false;

  constructor(auth: AuthService) {
    super(auth);
  }

  override ngOnInit() {
    // Check if operator has hotel access for showing certain menu items
    this.hotelResolver.hasHotelAccess().subscribe({
      next: (hasAccess) => {
        this.hasHotelAccess = hasAccess;
      },
      error: () => {
        this.hasHotelAccess = false;
      }
    });
  }
}
