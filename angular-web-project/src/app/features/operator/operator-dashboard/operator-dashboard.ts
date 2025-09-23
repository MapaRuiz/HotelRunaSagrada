import { Component, OnInit, ViewChild } from '@angular/core';
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
  selector: 'app-operator-dashboard',
  imports: [CommonModule, NgApexchartsModule, AgGridAngular],
  templateUrl: './operator-dashboard.html',
  styleUrls: ['./operator-dashboard.css']
})
export class OperatorDashboardComponent implements OnInit {
  cards = [
    { label: 'Servicios activos', value: '5', delta: 2.1, icon: 'bi-hammer text-info' },
    { label: 'Pendientes', value: '3', delta: -1.0, icon: 'bi-hourglass-split text-warning' },
    { label: 'Completados', value: '18', delta: 0.5, icon: 'bi-check2-circle text-success' },
    { label: 'Calificación promedio', value: '4.7', delta: 0.2, icon: 'bi-star text-primary' },
  ];

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: ChartOptions = {
    series: [{ name: 'Servicios', data: [2, 3, 1, 4, 5, 3, 2] }],
    chart: {
      type: 'bar' as ChartType,
      height: 300,
      toolbar: { show: false }
    },
    xaxis: { categories: ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'] },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2 },
    grid: { borderColor: '#e6e8e1' },
    legend: { show: false },
    fill: { opacity: 0.9 },
    colors: ['#778E69']
  };

  colDefs: ColDef[] = [
    { headerName: 'Servicio', field: 'id', width: 90 },
    { headerName: 'Hotel', field: 'hotel', flex: 1 },
    { headerName: 'Estado', field: 'status', width: 150 },
    { headerName: 'Fecha', field: 'date', width: 150 },
  ];

  services = [
    { id: 101, hotel: 'Hotel Andes', status: 'Activo', date: '2025-09-22' },
    { id: 102, hotel: 'Hotel Pacífico', status: 'Pendiente', date: '2025-09-23' },
    { id: 103, hotel: 'Hotel Sierra', status: 'Completado', date: '2025-09-20' }
  ];

  ngOnInit() {}
}
