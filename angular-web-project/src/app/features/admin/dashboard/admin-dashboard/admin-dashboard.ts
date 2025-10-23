import { Component, OnInit, inject, ViewChild, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  NgApexchartsModule, ChartComponent, ApexAxisChartSeries, ApexChart, ApexXAxis,
  ApexDataLabels, ApexStroke, ApexGrid, ApexLegend, ApexFill
} from 'ng-apexcharts';
import { HotelsService } from '../../../../services/hotels';
import { AmenitiesService } from '../../../../services/amenities';
import { Hotel } from '../../../../model/hotel';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { PaymentService } from '../../../../services/payment';
import { ReservationService } from '../../../../services/reservation';
import { UsersService } from '../../../../services/users';

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
  selector: 'app-admin-dashboard',
  imports: [CommonModule, NgApexchartsModule, AgGridAngular],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  private hotelsApi = inject(HotelsService);
  private amenitiesApi = inject(AmenitiesService);
  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private paymentApi = inject(PaymentService);
  private reservationApi = inject(ReservationService);
  private userService = inject(UsersService);

  hotels: Hotel[] = [];
  hotelsLoading = false;
  amenitiesCount = 0;

  incomeLoading = true;
  incomeValue = '$0';
  incomeDelta = 0;
  reservationValue = 0;
  reservationDelta = 0;
  usersValue = 0;
  usersDelta = 0;

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

  public amenitiesChart: ChartOptions = {
    series: [{ name: 'Amenities', data: [] }],
    chart: { type: 'bar', height: 300, toolbar: { show: false } },
    xaxis: { categories: [] },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2 },
    grid: { borderColor: '#e6e8e1' },
    legend: { show: false },
    fill: { opacity: .9 },
    colors: ['#5C7CFA']
  };

  colDefs: ColDef[] = [
    { headerName: 'ID', field: 'hotel_id', width: 90 },
    { headerName: 'Hotel', field: 'name', flex: 1 },
    { headerName: 'Check', valueGetter: p => `${p.data.check_in_after || '—'} / ${p.data.check_out_before || '—'}`, width: 150 },
    { headerName: 'Lat/Lon', valueGetter: p => `${p.data.latitude || '—'}, ${p.data.longitude || '—'}`, width: 200 },
    { headerName: 'Amenities', valueGetter: p => (p.data.amenities || []).length, width: 120 }
  ];

  ngOnInit() {
    this.loadHotels();
    this.amenitiesApi.list().subscribe(a => this.amenitiesCount = a.length);

    this.calcIncome();
    this.calcReservations();
    this.calcUsers();

    this.loadReservationsByRoomType();
    this.loadAmenitiesByHotel();

  }

  private loadHotels(attempt = 1) {
    this.hotelsLoading = true;
    this.hotelsApi.list().subscribe({
      next: (h) => {
        this.hotels = h;
        this.hotelsLoading = false;
      },
      error: (err) => {
        console.error('Error cargando hoteles (intento', attempt, '):', err);
        this.hotels = [];
        this.hotelsLoading = false;
        if (attempt < 3) {
          setTimeout(() => this.loadHotels(attempt + 1), 500);
        }
      }
    });
  }

  calcIncome() {
    this.incomeLoading = true;
    this.paymentApi.calculateIncome().subscribe(p => {
      this.incomeValue = `$${p[0]}`;
      this.incomeDelta = p[1];
      this.incomeLoading = false;
    });
  }

  calcReservations() {
    this.reservationApi.count().subscribe(p => {
      this.reservationValue = p[0];
      this.reservationDelta = p[1];
    });
  }

  calcUsers() {
    this.userService.summary().subscribe(p => {
      this.usersValue = p[0];
      this.usersDelta = p[1];
    });
  }

  private loadReservationsByRoomType() {
    this.reservationApi.countByRoomType().subscribe({
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

  private loadAmenitiesByHotel() {
    this.hotelsApi.amenitiesSummary().subscribe({
      next: (map) => {
        const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);

        const categories = entries.map(([hotelName]) => {
          if (!hotelName) return 'N/D';
          return hotelName.replace(/^Runa Sagrada\s*/i, '').trim();
        });
        const data = entries.map(([, count]) => count ?? 0);

        this.amenitiesChart = {
          ...this.amenitiesChart,
          xaxis: { ...this.amenitiesChart.xaxis, categories },
          series: [{ name: 'Amenities', data }]
        };
      },
      error: (err) => {
        console.error('Error cargando amenities por hotel', err);
        this.amenitiesChart = {
          ...this.amenitiesChart,
          xaxis: { ...this.amenitiesChart.xaxis, categories: ['—'] },
          series: [{ name: 'Amenities', data: [0] }]
        };
      }
    });
  }
}
