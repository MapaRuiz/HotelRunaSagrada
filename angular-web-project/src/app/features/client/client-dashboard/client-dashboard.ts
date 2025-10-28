import { Component, OnInit, inject, ViewChild, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { forkJoin, switchMap } from 'rxjs';
import {
  NgApexchartsModule,
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexGrid,
  ApexLegend,
  ApexFill,
  ChartType
} from 'ng-apexcharts';
import { ColDef } from 'ag-grid-community';
import { HttpClientModule } from '@angular/common/http';

import { environment } from '../../../../environments/environment';
import { UsersService } from '../../../services/users';
import { ReservationService } from '../../../services/reservation';
import { PaymentService } from '../../../services/payment';
import { Router } from '@angular/router';
import * as bootstrap from 'bootstrap';
import { BillServicesComponent } from '../../operator/reservation/bill-services/bill-services';
import { ClientReservationComponent } from '../client-reservation/client-reservation';

export interface Reservation {
  reservationId: number;
  hotel: { name: string } | string;
  room: { number: string } | string;
  checkIn: string;
  checkOut: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKIN' | 'FINISHED';
  totalPaid?: number;
  pendingAmount?: number;
}

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  grid: ApexGrid;
  legend: ApexLegend;
  fill: ApexFill;
  colors?: string[];
};

@Component({
  standalone: true,
  selector: 'app-client-dashboard',

  imports: [CommonModule, HttpClientModule, NgApexchartsModule, BillServicesComponent, ClientReservationComponent],
  templateUrl: './client-dashboard.html',
  styleUrls: ['./client-dashboard.css']
})
export class ClientDashboardComponent implements OnInit {

  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  selectedReservation: any = null;
  invoiceModal: any;

  private api = inject(UsersService);
  private reservationApi = inject(ReservationService);
  private paymentApi = inject(PaymentService);
  private router = inject(Router);
  
  me: any = null;
  reservations: Reservation[] = [];
  allReservations: Reservation[] = [];
  showHistory = false;
  loading = false;
  
  private base = environment.apiBaseUrl;
  
  cards = [
    { label: 'Reservas activas', value: '0', delta: 0.0, icon: 'bi-calendar-check text-info' },
    { label: 'Historial', value: '0', delta: 0.0, icon: 'bi-clock-history text-warning' },
    { label: 'Total gastado', value: '$0', delta: 0.0, icon: 'bi-wallet2 text-success' },
    { label: 'Próximo check-in', value: '--', delta: 0.0, icon: 'bi-clock text-primary' },
  ];
  
  summaryActive = 0;
  summaryFinished = 0;
  totalSpent = 0;

  @ViewChild('chart') chart!: ChartComponent;

  public chartOptions: ChartOptions = {
    series: [{ name: 'Reservas', data: [1, 2, 0, 3, 2, 1, 2] }],
    chart: {
      type: 'bar' as ChartType,
      height: 300,
      toolbar: { show: false }
    },
    xaxis: { categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'] },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2 },
    grid: { borderColor: '#e6e8e1' },
    legend: { show: false },
    fill: { opacity: 0.9 },
    colors: ['#778E69']
  };

  colDefs: ColDef[] = [
    { headerName: 'ID', field: 'reservationId', width: 80 },
    { headerName: 'Hotel', field: 'hotel.name', flex: 1 },
    { headerName: 'Habitación', field: 'room.name', flex: 1 },
    { headerName: 'Check-in', field: 'checkIn', width: 150 },
    { headerName: 'Check-out', field: 'checkOut', width: 150 },
    { headerName: 'Estado', field: 'status', width: 130 }
  ];

  ngOnInit() {
    this.api.getMe().subscribe({
      next: (u) => {
        this.me = u;
        this.loadAllReservationsWithPayments();
        this.loadCurrentReservations();
      },
      error: (err) => {
        if (err?.status === 401) {
          if (this.isBrowser) {
            try { localStorage.removeItem('user'); } catch (e) { /* ignore */ }
          }
          this.router.navigate(['/login'], { queryParams: { returnUrl: '/client/dashboard' } });
        }
      }
    });
  }

  private loadAllReservationsWithPayments() {
    if (!this.me?.user_id) return;
    
    // Get all user reservations
    this.reservationApi.getByUser(this.me.user_id).pipe(
      switchMap(reservations => {
        // Get payments for all reservations
        const paymentRequests = reservations.map(r => 
          this.paymentApi.getByReservation(r.reservation_id)
        );
        
        return forkJoin({
          reservations: [reservations],
          payments: paymentRequests.length > 0 ? forkJoin(paymentRequests) : [[]]
        });
      })
    ).subscribe({
      next: ({ reservations, payments }) => {
        // Calculate totals
        this.totalSpent = payments.flat().reduce((sum, p) => sum + (p.amount || 0), 0);
        
        // Enrich reservations with payment data
        this.allReservations = reservations.map((r, idx) => {
          const reservationPayments = payments[idx] || [];
          const totalPaid = reservationPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
          
          return {
            ...this.normalizeReservation(r),
            totalPaid,
            pendingAmount: 0 // Will calculate based on services
          };
        });

        this.updateSummaryAndChart();
      },
      error: (err) => {
        console.error('Error cargando reservas con pagos:', err);
      }
    });
  }

  loadCurrentReservations() {
    if (!this.me?.user_id) return;
    this.loading = true;
    
    this.reservationApi.getByUser(this.me.user_id).subscribe({
      next: (res) => {
        const normalized = (res || []).map((r: any) => this.normalizeReservation(r));

        const today = new Date();
        // Active: CONFIRMED, CHECKIN or future checkOut
        const current = normalized.filter((r: any) => {
          if (!r) return false;
          // Status-based filtering
          if (r.status === 'CONFIRMED' || r.status === 'CHECKIN') return true;
          // Date-based filtering for pending checkouts
          if (!r.checkOut) return true;
          const co = new Date(r.checkOut);
          return co >= today;
        });
        
        this.reservations = current;
        this.updateSummaryAndChart();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al obtener reservas activas:', err);
        this.loading = false;
      },
    });
  }

  loadHistoryReservations() {
    if (!this.me?.user_id) return;
    this.loading = true;
    
    this.reservationApi.getByUser(this.me.user_id).subscribe({
      next: (res) => {
        const normalized = (res || []).map((r: any) => this.normalizeReservation(r));
        
        const today = new Date();
        // History: FINISHED status or past checkOut
        const past = normalized.filter((r: any) => {
          if (!r) return false;
          if (r.status === 'FINISHED') return true;
          if (!r.checkOut) return false;
          const co = new Date(r.checkOut);
          return co < today;
        });
        
        this.reservations = past;
        this.updateSummaryAndChart();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al obtener historial:', err);
        this.loading = false;
      },
    });
  }

  hotelName(r: Reservation) {
    if (!r) return '';
    return typeof r.hotel === 'string' ? r.hotel : (r.hotel && (r.hotel as any).name) || '';
  }

  roomName(r: Reservation) {
    if (!r) return '';
    return typeof r.room === 'string' ? r.room : (r.room && (r.room as any).name) || '';
  }

  isActiveReservation(r: Reservation) {
    if (!r) return false;
    if (!r.checkOut) return true;
    const co = new Date(r.checkOut);
    return co >= new Date();
  }

  private normalizeReservation(r: any): Reservation {
    if (!r) return {} as Reservation;
    const reservationIdRaw = r.reservationId ?? r.reservation_id ?? r.id ?? r._id ?? null;
    const reservationId =
      reservationIdRaw != null && reservationIdRaw !== ''
        ? Number(reservationIdRaw)
        : null;
    const hotelRaw = r.hotel ?? r.hotelName ?? r.hotel_name ?? '';
    const roomRaw = r.room ?? r.roomName ?? r.room_name ?? '';
    const hotel = typeof hotelRaw === 'string' ? { name: hotelRaw } : hotelRaw || { name: '' };
    const room = typeof roomRaw === 'string' ? { name: roomRaw } : roomRaw || { name: '' };
    const checkIn = r.checkIn ?? r.check_in ?? r.startDate ?? '';
    const checkOut = r.checkOut ?? r.check_out ?? r.endDate ?? '';
    const status = r.status ?? (r.state ?? '');
    return {
      reservationId,
      hotel,
      room,
      checkIn,
      checkOut,
      status,
      totalPaid: r.totalPaid || 0,
      pendingAmount: r.pendingAmount || 0
    } as Reservation;
  }

  private updateSummaryAndChart() {
    const today = new Date();
    const active = this.reservations.filter(r => r.checkOut && new Date(r.checkOut) >= today).length;
    const finished = this.reservations.filter(r => r.checkOut && new Date(r.checkOut) < today).length;
    const total = this.reservations.length;
    
    // Update KPI cards
    this.cards[0].value = String(active);
    
    let historialCount = total;
    if (this.allReservations && this.allReservations.length > 0) {
      historialCount = this.allReservations.filter(r => r.checkOut && new Date(r.checkOut) < today).length;
    }
    this.cards[1].value = String(historialCount);
    
    this.summaryActive = active;
    this.summaryFinished = finished;

    // Total spent - calculated from allReservations
    this.cards[2].value = '$' + this.totalSpent.toFixed(2);
    
    // Next check-in date
    const futureReservations = this.reservations.filter(r => {
      if (!r.checkIn) return false;
      const ci = new Date(r.checkIn);
      return ci > today;
    });
    
    if (futureReservations.length > 0) {
      const sorted = futureReservations.sort((a, b) => {
        const dateA = new Date(a.checkIn);
        const dateB = new Date(b.checkIn);
        return dateA.getTime() - dateB.getTime();
      });
      this.cards[3].value = sorted[0].checkIn;
    } else {
      this.cards[3].value = '--';
    }

    const months: string[] = [];
    const counts: number[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      months.push(d.toLocaleString(undefined, { month: 'short' }));
      const source = (this.allReservations && this.allReservations.length > 0) ? this.allReservations : this.reservations;
      const cnt = (source || []).filter(r => {
        if (!r.checkIn) return false;
        const ci = new Date(r.checkIn);
        return ci.getFullYear() === d.getFullYear() && ci.getMonth() === d.getMonth();
      }).length;
      counts.push(cnt);
    }


    this.chartOptions.series = [{ name: 'Reservas', data: counts }];
    this.chartOptions.xaxis = { categories: months } as any;

    try { this.chart?.updateOptions?.({ xaxis: this.chartOptions.xaxis, series: this.chartOptions.series }); } catch { }
  }

  ngAfterViewInit() {

  }
  openInvoice(r: any) {
    if (typeof document === 'undefined') return;

    if (!r.amount) {
      r.amount = this.calculateAmount(r);
    }
    this.selectedReservation = r;

    const modalElement = document.getElementById('invoiceModal');
    if (modalElement) {
      import('bootstrap').then(bs => {
        this.invoiceModal = new bs.Modal(modalElement);
        this.invoiceModal.show();
      });
    }
  }


  private calculateAmount(r: any): number {
    //  calcula días * tarifa fija
    const checkIn = new Date(r.checkIn);
    const checkOut = new Date(r.checkOut);
    const days = Math.max(1, (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const rate = 150; // valor por noche
    return days * rate;
  }

  handleReservationsChanged(): void {
    this.loadAllReservationsWithPayments();
    if (this.showHistory) {
      this.loadHistoryReservations();
    } else {
      this.loadCurrentReservations();
    }
  }
}
