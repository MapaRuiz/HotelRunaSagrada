import { Component, Input, Output, EventEmitter, AfterViewInit, OnDestroy, ElementRef, Inject } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ServiceOffering } from '../../../../../model/service-offering';
import { ServiceSchedule } from '../../../../../model/service-schedule';

@Component({
  standalone: true,
  selector: 'app-service-modal',
  imports: [CommonModule],
  templateUrl: './service-modal.html',
  styleUrls: ['./service-modal.scss']
})
export class ServiceModalComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) service!: ServiceOffering;
  @Input() schedules: ServiceSchedule[] = [];
  @Output() closed = new EventEmitter<void>();

  constructor(
    private host: ElementRef<HTMLElement>,
    @Inject(DOCUMENT) private doc: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit(): void {
    // Portal: mover el host del componente al <body> para evitar conflictos de stacking
    if (isPlatformBrowser(this.platformId)) {
      this.doc.body.appendChild(this.host.nativeElement);
      this.doc.body.classList.add('has-modal-open');
      // Foco accesible
      setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('.svc-modal')?.focus(), 0);
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.doc.body.classList.remove('has-modal-open');
    }
  }

  // ------- helpers de vista -------
  get cover(): string | null {
    const url = this.service?.image_urls?.[0];
    return url || null;
  }

  private dayMap: Record<string, string> = {
    DAILY: 'Diario',
    MONDAY: 'Lunes', MON: 'Lunes',
    TUESDAY: 'Martes', TUE: 'Martes',
    WEDNESDAY: 'Miércoles', WED: 'Miércoles',
    THURSDAY: 'Jueves', THU: 'Jueves',
    FRIDAY: 'Viernes', FRI: 'Viernes',
    SATURDAY: 'Sábado', SAT: 'Sábado',
    SUNDAY: 'Domingo', SUN: 'Domingo'
  };

  translateDays(days?: string[] | null): string {
    if (!days?.length) return 'Días variables';
    if (days.length === 1 && days[0].toUpperCase() === 'DAILY') return 'Diario';
    return days.map(d => this.dayMap[d.toUpperCase()] ?? d).join(', ');
  }

  get schedulesView() {
    return (this.schedules || []).map(sc => ({
      ...sc,
      _daysLabel: this.translateDays(sc.days_of_week)
    }));
  }

  formatTime(t?: string): string {
    if (!t) return '—';
    const [H, M] = t.split(':');
    return `${(H ?? '00').padStart(2, '0')}:${(M ?? '00').padStart(2, '0')}`;
  }

  triggerClose() {
    this.closed.emit();
  }
}
