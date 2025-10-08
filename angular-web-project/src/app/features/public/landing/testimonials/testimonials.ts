import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-testimonials',
  standalone: true, // si usas Angular con standalone
  imports: [],
  templateUrl: './testimonials.html',
  styleUrls: ['./testimonials.css']
})
export class Testimonials implements AfterViewInit {

  // Referencia al contenedor en la plantilla
  @ViewChild('carouselTestimonial', { static: false }) carouselTestimonial!: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    if (!this.carouselTestimonial) return; // protección extra

    const carousel = this.carouselTestimonial.nativeElement;
    const cards = Array.from(carousel.children);

    cards.forEach(card => {
      const clone = card.cloneNode(true);
      carousel.appendChild(clone);
    });
  }
}
