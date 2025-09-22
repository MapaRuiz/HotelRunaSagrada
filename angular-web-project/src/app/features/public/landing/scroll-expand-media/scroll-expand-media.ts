import { Component, ElementRef, HostListener, Input, OnInit, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-scroll-expand-media',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scroll-expand-media.html',
  styleUrls: ['./scroll-expand-media.css']
})
export class ScrollExpandMedia implements OnInit {
  @Input() mediaType: 'video' | 'image' = 'video';
  @Input() mediaSrc!: string;
  @Input() posterSrc?: string;
  @Input() bgImageSrc!: string;
  @Input() title?: string;
  @Input() date?: string;
  @Input() scrollToExpand?: string;
  @Input() textBlend: boolean = false;

  scrollProgress: number = 0;
  showContent: boolean = false;
  mediaFullyExpanded: boolean = false;
  touchStartY: number = 0;
  isMobileState: boolean = false;
  isBrowser: boolean = false;

  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.checkIfMobile();
  }

  // Detectar resize
  @HostListener('window:resize', [])
  checkIfMobile() {
    if (this.isBrowser) {
      this.isMobileState = window.innerWidth < 768;
    }
  }

  // Wheel scroll
  @HostListener('window:wheel', ['$event'])
  onWheel(e: WheelEvent) {
    if (!this.isBrowser) return;
    if (this.mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
      this.mediaFullyExpanded = false;
      e.preventDefault();
    } else if (!this.mediaFullyExpanded) {
      e.preventDefault();
      const scrollDelta = e.deltaY * 0.0009;
      this.updateProgress(scrollDelta);
    }
  }

  // Touch start
  @HostListener('window:touchstart', ['$event'])
  onTouchStart(e: TouchEvent) {
    if (!this.isBrowser) return;
    this.touchStartY = e.touches[0].clientY;
  }

  // Touch move
  @HostListener('window:touchmove', ['$event'])
  onTouchMove(e: TouchEvent) {
    if (!this.isBrowser) return;
    if (!this.touchStartY) return;
    const touchY = e.touches[0].clientY;
    const deltaY = this.touchStartY - touchY;

    if (this.mediaFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
      this.mediaFullyExpanded = false;
      e.preventDefault();
    } else if (!this.mediaFullyExpanded) {
      e.preventDefault();
      const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
      const scrollDelta = deltaY * scrollFactor;
      this.updateProgress(scrollDelta);
      this.touchStartY = touchY;
    }
  }

  @HostListener('window:touchend')
  onTouchEnd() {
    if (!this.isBrowser) return;
    this.touchStartY = 0;
  }

  //  Forzar scrollTop=0 si aún no expandió
  @HostListener('window:scroll', [])
  onScroll() {
    if (!this.isBrowser) return;
    if (!this.mediaFullyExpanded) {
      window.scrollTo(0, 0);
    }
  }

  //  Actualizar scrollProgress
  updateProgress(delta: number) {
    this.scrollProgress = Math.min(Math.max(this.scrollProgress + delta, 0), 1);
    if (this.scrollProgress >= 1) {
      this.mediaFullyExpanded = true;
      this.showContent = true;
    } else if (this.scrollProgress < 0.75) {
      this.showContent = false;
    }
  }

  // Helpers para estilo dinámico
  get mediaWidth(): number {
    return 300 + this.scrollProgress * (this.isMobileState ? 650 : 1250);
  }
  get mediaHeight(): number {
    return 400 + this.scrollProgress * (this.isMobileState ? 200 : 400);
  }
  get textTranslateX(): number {
    return this.scrollProgress * (this.isMobileState ? 180 : 150);
  }

  get firstWord(): string {
    return this.title ? this.title.split(' ')[0] : '';
  }
  get restOfTitle(): string {
    return this.title ? this.title.split(' ').slice(1).join(' ') : '';
  }
}
