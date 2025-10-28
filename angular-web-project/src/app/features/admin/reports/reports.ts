import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HotelsService } from '../../../services/hotels';
import { ReservationService } from '../../../services/reservation';
import { PaymentService } from '../../../services/payment';
import { ReservationServiceApi } from '../../../services/reservation-service';
import { Reservation } from '../../../model/reservation';
import { Hotel } from '../../../model/hotel';
import { ReservationService as ReservationServiceModel } from '../../../model/reservation-service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

interface ReportFilter {
  startDate: string;
  endDate: string;
  reportType: 'hotels' | 'reservations' | 'financial' | 'services';
  hotelId?: number;
}

interface ReportData {
  hotels?: Hotel[];
  reservations?: Reservation[];
  financial?: {
    totalIncome: number;
    totalReservations: number;
    averageRevenue: number;
  };
  services?: any[];
}

@Component({
  standalone: true,
  selector: 'app-admin-reports',
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportsComponent implements OnInit {
  private hotelsApi = inject(HotelsService);
  private reservationApi = inject(ReservationService);
  private paymentApi = inject(PaymentService);
  private reservationServiceApi = inject(ReservationServiceApi);

  loading = false;
  reportGenerated = false;
  exportSuccess = false;
  
  filter: ReportFilter = {
    startDate: '',
    endDate: '',
    reportType: 'hotels'
  };

  reportData: ReportData = {};
  hotels: Hotel[] = [];

  ngOnInit() {
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    this.filter.endDate = today.toISOString().split('T')[0];
    this.filter.startDate = thirtyDaysAgo.toISOString().split('T')[0];

    // Load hotels for filter
    this.hotelsApi.list().subscribe(h => this.hotels = h);
  }

  // Helper methods for template
  getTotalServicesCount(): number {
    if (!this.reportData.services) return 0;
    return this.reportData.services.reduce((sum: number, s: any) => sum + s.count, 0);
  }

  getTotalServicesRevenue(): number {
    if (!this.reportData.services) return 0;
    return this.reportData.services.reduce((sum: number, s: any) => sum + s.totalPrice, 0);
  }

  generateReport() {
    if (!this.filter.startDate || !this.filter.endDate) {
      alert('Por favor selecciona un rango de fechas');
      return;
    }

    this.loading = true;
    this.reportGenerated = false;
    this.reportData = {};

    switch (this.filter.reportType) {
      case 'hotels':
        this.generateHotelReport();
        break;
      case 'reservations':
        this.generateReservationReport();
        break;
      case 'financial':
        this.generateFinancialReport();
        break;
      case 'services':
        this.generateServicesReport();
        break;
    }
  }

  private generateHotelReport() {
    this.hotelsApi.list().subscribe({
      next: (hotels) => {
        this.reportData.hotels = hotels;
        this.loading = false;
        this.reportGenerated = true;
      },
      error: () => {
        this.loading = false;
        alert('Error generando reporte de hoteles');
      }
    });
  }

  private generateReservationReport() {
    this.reservationApi.getAll().subscribe({
      next: (reservations: Reservation[]) => {
        // Filter by date range
        const filtered = reservations.filter((r: Reservation) => {
          const checkIn = new Date(r.check_in);
          return checkIn >= new Date(this.filter.startDate) && 
                 checkIn <= new Date(this.filter.endDate);
        });
        
        this.reportData.reservations = filtered;
        this.loading = false;
        this.reportGenerated = true;
      },
      error: () => {
        this.loading = false;
        alert('Error generando reporte de reservas');
      }
    });
  }

  private generateFinancialReport() {
    this.paymentApi.calculateIncome().subscribe({
      next: (income) => {
        this.reservationApi.count().subscribe({
          next: (count) => {
            this.reportData.financial = {
              totalIncome: income[0],
              totalReservations: count[0],
              averageRevenue: income[0] / (count[0] || 1)
            };
            this.loading = false;
            this.reportGenerated = true;
          }
        });
      },
      error: () => {
        this.loading = false;
        alert('Error generando reporte financiero');
      }
    });
  }

  private generateServicesReport() {
    this.reservationServiceApi.list().subscribe({
      next: (services: ReservationServiceModel[]) => {
        // Filter by date range if services have dates
        const filtered = services.filter((s: ReservationServiceModel) => {
          if (!s.res_service_id) return true; // Include all if no id
          // You can add date filtering logic here if needed
          return true;
        });
        
        // Group by service offering and count
        const serviceCount = filtered.reduce((acc: any, service: ReservationServiceModel) => {
          const serviceId = service.service_id || 'N/D';
          const serviceName = service.service?.name || `Servicio ${serviceId}`;
          if (!acc[serviceName]) {
            acc[serviceName] = {
              name: serviceName,
              count: 0,
              totalPrice: 0
            };
          }
          acc[serviceName].count++;
          acc[serviceName].totalPrice += service.unit_price * service.qty || 0;
          return acc;
        }, {});

        // Convert to array and sort by count
        this.reportData.services = Object.values(serviceCount).sort((a: any, b: any) => b.count - a.count);
        this.loading = false;
        this.reportGenerated = true;
      },
      error: () => {
        this.loading = false;
        this.reportData.services = [];
        this.reportGenerated = true;
      }
    });
  }

  exportToPDF() {
    if (!this.reportGenerated) {
      alert('Por favor genera un reporte primero');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Hotel Runa Sagrada - Reporte', pageWidth / 2, 20, { align: 'center' });
    
    // Date range
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periodo: ${this.filter.startDate} a ${this.filter.endDate}`, pageWidth / 2, 28, { align: 'center' });
    
    let yPosition = 40;

    // Hotels Report
    if (this.filter.reportType === 'hotels' && this.reportData.hotels) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Reporte de Hoteles', 14, yPosition);
      yPosition += 10;

      const tableData = this.reportData.hotels.map(h => [
        h.hotel_id,
        h.name,
        `${h.latitude || '—'}, ${h.longitude || '—'}`,
        `${h.check_in_after || '—'} / ${h.check_out_before || '—'}`,
        (h.amenities?.length || 0).toString()
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['ID', 'Hotel', 'Ubicación', 'Check-in/out', 'Amenities']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [119, 142, 105] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
      doc.text(`Total de hoteles: ${this.reportData.hotels.length}`, 14, yPosition);
    }

    // Reservations Report
    if (this.filter.reportType === 'reservations' && this.reportData.reservations) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Reporte de Reservas', 14, yPosition);
      yPosition += 10;

      const tableData = this.reportData.reservations.map(r => [
        r.reservation_id,
        r.user_id,
        r.room_id,
        new Date(r.check_in).toLocaleDateString('es-ES'),
        new Date(r.check_out).toLocaleDateString('es-ES'),
        r.status
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['ID', 'Usuario', 'Habitación', 'Check-in', 'Check-out', 'Estado']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [119, 142, 105] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
      doc.text(`Total de reservas: ${this.reportData.reservations.length}`, 14, yPosition);
    }

    // Financial Report
    if (this.filter.reportType === 'financial' && this.reportData.financial) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Reporte Financiero', 14, yPosition);
      yPosition += 10;

      const tableData = [
        ['Ingresos Totales', `$${this.reportData.financial.totalIncome.toFixed(2)}`],
        ['Total Reservas', this.reportData.financial.totalReservations.toString()],
        ['Ingreso Promedio', `$${this.reportData.financial.averageRevenue.toFixed(2)}`]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Métrica', 'Valor']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [119, 142, 105] },
      });
    }

    // Services Report
    if (this.filter.reportType === 'services' && this.reportData.services) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Reporte de Servicios', 14, yPosition);
      yPosition += 10;

      const tableData = this.reportData.services.map((s: any) => [
        s.name,
        s.count.toString(),
        `$${s.totalPrice.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Servicio', 'Cantidad Solicitada', 'Ingreso Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [119, 142, 105] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
      const totalServices = this.reportData.services.reduce((sum: number, s: any) => sum + s.count, 0);
      const totalRevenue = this.reportData.services.reduce((sum: number, s: any) => sum + s.totalPrice, 0);
      doc.text(`Total servicios solicitados: ${totalServices} | Ingreso total: $${totalRevenue.toFixed(2)}`, 14, yPosition);
    }

    // Save PDF
    const fileName = `reporte_${this.filter.reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    // Show success message
    this.showExportSuccess();
  }

  async exportToExcel() {
    if (!this.reportGenerated) {
      alert('Por favor genera un reporte primero');
      return;
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Hotel Runa Sagrada';
    workbook.created = new Date();
    
    let sheetName = 'Reporte';
    const worksheet = workbook.addWorksheet(sheetName);

    // Add title and date range
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Hotel Runa Sagrada - Reporte';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF778E69' } };
    titleCell.alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:F2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Periodo: ${this.filter.startDate} a ${this.filter.endDate}`;
    dateCell.font = { size: 10, italic: true };
    dateCell.alignment = { horizontal: 'center' };

    // Add empty row
    worksheet.addRow([]);

    // Hotels Report
    if (this.filter.reportType === 'hotels' && this.reportData.hotels) {
      sheetName = 'Hoteles';
      worksheet.name = sheetName;
      
      // Add headers
      const headerRow = worksheet.addRow(['ID', 'Nombre', 'Latitud', 'Longitud', 'Check-in', 'Check-out', 'Amenities', 'Descripción']);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF778E69' }
        };
        cell.alignment = { horizontal: 'center' };
      });

      // Add data
      this.reportData.hotels.forEach(h => {
        worksheet.addRow([
          h.hotel_id,
          h.name,
          h.latitude || '—',
          h.longitude || '—',
          h.check_in_after || '—',
          h.check_out_before || '—',
          h.amenities?.length || 0,
          h.description || '—'
        ]);
      });

      // Add total
      worksheet.addRow([]);
      const totalRow = worksheet.addRow(['Total de hoteles:', this.reportData.hotels.length]);
      totalRow.font = { bold: true };
    }

    // Reservations Report
    if (this.filter.reportType === 'reservations' && this.reportData.reservations) {
      sheetName = 'Reservas';
      worksheet.name = sheetName;
      
      // Add headers
      const headerRow = worksheet.addRow(['ID', 'Usuario ID', 'Hotel ID', 'Habitación ID', 'Check-in', 'Check-out', 'Estado', 'Creado']);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF778E69' }
        };
        cell.alignment = { horizontal: 'center' };
      });

      // Add data
      this.reportData.reservations.forEach(r => {
        worksheet.addRow([
          r.reservation_id,
          r.user_id,
          r.hotel_id,
          r.room_id,
          new Date(r.check_in).toLocaleDateString('es-ES'),
          new Date(r.check_out).toLocaleDateString('es-ES'),
          r.status,
          r.created_at ? new Date(r.created_at).toLocaleDateString('es-ES') : '—'
        ]);
      });

      // Add total
      worksheet.addRow([]);
      const totalRow = worksheet.addRow(['Total de reservas:', this.reportData.reservations.length]);
      totalRow.font = { bold: true };
    }

    // Financial Report
    if (this.filter.reportType === 'financial' && this.reportData.financial) {
      sheetName = 'Financiero';
      worksheet.name = sheetName;
      
      // Add headers
      const headerRow = worksheet.addRow(['Métrica', 'Valor']);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF778E69' }
        };
        cell.alignment = { horizontal: 'center' };
      });

      // Add data
      worksheet.addRow(['Ingresos Totales', `$${this.reportData.financial.totalIncome.toFixed(2)}`]);
      worksheet.addRow(['Total Reservas', this.reportData.financial.totalReservations]);
      worksheet.addRow(['Ingreso Promedio', `$${this.reportData.financial.averageRevenue.toFixed(2)}`]);
    }

    // Services Report
    if (this.filter.reportType === 'services' && this.reportData.services) {
      sheetName = 'Servicios';
      worksheet.name = sheetName;
      
      // Add headers
      const headerRow = worksheet.addRow(['Servicio', 'Cantidad Solicitada', 'Ingreso Total']);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF778E69' }
        };
        cell.alignment = { horizontal: 'center' };
      });

      // Add data
      this.reportData.services.forEach((s: any) => {
        worksheet.addRow([
          s.name,
          s.count,
          `$${s.totalPrice.toFixed(2)}`
        ]);
      });

      // Add totals
      worksheet.addRow([]);
      const totalServices = this.reportData.services.reduce((sum: number, s: any) => sum + s.count, 0);
      const totalRevenue = this.reportData.services.reduce((sum: number, s: any) => sum + s.totalPrice, 0);
      const totalRow = worksheet.addRow(['Total servicios:', totalServices, `$${totalRevenue.toFixed(2)}`]);
      totalRow.font = { bold: true };
    }

    // Auto-size columns
    worksheet.columns.forEach(column => {
      if (!column || !column.eachCell) return;
      let maxLength = 0;
      column.eachCell({ includeEmpty: false }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    });

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `reporte_${this.filter.reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
    
    // Show success message
    this.showExportSuccess();
  }

  private showExportSuccess() {
    this.exportSuccess = true;
    setTimeout(() => {
      this.exportSuccess = false;
    }, 3000);
  }

  resetReport() {
    this.reportGenerated = false;
    this.reportData = {};
  }
}
