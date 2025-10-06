import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-room-rv',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-rv.html',
  styleUrls: ['./room-rv.scss'],
})
// ...
export class RoomRvComponent implements OnChanges {
  constructor(private s: DomSanitizer) {}

  @Input() src = '';
  @Input() modelId = 'dTDqi6RDy29';
  @Input() autoplay = true; // Valor por defecto true para autoplay
  @Input() title = 'Recorrido virtual';
  @Input() hideBrand = true; // 🎉 NUEVO: Oculta la mayoría de los botones por defecto

  safeSrc!: SafeResourceUrl;    // para el <iframe>
  rawUrl = '';                 // para el <a>

  ngOnChanges(): void {
    let url: string;
    
    if (this.src?.trim()) {
      // Si se pasa un `src` explícito, lo usamos
      url = this.src;
    } else {
      // Si no hay `src`, construimos la URL
      const playParam = `&play=${this.autoplay ? 1 : 0}`;
      const brandParam = this.hideBrand ? '&brand=0' : ''; // Agregamos &brand=0 si queremos ocultar
      url = `https://mpembed.com/show/?m=${this.modelId}${playParam}${brandParam}`;
    }

    // Añadir &brand=0 si no está y se desea ocultar, incluso si se usó un `src` explícito
    if (this.hideBrand && !url.includes('&brand=0')) {
        url = `${url}${url.includes('?') ? '&' : '?'}brand=0`;
    }

    this.rawUrl = url;
    this.safeSrc = this.s.bypassSecurityTrustResourceUrl(url);
  }
}