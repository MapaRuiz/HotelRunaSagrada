import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-media-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-item.html',
  styleUrls: ['./media-item.css']
})
export class MediaItem {
  @Input() type: 'video' | 'image' = 'image'; 
  @Input() src!: string;                      
  @Input() poster?: string;                   
  @Input() title: string = '';                
  @Input() alt: string = '';   // 👈 añadido
}
