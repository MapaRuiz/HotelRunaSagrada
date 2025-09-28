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

  private leafyBg = 'url(https://images.pexels.com/photos/807598/pexels-photo-807598.jpeg)';

  get cards() {
    const uniq = new Map<number, Amenity>();
    for (const a of this.amenities || []) uniq.set(a.amenity_id, a);
    const amenities = Array.from(uniq.values());

    // Crear arrays separados sin duplicar amenities
    const imageCards = amenities
      .filter(a => !!a.image && a.image.trim() !== '')
      .map(a => ({
        id: a.amenity_id,
        title: '',
        bg: `url(${this.imgUrl(a.image)})`,
        type: 'image-only'
      }));

    const textCards = amenities.map((a, i) => ({
      id: a.amenity_id + 1000,
      title: a.name,
      bg: i % 2 === 0 ? 'white' : this.leafyBg,
      type: i % 2 === 0 ? 'white-text' : 'leafy-text'
    }));

    // Combinar todos sin duplicar
    const allCards = [...imageCards, ...textCards];
    
    // Patrón rotativo: blanco, imagen, imagen, hojas
    const patterns = [
      ['white-text', 'image-only', 'image-only', 'leafy-text'], // fila 1
      ['image-only', 'image-only', 'leafy-text', 'white-text'], // fila 2  
      ['leafy-text', 'white-text', 'image-only', 'image-only'], // fila 3
      ['image-only', 'leafy-text', 'white-text', 'image-only']  // fila 4
    ];
    
    const result = [];
    let cardIndex = 0;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const targetType = patterns[row][col];
        
        // Buscar card del tipo requerido que no hayamos usado
        let foundCard = null;
        for (let i = cardIndex; i < allCards.length; i++) {
          if (allCards[i].type === targetType) {
            foundCard = allCards.splice(i, 1)[0];
            break;
          }
        }
        
        // Si no encontramos del tipo exacto, usar el siguiente disponible
        if (!foundCard && allCards.length > 0) {
          foundCard = allCards.shift();
        }
        
        // Si no hay cards, crear filler
        if (!foundCard) {
          foundCard = {
            id: Date.now() + Math.random(),
            title: '',
            bg: this.leafyBg,
            type: 'leafy-filler'
          };
        }
        
        result.push(foundCard);
      }
    }

    return result;
  }
}