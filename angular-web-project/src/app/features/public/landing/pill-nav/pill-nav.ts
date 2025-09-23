import {
  Component,
  Input,
  ElementRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
  OnDestroy,
  signal,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { gsap } from 'gsap';

export interface PillNavItem {
  label: string;
  href: string;
  ariaLabel?: string;
}

@Component({
  selector: 'pill-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pill-nav.html',
  styleUrls: ['./pill-nav.css']
})
export class PillNav implements AfterViewInit, OnDestroy {
  @Input() logo!: string;
  @Input() logoAlt = 'Logo';
  @Input() items: PillNavItem[] = [];
  @Input() activeHref?: string;
  @Input() className = '';
  @Input() ease = 'power3.easeOut';
  @Input() baseColor = '#fff';
  @Input() pillColor = '#060010';
  @Input() hoveredPillTextColor = '#060010';
  @Input() pillTextColor?: string;
  @Input() initialLoadAnimation = true;

  isMobileMenuOpen = signal(false);

  @ViewChildren('circleRef') circleRefs!: QueryList<ElementRef<HTMLSpanElement>>;
  private tlRefs: gsap.core.Timeline[] = [];
  private activeTweens: gsap.core.Tween[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.layout();
      window.addEventListener('resize', this.layout);

      if (document.fonts?.ready) {
        document.fonts.ready.then(this.layout).catch(() => {});
      }
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.layout);
    }
  }

  layout = () => {
    if (!isPlatformBrowser(this.platformId)) return;

    this.circleRefs.forEach((circleEl, i) => {
      const circle = circleEl.nativeElement;
      const pill = circle.parentElement as HTMLElement;
      if (!pill) return;

      const rect = pill.getBoundingClientRect();
      const { width: w, height: h } = rect;
      const R = ((w * w) / 4 + h * h) / (2 * h);
      const D = Math.ceil(2 * R) + 2;
      const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
      const originY = D - delta;

      circle.style.width = `${D}px`;
      circle.style.height = `${D}px`;
      circle.style.bottom = `-${delta}px`;

      gsap.set(circle, {
        xPercent: -50,
        scale: 0,
        transformOrigin: `50% ${originY}px`
      });

      const label = pill.querySelector<HTMLElement>('.pill-label');
      const white = pill.querySelector<HTMLElement>('.pill-label-hover');

      if (label) gsap.set(label, { y: 0 });
      if (white) gsap.set(white, { y: h + 12, opacity: 0 });

      this.tlRefs[i]?.kill();
      const tl = gsap.timeline({ paused: true });

      tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease: this.ease }, 0);
      if (label) tl.to(label, { y: -(h + 8), duration: 2, ease: this.ease }, 0);
      if (white) {
        gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 });
        tl.to(white, { y: 0, opacity: 1, duration: 2, ease: this.ease }, 0);
      }

      this.tlRefs[i] = tl;
    });
  };

  handleEnter(i: number) {
    const tl = this.tlRefs[i];
    if (!tl) return;
    this.activeTweens[i]?.kill();
    this.activeTweens[i] = tl.tweenTo(tl.duration(), { duration: 0.3, ease: this.ease });
  }

  handleLeave(i: number) {
    const tl = this.tlRefs[i];
    if (!tl) return;
    this.activeTweens[i]?.kill();
    this.activeTweens[i] = tl.tweenTo(0, { duration: 0.2, ease: this.ease });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }
}
