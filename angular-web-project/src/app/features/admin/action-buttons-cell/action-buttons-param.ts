import { ICellRendererParams } from 'ag-grid-community';

export interface ActionButtonsParams<T> extends ICellRendererParams<T, void> {
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
}