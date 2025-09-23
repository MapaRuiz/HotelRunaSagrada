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
  selector: 'app-client-dashboard',
  imports: [CommonModule, NgApexchartsModule, AgGridAngular],
  templateUrl: './client-dashboard.html',
  styleUrls: ['./client-dashboard.css']
})
export class ClientDashboardComponent implements OnInit {
  cards = [
    { label: 'Reservas activas', value: '2', delta: 1.0, icon: 'bi-calendar-check text-info' },
    { label: 'Historial', value: '12', delta: 0.0, icon: 'bi-clock-history text-warning' },
    { label: 'Gastos totales', value: '$1.240', delta: 2.5, icon: 'bi-wallet2 text-success' },
    { label: 'Puntos fidelidad', value: '300', delta: 5.0, icon: 'bi-gift text-primary' },
  ];

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: ChartOptions = {
    series: [{ name: 'Reservas', data: [1, 2, 0, 3, 2, 1, 2] }],
    chart: {
      type: 'bar' as ChartType,  // ✅ corregido
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
    { headerName: 'Reserva', field: 'id', width: 90 },
    { headerName: 'Hotel', field: 'hotel', flex: 1 },
    { headerName: 'Check-in', field: 'checkIn', width: 150 },
    { headerName: 'Check-out', field: 'checkOut', width: 150 },
    { headerName: 'Estado', field: 'status', width: 120 }
  ];

  reservations = [
    { id: 1, hotel: 'Hotel Andes', checkIn: '2025-09-20', checkOut: '2025-09-23', status: 'Activa' },
    { id: 2, hotel: 'Hotel Pacífico', checkIn: '2025-08-15', checkOut: '2025-08-18', status: 'Finalizada' }
  ];

  ngOnInit() {}
}
