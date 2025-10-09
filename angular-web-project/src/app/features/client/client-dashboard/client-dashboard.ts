import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { Router } from '@angular/router';

export interface Reservation {
  reservationId: number;
  hotel: { name: string } | string;
  room: { name: string } | string;
  checkIn: string;
  checkOut: string;
  status: string;
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
 
  imports: [CommonModule, HttpClientModule, NgApexchartsModule],
  templateUrl: './client-dashboard.html',
  styleUrls: ['./client-dashboard.css']
})
export class ClientDashboardComponent implements OnInit {
  private api = inject(UsersService);
  private router = inject(Router);
  me: any = null;
  reservations: Reservation[] = [];
  showHistory = false;
  loading = false;
  private base = environment.apiBaseUrl;
  cards = [
    { label: 'Reservas activas', value: '0', delta: 0.0, icon: 'bi-calendar-check text-info' },
    { label: 'Historial', value: '0', delta: 0.0, icon: 'bi-clock-history text-warning' },
    { label: 'Gastos totales', value: '$0', delta: 0.0, icon: 'bi-wallet2 text-success' },
    { label: 'Puntos fidelidad', value: '300', delta: 5.0, icon: 'bi-gift text-primary' },
  ];
  summaryActive = 0;
  summaryFinished = 0;

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
        this.loadCurrentReservations();
      },
      error: (err) => {
        if (err?.status === 401) {
          localStorage.removeItem('user');
          this.router.navigate(['/login'], { queryParams: { returnUrl: '/client/dashboard' } });
        }
      }
    });
  }

  loadCurrentReservations() {
    if (!this.me?.user_id) return;
    this.loading = true;
    this.api.getCurrentReservations(this.me.user_id).subscribe({
      next: (res) => {
        console.debug('loadCurrentReservations response sample:', res?.[0]);
        const normalized = (res || []).map((r: any) => this.normalizeReservation(r));
  this.reservations = normalized;
  
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
    this.api.getHistoryReservations(this.me.user_id).subscribe({
      next: (res) => {
        console.debug('loadHistoryReservations response sample:', res?.[0]);
        const normalized = (res || []).map((r: any) => this.normalizeReservation(r));
  this.reservations = normalized;
  
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

  private normalizeReservation(r: any): Reservation {
    if (!r) return {} as Reservation;
    const reservationId = r.reservationId ?? r.id ?? r._id ?? null;
    const hotelRaw = r.hotel ?? r.hotelName ?? r.hotel_name ?? '';
    const roomRaw = r.room ?? r.roomName ?? r.room_name ?? '';
    const hotel = typeof hotelRaw === 'string' ? { name: hotelRaw } : hotelRaw || { name: '' };
    const room = typeof roomRaw === 'string' ? { name: roomRaw } : roomRaw || { name: '' };
    const checkIn = r.checkIn ?? r.check_in ?? r.startDate ?? '';
    const checkOut = r.checkOut ?? r.check_out ?? r.endDate ?? '';
    const status = r.status ?? (r.state ?? '') ;
    return {
      reservationId,
      hotel,
      room,
      checkIn,
      checkOut,
      status,
    } as Reservation;
  }

  private updateSummaryAndChart() {
    const today = new Date();
    // Active reservations: checkOut >= today
  const active = this.reservations.filter(r => r.checkOut && new Date(r.checkOut) >= today).length;
  const finished = this.reservations.filter(r => r.checkOut && new Date(r.checkOut) < today).length;
  const total = this.reservations.length;
  this.cards[0].value = String(active);
  this.cards[1].value = String(total);
  this.summaryActive = active;
  this.summaryFinished = finished;
   
    this.cards[2].value = '$0';

    
    const months: string[] = [];
    const counts: number[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()+1}`;
      months.push(d.toLocaleString(undefined, { month: 'short' }));
      const cnt = this.reservations.filter(r => {
        if (!r.checkIn) return false;
        const ci = new Date(r.checkIn);
        return ci.getFullYear() === d.getFullYear() && ci.getMonth() === d.getMonth();
      }).length;
      counts.push(cnt);
    }

    
    this.chartOptions.series = [{ name: 'Reservas', data: counts }];
    this.chartOptions.xaxis = { categories: months } as any;
    
    try { this.chart?.updateOptions?.({ xaxis: this.chartOptions.xaxis, series: this.chartOptions.series }); } catch {}
  }

  ngAfterViewInit() {
    
  }
}
