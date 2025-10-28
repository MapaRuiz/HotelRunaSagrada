import { Component, OnInit, AfterViewInit, ViewChild, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
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
  ApexFill
} from 'ng-apexcharts';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { PaymentService } from '../../../services/payment';
import { ReservationService } from '../../../services/reservation';
import { AuthService } from '../../../services/auth';
import { Hotel } from '../../../model/hotel';
import { HotelsService } from '../../../services/hotels';
import { OperatorHotelResolver } from '../../../services/operator-hotel-resolver';
import { AG_GRID_LOCALE, gridTheme, PAGINATION_CONFIG } from '../../admin/sharedTable';
import { finalize, forkJoin, map, switchMap } from 'rxjs';
import { UsersService } from '../../../services/users';
import { RoomService } from '../../../services/room';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

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
export class OperatorDashboardComponent implements OnInit, AfterViewInit {
  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private paymentApi = inject(PaymentService);
  private reservationApi = inject(ReservationService);
  private authService = inject(AuthService);
  private hotelsApi = inject(HotelsService);
  private hotelResolver = inject(OperatorHotelResolver);
  private cdr = inject(ChangeDetectorRef);
  private usersService = inject(UsersService);
  private roomService = inject(RoomService);

  currentHotelId: number | null = null;
  currentHotel: Hotel | null = null;

  incomeLoading = true;
  incomeValue = '$0';
  incomeDelta = 0;
  reservationValue = 0;
  reservationDelta = 0;
  reservationsLoading = false;

  // Chart loading states
  chartDataLoaded = false;

  // AG-Grid
  readonly gridTheme = gridTheme;
  readonly AG_GRID_LOCALE = AG_GRID_LOCALE;
  reservations: any[] = [];
  reservationsTableLoading = false;

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: ChartOptions = {
    series: [{ name: 'Reservas', data: [] }],
    chart: { type: 'bar', height: 300, toolbar: { show: false } },
    xaxis: { categories: [] },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2 },
    grid: { borderColor: '#e6e8e1' },
    legend: { show: false },
    fill: { opacity: .9 },
    colors: ['#778E69']
  };

  colDefs: ColDef[] = [
    { headerName: 'ID', field: 'reservation_id', width: 90 },
    { headerName: 'Cliente', valueGetter: p => p.data?.user?.full_name || `Usuario ${p.data?.user_id}`, flex: 1 },
    { headerName: 'Habitación', valueGetter: p => p.data?.room?.number || `#${p.data?.room_id}`, width: 120 },
    { headerName: 'Check-in', field: 'check_in', width: 120 },
    { headerName: 'Check-out', field: 'check_out', width: 120 },
    { headerName: 'Estado', field: 'status', width: 120 }
  ];

  ngOnInit() {
    if (!this.isBrowser) return;

    // Use hotel resolver to get hotel ID
    this.hotelResolver.resolveHotelId().subscribe({
      next: (hotelId) => {
        if (hotelId) {
          this.currentHotelId = hotelId;
          this.loadForHotel(hotelId);
        } else {
          console.error('No se pudo resolver el hotelId para este operador');
        }
      },
      error: (e) => console.error('Error resolviendo hotelId', e)
    });
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.cdr.detectChanges();
      });
    }
  }

  /** Carga todo el dashboard para el hotel dado */
  private loadForHotel(hotelId: number) {
    // Cargar información del hotel
    this.hotelsApi.get(hotelId).subscribe({
      next: hotel => {
        this.currentHotel = hotel;
        this.cdr.detectChanges();

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
    if (!this.currentHotelId) return;
    
    this.incomeLoading = true;
    this.paymentApi.calculateIncomeByHotel(this.currentHotelId).pipe(
      finalize(() => {
        this.incomeLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: p => {
        this.incomeValue = `$${p[0]}`;
        this.incomeDelta = p[1];
      },
      error: err => {
        console.error('Error calculando ingresos', err);
        this.incomeValue = '$0';
        this.incomeDelta = 0;
      }
    });
  }

  calcReservations() {
    if (!this.currentHotelId) return;
    
    this.reservationsLoading = true;
    this.reservationApi.countByHotel(this.currentHotelId).pipe(
      finalize(() => {
        this.reservationsLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: p => {
        this.reservationValue = p[0];
        this.reservationDelta = p[1];
      },
      error: err => {
        console.error('Error contando reservas', err);
        this.reservationValue = 0;
        this.reservationDelta = 0;
      }
    });
  }

  private loadReservationsByRoomType() {
    if (!this.currentHotelId) return;
    
    this.chartDataLoaded = false;
    this.reservationApi.countByRoomTypeAndHotel(this.currentHotelId).subscribe({
      next: (map) => {
        const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);

        const categories = entries.map(([roomType]) => roomType ?? 'N/D');
        const data = entries.map(([, count]) => count ?? 0);

        this.chartOptions = {
          ...this.chartOptions,
          xaxis: { ...this.chartOptions.xaxis, categories },
          series: [{ name: 'Reservas', data }]
        };
        
        this.chartDataLoaded = true;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando reservas por tipo', err);
        this.chartOptions = {
          ...this.chartOptions,
          xaxis: { ...this.chartOptions.xaxis, categories: ['Sin datos'] },
          series: [{ name: 'Reservas', data: [0] }]
        };
        this.chartDataLoaded = true;
        this.cdr.detectChanges();
      }
    });
  }

  private loadReservationsForHotel() {
    if (!this.currentHotelId) return;
    
    this.reservationsTableLoading = true;
    this.reservationApi.getAllByHotel(this.currentHotelId).pipe(
      switchMap(reservations => {
        // Get unique user and room IDs
        const userIds = [...new Set(reservations.map(r => r.user_id))];
        const roomIds = [...new Set(reservations.map(r => r.room_id))];

        // Fetch all users and rooms in parallel
        return forkJoin({
          reservations: [reservations],
          users: userIds.length > 0 ? forkJoin(userIds.map(id => this.usersService.getById(id))) : [[]],
          rooms: roomIds.length > 0 ? forkJoin(roomIds.map(id => this.roomService.getById(id))) : [[]]
        });
      }),
      map(({ reservations, users, rooms }) => {
        // Create lookup maps
        const userMap = new Map(users.map(u => [u.user_id, u]));
        const roomMap = new Map(rooms.map(r => [r.room_id, r]));

        // Enrich reservations
        return reservations.map(res => ({
          ...res,
          user: userMap.get(res.user_id),
          room: roomMap.get(res.room_id)
        }));
      }),
      finalize(() => {
        this.reservationsTableLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (enrichedReservations) => {
        this.reservations = enrichedReservations;
      },
      error: (err) => {
        console.error('Error cargando reservas del hotel', err);
        this.reservations = [];
      }
    });
  }
}
