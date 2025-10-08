import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

type Transform = { row:number; col:number; rot:number };

@Component({
  selector: 'app-room-gallery',           // si usas <app-vacation-gallery> cambia este selector
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-gallery.html',
  styleUrls: ['./room-gallery.scss']
})
export class RoomGalleryComponent implements OnInit, OnChanges {
  @Input() plantBg: string =
    'https://images.pexels.com/photos/2215534/pexels-photo-2215534.jpeg';

  @Input() title = 'Disfruta tus vacaciones con nosotros';
  @Input() hotelName = '';

  @Input() images: string[] = [
    'https://images.pexels.com/photos/1231365/pexels-photo-1231365.jpeg',
    'https://images.pexels.com/photos/39691/family-pier-man-woman-39691.jpeg',
    'https://images.pexels.com/photos/3155726/pexels-photo-3155726.jpeg',
    'https://images.pexels.com/photos/61129/pexels-photo-61129.jpeg',
    'https://images.pexels.com/photos/18160731/pexels-photo-18160731.jpeg',
    'https://images.pexels.com/photos/13767906/pexels-photo-13767906.jpeg'
  ];

  @Input() columns = 3;
  @Input() cardW = 300;
  @Input() cardH = 200;

  hover = false;
  rows: string[][] = [];
  private transforms = new Map<string, Transform>();

  ngOnInit() {
    this.rows = this.chunk(this.images, this.columns);
    this.randomizeTransforms();
  }

  ngOnChanges(ch: SimpleChanges) {
    if (ch['images'] || ch['columns']) {
      this.rows = this.chunk(this.images ?? [], this.columns || 3);
      this.randomizeTransforms();
    }
  }

  setHover(v: boolean) { this.hover = v; }

  styleFor(ri: number, ci: number) {
    const key = `${ri},${ci}`;
    const t = this.transforms.get(key);
    const w = this.cardW + 40;
    const h = this.cardH + 60;
    return t ? {
      width: `${w}px`,
      height: `${h}px`,
      transform: `translateX(${t.col}px) translateY(${t.row}px) rotateZ(${t.rot}deg)`
    } : {};
  }

  // ============ helpers ============
  private chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  private centerOffset(rows: number, row: number, col: number) {
    const rowOffset = rows / 2 - row;
    let translateY = rowOffset * (this.cardH + 60) + rowOffset * 50;
    if (!(rows % 2)) translateY = translateY ? translateY / 2 : translateY - 155;

    const colOffset = Math.floor(this.columns / 2 - col);
    let translateX =
      colOffset * (this.cardW + 40) +
      (colOffset * (1200 - (this.cardW + 40) * this.columns)) / this.columns;

    return { translateX, translateY };
  }

  private randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  private randomizeTransforms() {
    const rows = this.rows.length;
    this.transforms.clear();

    this.rows.forEach((row, ri) =>
      row.forEach((_, ci) => {
        const c = this.centerOffset(rows, ri, ci);
        const tolY = (this.cardH + 60) * 0.5;
        const tolX = (this.cardW + 40) * 0.5;

        this.transforms.set(`${ri},${ci}`, {
          row: c.translateY + this.randInt(-tolY, tolY),
          col: c.translateX + this.randInt(-tolX, tolX),
          rot: this.randInt(-60, 60)
        });
      })
    );
  }
}
