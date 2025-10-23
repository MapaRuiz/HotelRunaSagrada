import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { ShellBaseComponent } from '../../sharedShell';

@Component({
  standalone: true,
  selector: 'app-operator-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './operator-shell.html',
  styleUrls: ['./operator-shell.css']
})
export class OperatorShellComponent extends ShellBaseComponent {
  constructor(auth: AuthService) {
    super(auth);
  }
}
