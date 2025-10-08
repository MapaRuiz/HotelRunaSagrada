import { Component } from '@angular/core';
import { Primera } from './primera/primera';
import { Hoteles } from './hoteles/hoteles';
import { Details } from './details/details';
import { Stats } from './stats/stats';
import { Servicios } from './servicios/servicios';
import { Testimonials } from './testimonials/testimonials';
import { Footer } from './footer/footer';

@Component({
  selector: 'app-landing',
  imports: [Primera, Hoteles, Details, Stats, Servicios, Testimonials, Footer],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing {

}
