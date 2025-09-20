import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, zip } from 'rxjs';

import { ServiceOffering } from '../../../../model/service-offering';
import { ServiceOfferingService } from '../../../../services/service-offering-service';
import { HotelsService } from '../../../../services/hotels';
import { Hotel } from '../../../../model/hotel';

@Component({
  selector: 'app-services-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services-table.html',
  styleUrls: ['./services-table.css']
})
export class ServicesTable {
  serviceOfferingList: ServiceOffering[] = [];
  hotelsList: Hotel[] = [];

  constructor(
    private serviceOfferingService: ServiceOfferingService,
    private hotelsService: HotelsService
  ) {}

  ngOnInit(): void {
    // pairs service responses and hotel responses
    // emit when both responses are ready
    zip([
      this.serviceOfferingService.getAll(),
      this.hotelsService.list()
    ]).subscribe(([services, hotels]) => {
      this.hotelsList = hotels;
      this.serviceOfferingList = services.map(service => ({
        ...service,
        hotel: hotels.find(hotel => hotel.hotel_id === service.hotel_id)
      }));
    });
  }

  deleteServiceOffering(serviceOffering: ServiceOffering): void {
    const index = this.serviceOfferingList.indexOf(serviceOffering);
    if (index >= 0) {
      this.serviceOfferingList.splice(index, 1);
    }
    this.serviceOfferingService.deleteById(serviceOffering.id).subscribe();
  }
}
