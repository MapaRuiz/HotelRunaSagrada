import { Component, Input, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceOffering } from '../../../../model/service-offering';
import { ServiceOfferingService } from '../../../../services/service-offering-service';
import { ServiceModalComponent } from './service-modal/service-modal';
import { ShuffleOnHoverDirective } from './shuffle-on-hover.directive';

type Group = { category: string; items: ServiceOffering[] };

@Component({
  standalone: true,
  selector: 'app-hotel-services',
  imports: [CommonModule, ServiceModalComponent, ShuffleOnHoverDirective],
  templateUrl: './hotel-services.html',
  styleUrls: ['./hotel-services.scss']
})
export class HotelServicesComponent implements OnInit {
  @Input({ required: true }) hotelId!: number;

  private api = inject(ServiceOfferingService);

  private all = signal<ServiceOffering[]>([]);
  servicesByCat = computed<Group[]>(() => {
    const map = new Map<string, ServiceOffering[]>();
    for (const s of this.all()) {
      const key = s.category || 'Otros';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    // orden sugerido
    const order = ['Gastronomía', 'Cultural', 'Tours', 'Experiencia', 'Otros'];
    return Array.from(map.entries())
      .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(([category, items]) => ({ category, items }));
  });

  // modal
  selected?: ServiceOffering;
  private modalOpen = signal(false);
  selectedSchedules = signal([] as any[]);

  ngOnInit(): void {
    this.api.listByHotel(this.hotelId).subscribe(list => this.all.set(list ?? []));
  }

  cover(s: ServiceOffering) {
    return s.image_urls?.[0] || 'https://picsum.photos/seed/serv/800/500';
  }

  open(s: ServiceOffering) {
    this.selected = s;
    this.api.getSchedules(s.id!).subscribe(sc => this.selectedSchedules.set(sc ?? []));
    this.modalOpen.set(true);
  }

  close() { this.selected = undefined; this.modalOpen.set(false); }
  showModal() { return this.modalOpen(); }

}
