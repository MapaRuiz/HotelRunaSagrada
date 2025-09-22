import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-marquee',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './marquee.html',
  styleUrls: ['./marquee.css']
})
export class Marquee {
  @Input() reverse: boolean = false;
  @Input() pauseOnHover: boolean = false;
  @Input() vertical: boolean = false;
  @Input() repeat: number = 4;
}
