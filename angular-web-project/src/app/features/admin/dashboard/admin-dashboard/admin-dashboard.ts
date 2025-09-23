import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule, ChartComponent, ApexAxisChartSeries, ApexChart, ApexXAxis,
  ApexDataLabels, ApexStroke, ApexGrid, ApexLegend, ApexFill
} from 'ng-apexcharts';
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

  hotels: Hotel[] = [];
  amenitiesCount = 0;

  cards = [
    { label:'Ingresos',   value:'$99.560', delta: 2.4,  icon:'bi-currency-dollar text-info' },
    { label:'Reservas',   value:'35',      delta:-1.2,  icon:'bi-bag-check text-warning' },
    { label:'Visitantes', value:'45.600',  delta:-0.8,  icon:'bi-people text-primary' },
    { label:'Utilidad',   value:'$60.450', delta: 3.2,  icon:'bi-graph-up text-success' },
  ];

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: ChartOptions = {
    series: [{ name: 'Reservas', data: [12, 18, 15, 22, 28, 31, 27] }],
    chart: { type: 'bar', height: 300, toolbar: { show: false } },
    xaxis: { categories: ['1','8','15','22','29','5','12'] },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2 },
    grid: { borderColor: '#e6e8e1' },
    legend: { show: false },
    fill: { opacity: .9 },
    colors: ['#778E69']
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
