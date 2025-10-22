import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnChanges, Output, PLATFORM_ID, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridOptions, ModuleRegistry, AllCommunityModule, PaginationModule } from 'ag-grid-community';

import { ServiceSchedule } from '../../../../model/service-schedule';
import { formatDaysLabel } from '../service-schedule-form/service-schedule-form';
import { AG_GRID_LOCALE, gridTheme as sharedGridTheme } from '../../sharedTable';
import { ActionButtonsComponent } from '../../action-buttons-cell/action-buttons-cell';
import { ActionButtonsParams } from '../../action-buttons-cell/action-buttons-param';

@Component({
  selector: 'app-services-schedule-table',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './services-schedule-table.html',
  styleUrls: ['./services-schedule-table.css']
})
export class ServicesScheduleTable implements OnChanges {

  @Input() schedules: ServiceSchedule[] = [];
  @Input() showActions = true;
  @Output() editRequested = new EventEmitter<ServiceSchedule>();
  @Output() deleteRequested = new EventEmitter<ServiceSchedule>();

  search = '';
  rowData: ServiceSchedule[] = [];
  private gridApi?: GridApi<ServiceSchedule>;
  private isBrowser = false;
  readonly gridTheme: typeof sharedGridTheme = sharedGridTheme;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      ModuleRegistry.registerModules([AllCommunityModule, PaginationModule]);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schedules']) {
      this.rowData = [...(this.schedules ?? [])];
      if (this.gridApi) {
        this.gridApi.setGridOption('rowData', this.rowData);
      }
    }
    if (changes['showActions']) {
      this.updateColumnDefs();
    }
  }

  gridOptions: GridOptions<ServiceSchedule> = {
    localeText: AG_GRID_LOCALE,
    domLayout: 'autoHeight',
    suppressRowClickSelection: true,
    columnDefs: this.buildColumnDefs(),
    onGridReady: params => {
      this.gridApi = params.api;
      params.api.setGridOption('rowData', this.rowData);
      params.api.sizeColumnsToFit();
    }
  };

  onSearch(term: string): void {
    this.search = term;
    this.gridApi?.setGridOption('quickFilterText', term || undefined);
  }

  private updateColumnDefs(): void {
    const columnDefs = this.buildColumnDefs();
    this.gridOptions.columnDefs = columnDefs;
    if (this.gridApi) {
      this.gridApi.setGridOption('columnDefs', columnDefs);
    }
  }

  private buildColumnDefs(): ColDef<ServiceSchedule>[] {
    const columns: ColDef<ServiceSchedule>[] = [
      {
        headerName: 'ID',
        field: 'id',
        filter: 'agNumberColumnFilter',
        maxWidth: 110
      },
      {
        headerName: 'Días',
        field: 'days_of_week',
        valueGetter: params => formatDaysLabel(params.data?.days_of_week),
        filter: 'agTextColumnFilter'
      },
      {
        headerName: 'Inicio',
        field: 'start_time',
        filter: 'agTextColumnFilter',
        maxWidth: 140
      },
      {
        headerName: 'Fin',
        field: 'end_time',
        filter: 'agTextColumnFilter',
        maxWidth: 140
      },
      {
        headerName: 'Activo',
        field: 'active',
        filter: 'agTextColumnFilter',
        maxWidth: 130,
        valueGetter: params => (params.data?.active ? 'Sí' : 'No')
      }
    ];

    if (this.showActions) {
      columns.push({
        headerName: 'Acciones',
        minWidth: 200,
        cellRenderer: ActionButtonsComponent<ServiceSchedule>,
        cellRendererParams: {
          onEdit: (row: ServiceSchedule) => this.editRequested.emit(row),
          onDelete: (row: ServiceSchedule) => this.deleteRequested.emit(row)
        } satisfies Pick<ActionButtonsParams<ServiceSchedule>, 'onEdit' | 'onDelete'>
      } as ColDef<ServiceSchedule>);
    }

    return columns;
  }
}
