import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollExpandMedia } from './scroll-expand-media/scroll-expand-media';
import { TestimonialsSection } from './testimonials/testimonials-section';
import { CardsParallaxComponent } from './cards-parallax/cards-parallax';
import { PillNav } from './pill-nav/pill-nav';  

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    ScrollExpandMedia,
    TestimonialsSection,
    CardsParallaxComponent,
    PillNav  
  ],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css']
})
export class Landing {
  showNav = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const hero = document.querySelector('app-scroll-expand-media');
    if (hero) {
      const rect = hero.getBoundingClientRect();
     
      this.showNav = rect.bottom <= 80; 
    }
  }
}
