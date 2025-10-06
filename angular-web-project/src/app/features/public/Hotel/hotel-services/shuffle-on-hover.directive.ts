import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appShuffleOnHover]'
})
export class ShuffleOnHoverDirective {
  /** Selector del texto que se anima. Si no se pasa, el host. */
  @Input('appShuffleOnHover') targetSelector?: string;
  /** Conjunto de caracteres opcional */
  @Input() charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ';

  private get target(): HTMLElement {
    if (!this.targetSelector) return this.el.nativeElement as HTMLElement;
    return (this.el.nativeElement as HTMLElement).querySelector(this.targetSelector) as HTMLElement;
  }

  constructor(private el: ElementRef<HTMLElement>) {}

  @HostListener('mouseenter')
  onEnter() { this.shuffle(); }

  private shuffle() {
    const el = this.target;
    if (!el) return;

    const original = el.textContent || '';
    const frames = 10;
    let i = 0;

    const id = setInterval(() => {
      if (i < frames) {
        el.textContent = original
          .split('')
          .map((ch, idx) => (idx < Math.floor((i / frames) * original.length) ? ch : this.rand()))
          .join('');
        i++;
      } else {
        el.textContent = original;
        clearInterval(id);
      }
    }, 25);
  }

  private rand() {
    return this.charset.charAt(Math.floor(Math.random() * this.charset.length));
  }
}
