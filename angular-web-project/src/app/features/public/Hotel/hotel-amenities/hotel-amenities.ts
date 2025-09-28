import { Component, Input, ChangeDetectionStrategy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hotel } from '../../../../model/hotel'; 
export interface Amenity { amenity_id: number; name: string; image?: string; type?: any; }
export interface HotelLite {
  name: string;
  description?: string;
  check_in_after?: string;
  check_out_before?: string;
}

type AmenityCard = {
  id: number;
  title: string;
  bg: string;        // background image or gradient
  icon?: string;     // (opcional) si luego quieres svg
};

@Component({
  selector: 'app-hotel-amenities',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hotel-amenities.html',
  styleUrls: ['./hotel-amenities.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
// ...
export class HotelAmenitiesComponent {
  @Input({ required: true }) hotel!: Pick<Hotel, 'name' | 'description' | 'check_in_after' | 'check_out_before'>;
  @Input() amenities: Amenity[] = [];
  @Input() assetBase: string = '';

  private imgUrl(path?: string): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const base = (this.assetBase || '').replace(/\/+$/, '');
    const rel  = String(path).replace(/^\/+/, '');
    return base ? `${base}/${rel}` : `/${rel}`;
  }

  private leafy(i=0){
    const keys = ['monstera dark leaves','tropical leaves dark','philodendron dark','jungle foliage dark'];
    const q = keys[i % keys.length];
    return `url(https://source.unsplash.com/1200x900/?${encodeURIComponent(q)})`;
  }

  // ✅ SOLO amenities reales (sin “extras”)
  get cards() {
    const uniq = new Map<number, Amenity>();
    for (const a of this.amenities || []) uniq.set(a.amenity_id, a);

    return Array.from(uniq.values()).map((a, i) => ({
      id: a.amenity_id,
      title: a.name,
      // usa imagen del back si existe; si no, hojas
      bg: `url(${this.imgUrl(a.image)})`,
    })).map((c, i) => ({
      ...c,
      bg: c.bg === 'url()' ? this.leafy(i) : c.bg
    }));
  }
}
