import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollExpandMedia } from './scroll-expand-media/scroll-expand-media';
import { TestimonialsSection } from './testimonials/testimonials-section';
import { CardsParallaxComponent } from './cards-parallax/cards-parallax'; 



@Component({
 selector: 'app-landing',
 standalone: true,
 imports: [
   CommonModule,
   ScrollExpandMedia,
   TestimonialsSection,
   CardsParallaxComponent
 ],
 templateUrl: './landing.html',
 styleUrls: ['./landing.css']
})
export class Landing {

}