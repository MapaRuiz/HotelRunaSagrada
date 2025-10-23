import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { ShellBaseComponent } from '../../sharedShell';

@Component({
  standalone: true,
  selector: 'app-client-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './client-shell.html',
  styleUrls: ['./client-shell.css']
})
export class ClientShellComponent extends ShellBaseComponent {
  constructor(auth: AuthService) {
    super(auth);
  }
}
