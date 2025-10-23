import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../services/auth';
import { ShellBaseComponent } from '../../../sharedShell';

@Component({
  standalone: true,
  selector: 'app-admin-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.html',
  styleUrls: ['./admin-shell.css']
})
export class AdminShellComponent extends ShellBaseComponent {
  constructor(auth: AuthService) {
    super(auth);
  }
}
