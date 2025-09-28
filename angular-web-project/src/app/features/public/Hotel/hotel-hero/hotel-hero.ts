import { Component, Input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HotelModel {
  hotel_id?: number;
  name: string;
  description?: string;
  image?: string; // puede venir como /images/... o como https://...
}

@Component({
  selector: 'app-hotel-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hotel-hero.html',
  styleUrls: ['./hotel-hero.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class HotelHeroComponent {
  @Input({ required: true }) hotel!: HotelModel;
  @Input() images: string[] = [];
  @Input() scrollHeight: string = '500svh';

  /** Base absoluta del backend para unir con rutas tipo /images/... (la recibe el padre) */
  @Input() assetBase: string = '';

  /** Convierte /images/... a URL absoluta, mantiene http(s) tal cual */
  imgUrl(path?: string): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    // asegura la barra intermedia
    const base = this.assetBase?.replace(/\/+$/, '') ?? '';
    const rel  = path.replace(/^\/+/, '');
    return base ? `${base}/${rel}` : `/${rel}`;
  }

  get centerImage(): string {
    // Prioridad: primera de la galería > imagen del hotel > stock
    return (this.images?.length ? this.images[0] : this.hotel?.image)
        || 'https://source.unsplash.com/1200x1200/?hotel';
  }
  
  get tiles(): string[] {
    // Base: todas menos la central
    let tilesBase: string[] = [];
    if (this.images?.length > 1) {
      tilesBase = this.images.slice(1);
    } else {
      // si no hay suficientes, NO repitamos la central
      tilesBase = [];
    }
  
    const fallback = 'https://media.istockphoto.com/id/1757465332/es/foto/toma-de-dron-de-cartagena-colombia.jpg?s=612x612&w=0&k=20&c=MwDq6w-HmOcDsRZI3u41RdyK-JsNBpGkokuKkNnDD3A=';
    if (!tilesBase.length) tilesBase = [fallback];
  
    const out: string[] = [];
    for (let i = 0; i < 8; i++) out.push(tilesBase[i % tilesBase.length] || fallback);
    return out;
  }
  
}
