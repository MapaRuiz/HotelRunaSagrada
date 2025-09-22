import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

export interface GalleryItem {
  id: number;
  type: 'image' | 'video';
  src: string;
  alt: string;
  title?: string;
  desc?: string;
  poster?: string;
  span?: string; // 'wide', 'tall' etc.
}

@Component({
  selector: 'app-interactive-bento-gallery',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './interactive-bento-gallery.html',
  styleUrls: ['./interactive-bento-gallery.css']
})
export class InteractiveBentoGallery {
  items: GalleryItem[] = [
     {
    id: 1,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2',
    alt: 'Ciudad de noche',
    title: 'Bogotá iluminada'
  },
    {
    id: 2,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1544986581-efac024faf62',
    alt: 'Selva',
    title: 'Selva Colombiana',
    desc: 'Místico sendero',
    span: 'tall'
  },
  {
    id: 3,
    type: 'video',
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    alt: 'Video naturaleza',
    poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    title: 'Naturaleza en movimiento'
  },
    {
    id: 4,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9',
    alt: 'Montañas de Colombia',
    title: 'Montañas',
    desc: 'Paisaje andino',
    span: 'wide'
  },
  {
    id: 5,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff',
    alt: 'Café colombiano',
    title: 'Café de Colombia',
    desc: 'La tradición cafetera',
    span: 'wide'
  }
];


  selectedItem: GalleryItem | null = null;

  openModal(item: GalleryItem) {
    this.selectedItem = item;
  }

  closeModal() {
    this.selectedItem = null;
  }

  drop(event: CdkDragDrop<GalleryItem[]>) {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
  }
}
