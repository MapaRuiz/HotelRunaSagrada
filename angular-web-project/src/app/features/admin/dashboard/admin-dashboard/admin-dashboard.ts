import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ChartComponent, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexStroke, ApexGrid, ApexLegend, ApexFill } from 'ng-apexcharts';
import { HotelsService } from '../../../../services/hotels';
import { AmenitiesService } from '../../../../services/amenities';
import { Hotel } from '../../../../model/hotel';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  grid: ApexGrid;
  legend: ApexLegend;
  fill: ApexFill;
};

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [CommonModule, NgApexchartsModule, AgGridAngular],
  template: `
  <!-- Cards -->
  <div class="row g-3">
    <div class="col-md-3" *ngFor="let c of cards">
      <div class="card p-3">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <div class="text-secondary small">{{c.label}}</div>
            <div class="fs-4 fw-bold">{{c.value}}</div>
            <div class="small" [class.text-success]="c.delta>=0" [class.text-danger]="c.delta<0">
              <i class="bi" [ngClass]="{'bi-arrow-up-right': c.delta>=0, 'bi-arrow-down-right': c.delta<0}"></i>
              {{c.delta | number:'1.0-1'}}%
            </div>
          </div>
          <i class="bi fs-2" [ngClass]="c.icon"></i>
        </div>
      </div>
    </div>
  </div>

  <!-- Chart + pie placeholder -->
  <div class="row g-3 mt-1">
    <div class="col-lg-8">
      <div class="card p-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div class="fw-semibold">Reservas (demo)</div>
          <div class="small text-secondary">Este mes</div>
        </div>
        <apx-chart #chart
          [series]="chartOptions.series" [chart]="chartOptions.chart"
          [xaxis]="chartOptions.xaxis" [dataLabels]="chartOptions.dataLabels"
          [stroke]="chartOptions.stroke" [grid]="chartOptions.grid"
          [legend]="chartOptions.legend" [fill]="chartOptions.fill">
        </apx-chart>
      </div>
    </div>
    <div class="col-lg-4">
      <div class="card p-3 h-100 d-flex">
        <div class="fw-semibold mb-2">Resumen</div>
        <div class="small text-secondary">Hoteles: {{hotels.length}}</div>
        <div class="small text-secondary">Amenities: {{amenitiesCount}}</div>
        <div class="mt-auto small text-muted">*Datos de demo para gráfico</div>
      </div>
    </div>
  </div>

  <!-- Tabla -->
  <div class="card p-3 mt-3">
    <div class="d-flex justify-content-between align-items-center mb-2">
      <div class="fw-semibold">Hoteles recientes</div>
      <a routerLink="/admin/hotels" class="btn btn-sm btn-outline-light">Ver todos</a>
    </div>

    <ag-grid-angular class="ag-theme-quartz" style="width:100%; height:360px;"
      [rowData]="hotels" [columnDefs]="colDefs" [rowHeight]="46">
    </ag-grid-angular>
  </div>
  `,
  styles: [`.ag-theme-quartz { --ag-foreground-color: #161718ff; --ag-background-color: #d5d8deff; --ag-header-background-color:#0f1524; --ag-border-color:#1f2937; }`]
})
export class AdminDashboardComponent implements OnInit {
  private hotelsApi = inject(HotelsService);
  private amenitiesApi = inject(AmenitiesService);

  hotels: Hotel[] = [];
  amenitiesCount = 0;

  cards = [
    { label:'Ingresos', value:'$99.560', delta:2.4, icon:'bi-currency-dollar text-info' },
    { label:'Reservas', value:'35', delta:-1.2, icon:'bi-bag-check text-warning' },
    { label:'Visitantes', value:'45.600', delta:-0.8, icon:'bi-people text-primary' },
    { label:'Utilidad', value:'$60.450', delta:3.2, icon:'bi-graph-up text-success' },
  ];

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: ChartOptions = {
    series: [{ name: 'Reservas', data: [12, 18, 15, 22, 28, 31, 27] }],
    chart: { type: 'bar', height: 300, toolbar: { show: false } },
    xaxis: { categories: ['1','8','15','22','29','5','12'] },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2 },
    grid: { borderColor: '#1f2937' },
    legend: { show: false },
    fill: { opacity: .9 }
  };

  colDefs: ColDef[] = [
    { headerName: 'ID', field: 'hotel_id', width: 90 },
    { headerName: 'Hotel', field: 'name', flex: 1 },
    { headerName: 'Check', valueGetter: p => `${p.data.check_in_after || '—'} / ${p.data.check_out_before || '—'}`, width: 150 },
    { headerName: 'Lat/Lon', valueGetter: p => `${p.data.latitude || '—'}, ${p.data.longitude || '—'}`, width: 200 },
    { headerName: 'Amenities', valueGetter: p => (p.data.amenities || []).length, width: 120 }
  ];

  ngOnInit() {
    this.hotelsApi.list().subscribe(h => this.hotels = h);
    this.amenitiesApi.list().subscribe(a => this.amenitiesCount = a.length);
  }
}
