import { Component } from '@angular/core';
import { Navbar } from '../navbar/navbar';  
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-primera',
  imports: [Navbar, RouterModule],
  templateUrl: './primera.html',
  styleUrl: './primera.css'
})
export class Primera {

}
