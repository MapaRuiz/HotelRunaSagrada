import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollExpandMedia } from './scroll-expand-media/scroll-expand-media';
import { InteractiveBentoGallery } from './interactive-bento-gallery/interactive-bento-gallery';
import { TestimonialsSection } from './testimonials/testimonials-section'; 
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ScrollExpandMedia,
    InteractiveBentoGallery,
    TestimonialsSection
  ],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css']
})
export class Landing {}
