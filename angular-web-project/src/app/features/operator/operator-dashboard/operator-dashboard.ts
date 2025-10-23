import { Component, OnInit, ViewChild, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { PaymentService } from '../../../services/payment';
import { ReservationService } from '../../../services/reservation';
import { AuthService } from '../../../services/auth';
import { Hotel } from '../../../model/hotel';
import { HotelsService } from '../../../services/hotels';
import { StaffMemberService } from '../../../services/staff-member';
import { filter, take } from 'rxjs/operators';
import { of, switchMap } from 'rxjs';

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
  selector: 'app-operator-dashboard',
  imports: [CommonModule, NgApexchartsModule, AgGridAngular],
  templateUrl: './operator-dashboard.html',
  styleUrls: ['./operator-dashboard.css']
})
export class OperatorDashboardComponent implements OnInit {
  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private paymentApi = inject(PaymentService);
  private reservationApi = inject(ReservationService);
  private authService = inject(AuthService);
  private hotelsApi = inject(HotelsService);
  private staffApi = inject(StaffMemberService);

  currentHotelId: number | null = null;
  currentHotel: Hotel | null = null;

  incomeLoading = true;
  incomeValue = '$0';
  incomeDelta = 0;
  reservationValue = 0;
  reservationDelta = 0;

  reservations: any[] = [];

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: ChartOptions = {
    series: [{ name: 'Reservas', data: [] }],
    chart: {
      type: 'bar' as ChartType,
      height: 300,
      toolbar: { show: false }
    },
    xaxis: { categories: [] },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2 },
    grid: { borderColor: '#e6e8e1' },
    legend: { show: false },
    fill: { opacity: 0.9 },
    colors: ['#778E69']
  };

  colDefs: ColDef[] = [
    { headerName: 'ID', field: 'reservationId', width: 90 },
    { headerName: 'Cliente', field: 'clientName', flex: 1 },
    { headerName: 'Habitación', field: 'roomNumber', width: 120 },
    { headerName: 'Check-in', field: 'checkInDate', width: 120 },
    { headerName: 'Check-out', field: 'checkOutDate', width: 120 },
    { headerName: 'Estado', field: 'status', width: 120 }
  ];

  ngOnInit() {
    if (!this.isBrowser) return;

    const snap = this.authService.userSnapshot();

    if (snap) {
      this.resolveHotelFromUser(snap.user_id).subscribe({
        next: (hotelId: any) => hotelId ? this.loadForHotel(hotelId) : console.error('No se pudo resolver hotelId'),
        error: (e: any) => console.error('Error resolviendo hotelId desde snapshot', e)
      });
      return;
    }
  }

  /** Dado un userId, intenta obtener el hotelId usando StaffMember */
  private resolveHotelFromUser(userId: number) {
    // getByUserId debe devolver StaffMember (o null si no existe)
    return this.staffApi.getByUser(userId).pipe(
      take(1),
      switchMap(sm => of(sm?.hotel_id ?? null))
    );
  }

  /** Carga todo el dashboard para el hotel dado */
  private loadForHotel(hotelId: number) {
    this.currentHotelId = hotelId;

    // Cargar información del hotel
    this.hotelsApi.get(this.currentHotelId).subscribe({
      next: hotel => {
        this.currentHotel = hotel;

        // Cargar datos específicos del hotel
        this.calcIncome();
        this.calcReservations();
        this.loadReservationsByRoomType();
        this.loadReservationsForHotel();
      },
      error: err => console.error('Error cargando hotel', err)
    });
  }

  calcIncome() {
    this.incomeLoading = true;
    this.paymentApi.calculateIncomeByHotel(this.currentHotelId!).subscribe(p => {
      this.incomeValue = `$${p[0]}`;
      this.incomeDelta = p[1];
      this.incomeLoading = false;
      console.log('Income:', p);
    });
  }

  calcReservations() {
    this.reservationApi.countByHotel(this.currentHotelId!).subscribe(p => {
      this.reservationValue = p[0];
      this.reservationDelta = p[1];
    });
  }

  private loadReservationsByRoomType() {
    this.reservationApi.countByRoomTypeAndHotel(this.currentHotelId!).subscribe({
      next: (map) => {
        const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);

        const categories = entries.map(([roomType]) => roomType ?? 'N/D');
        const data = entries.map(([, count]) => count ?? 0);

        this.chartOptions = {
          ...this.chartOptions,
          xaxis: { ...this.chartOptions.xaxis, categories },
          series: [{ name: 'Reservas', data }]
        };
      },
      error: (err: any) => {
        console.error('Error cargando reservas por tipo', err);
        this.chartOptions = {
          ...this.chartOptions,
          xaxis: { ...this.chartOptions.xaxis, categories: ['—'] },
          series: [{ name: 'Reservas', data: [0] }]
        };
      }
    });
  }

  private loadReservationsForHotel() {
    this.reservationApi.getAllByHotel(this.currentHotelId!).subscribe({
      next: (reservations) => {
        this.reservations = reservations;
      },
      error: (err) => {
        console.error('Error cargando reservas del hotel', err);
        this.reservations = [];
      }
    });
  }

}
