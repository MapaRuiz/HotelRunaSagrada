import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollExpandMedia } from './scroll-expand-media/scroll-expand-media';
import { InteractiveBentoGallery } from './interactive-bento-gallery/interactive-bento-gallery';
import { TestimonialsSection } from './testimonials/testimonials-section'; 

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    ScrollExpandMedia,
    InteractiveBentoGallery,
    TestimonialsSection
  ],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css']
})
export class Landing {}
