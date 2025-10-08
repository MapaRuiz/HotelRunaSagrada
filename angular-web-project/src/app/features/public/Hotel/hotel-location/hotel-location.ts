import {
  Component, Input, AfterViewInit, OnDestroy,
  ViewChild, ElementRef, Inject, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export interface Attraction {
  name: string;
  category: string;
  lat: number;
  lon: number;
}

export interface HotelLike {
  name: string;
  latitude?: string;
  longitude?: string;
}

interface LegendItem { label: string; color: string; }

@Component({
  standalone: true,
  selector: 'app-hotel-location',
  imports: [CommonModule],
  templateUrl: './hotel-location.html',
  styleUrls: ['./hotel-location.scss']
})
export class HotelLocationComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) hotel!: HotelLike;
  @Input() attractions: Attraction[] = []; // si no llega, se rellena con seeds
  @Input() plantBg =
    'url(https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg)';

  @ViewChild('map', { static: false }) mapEl?: ElementRef<HTMLDivElement>;

  private map?: any; // Leaflet map
  private L!: typeof import('leaflet');
  private markers: any[] = [];

  legend: LegendItem[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  get hasCoords(): boolean {
    return !!(this.hotel?.latitude && this.hotel?.longitude);
  }
  get center(): [number, number] {
    return [Number(this.hotel?.latitude), Number(this.hotel?.longitude)];
  }

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.hasCoords || !this.mapEl) return;

    // Leaflet dinámico para evitar SSR issues
    const leaflet = await import('leaflet');
    this.L = leaflet;

    // ---- SIN llamadas externas: usa datos quemados ----
    if (!this.attractions?.length) {
      this.attractions = this.seedAttractionsForHotel(this.hotel.name);
    }

    // Mapa
    this.map = this.L.map(this.mapEl.nativeElement, {
      zoomControl: true,
      attributionControl: false
    }).setView(this.center, 14);

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(this.map);

    // Icono
    const baseIcon = (fill = '#0a6847') =>
      this.L.divIcon({
        className: 'map-pin',
        html: `<span class="pin" style="--pin:${fill}"></span>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      });

    // Hotel
    this.L.marker(this.center, { icon: baseIcon('#0a6847') })
      .addTo(this.map)
      .bindPopup(`<strong>${this.hotel.name}</strong>`);

    // Atracciones
    this.markers = [];
    this.attractions.forEach(a => {
      const color = this.categoryColor(a.category);
      const m = this.L.marker([a.lat, a.lon], { icon: baseIcon(color) })
        .addTo(this.map)
        .bindPopup(`<strong>${a.name}</strong><br><small>${a.category}</small>`);
      this.markers.push(m);
    });

    // Fit
    if (this.markers.length) {
      const group = this.L.featureGroup(this.markers as any);
      group.addLayer(this.L.marker(this.center));
      this.map.fitBounds(group.getBounds().pad(0.2));
    }

    // Leyenda (colores iguales que pines)
    this.legend = this.buildLegend(this.attractions);
    this.cdr.detectChanges();

    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  ngOnDestroy(): void {
    try { this.map?.remove(); } catch {}
  }

  /** Distancia en km con 1 decimal */
  distanceKm(a: {lat:number, lon:number}): string {
    if (!this.hasCoords) return '—';
    const toRad = (v:number)=> v * Math.PI/180;
    const R = 6371;
    const [lat1, lon1] = this.center;
    const {lat:lat2, lon:lon2} = a;
    const dLat = toRad(lat2-lat1), dLon = toRad(lon2-lon1);
    const s1 = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    const d = 2 * R * Math.asin(Math.sqrt(s1));
    return `${d.toFixed(1)} km`;
  }

  // ---------- Leyenda / categorías ----------
  private canonicalLabel(cat: string): string {
    const c = cat.toLowerCase();
    if (c.includes('playa') || c.includes('isla')) return 'Playa/Isla';
    if (c.includes('museo')) return 'Museo';
    if (c.includes('hist')) return 'Histórico/Fuerte';
    if (c.includes('fuerte')) return 'Histórico/Fuerte';
    if (c.includes('transporte') || c.includes('aeropuerto')) return 'Transporte';
    if (c.includes('plaza') || c.includes('paseo') || c.includes('pueblo')) return 'Paseo/Plaza';
    if (c.includes('parque') || c.includes('mirador')) return 'Parque/Mirador';
    if (c.includes('arquitect')) return 'Arquitectura';
    return 'Otro';
  }

  private categoryColor(cat: string): string {
    const c = this.canonicalLabel(cat);
    switch (c) {
      case 'Playa/Isla':       return '#1fb38a';
      case 'Museo':            return '#845ef7';
      case 'Histórico/Fuerte': return '#f59f00';
      case 'Transporte':       return '#ef4444';
      case 'Paseo/Plaza':      return '#3b82f6';
      case 'Parque/Mirador':   return '#00b341';
      case 'Arquitectura':     return '#14b8a6';
      default:                 return '#4f46e5';
    }
  }

  private buildLegend(atts: Attraction[]): LegendItem[] {
    const set = new Map<string,string>();
    for (const a of atts) {
      const label = this.canonicalLabel(a.category);
      set.set(label, this.categoryColor(label));
    }
    const out: LegendItem[] = [{ label: 'Hotel', color: '#0a6847' }];
    for (const [label, color] of set) out.push({ label, color });
    return out;
  }

  // ---------- Seeds QUEMADOS (coordenadas reales) ----------
  /** 4 atracciones reales por hotel (coordenadas verificadas) */
  private seedAttractionsForHotel(name: string): Attraction[] {
    switch (name) {
      /* CARTAGENA */
      case 'Runa Sagrada Cartagena':
        return [
          { name: 'Torre del Reloj (Ciudad Amurallada)', category: 'Histórico', lat: 10.423036, lon: -75.549183 },
          { name: 'Castillo San Felipe de Barajas',      category: 'Fuerte',    lat: 10.4228,   lon: -75.5357   },
          { name: 'Bocagrande (costanera)',              category: 'Playa',     lat: 10.41003,  lon: -75.55145  },
          { name: 'Muelle de los Pegasos',               category: 'Paseo/Plaza', lat: 10.421675, lon: -75.547708 }
        ];

      /* EJE CAFETERO (Manizales) */
      case 'Runa Sagrada Eje Cafetero':
        return [
          { name: 'Catedral Basílica de Manizales',      category: 'Histórico', lat: 5.0709, lon: -75.5190 },
          { name: 'Monumento a los Colonizadores (Chipre)', category: 'Mirador', lat: 5.0770, lon: -75.5278 },
          { name: 'Plaza de Bolívar (Manizales)',        category: 'Plaza',     lat: 5.0705, lon: -75.5193 },
          { name: 'Recinto del Pensamiento',             category: 'Parque',    lat: 5.0283, lon: -75.4524 }
        ];

      /* SAN ANDRÉS */
      case 'Runa Sagrada San Andrés':
        return [
          { name: 'Cayo Acuario y Haynes Cay',           category: 'Playa',       lat: 12.55,    lon: -81.6833 },
          { name: 'Johnny Cay (Parque Regional)',        category: 'Playa',       lat: 12.5946,  lon: -81.6943 },
          { name: 'Aeropuerto G. Rojas Pinilla (ADZ)',   category: 'Transporte',  lat: 12.5836,  lon: -81.7112 },
          { name: 'North End (centro urbano)',           category: 'Paseo/Plaza', lat: 12.5831,  lon: -81.7004 }
        ];

      /* SANTA MARTA */
      case 'Runa Sagrada Santa Marta':
        return [
          { name: 'Catedral de Santa Marta',             category: 'Histórico',   lat: 11.2410, lon: -74.2110 },
          { name: 'Museo del Oro Tairona (Casa de la Aduana)', category: 'Museo', lat: 11.2439, lon: -74.2136 },
          { name: 'Taganga (bahía)',                      category: 'Playa',      lat: 11.2579, lon: -74.1996 },
          { name: 'Parque Tayrona - acceso El Zaino',     category: 'Parque',     lat: 11.2858, lon: -74.0497 }
        ];

      /* VILLA DE LEYVA */
      case 'Runa Sagrada Villa de Leyva':
        return [
          { name: 'Plaza Mayor de Villa de Leyva',        category: 'Histórico',     lat: 5.6340, lon: -73.5246 },
          { name: 'Casa Terracota',                       category: 'Arquitectura',  lat: 5.6463, lon: -73.5133 },
          { name: 'Museo Paleontológico',                 category: 'Museo',         lat: 5.6379, lon: -73.5183 },
          { name: 'Ráquira (pueblo artesanal)',           category: 'Pueblo/Plaza',  lat: 5.5374, lon: -73.6310 }
        ];

      default:
        return [];
    }
  }
}
