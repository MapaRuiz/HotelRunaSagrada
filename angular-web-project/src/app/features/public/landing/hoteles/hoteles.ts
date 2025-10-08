import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-hoteles',
  standalone: true,
  imports:[RouterModule],
  templateUrl: './hoteles.html',
  styleUrls: ['./hoteles.css']   
})
export class Hoteles implements AfterViewInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const hoteles = document.querySelector(".hoteles") as HTMLElement;
      const cards = document.querySelectorAll(".card-car");
      let index = 0;

      function changeBackground() {
        cards.forEach(card => card.classList.remove("active"));

        const current = cards[index] as HTMLElement;
        const bg = current.getAttribute("data-bg");
        if (bg && hoteles) {
          hoteles.style.backgroundImage = `url(${bg})`;
        }

        current.classList.add("active");
        index = (index + 1) % cards.length;
      }

      changeBackground();
      setInterval(changeBackground, 3000);
    }
  }
}
