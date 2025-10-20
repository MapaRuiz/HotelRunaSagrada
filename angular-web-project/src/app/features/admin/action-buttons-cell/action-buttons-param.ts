import { ICellRendererParams } from 'ag-grid-community';

export interface AdditionalButton<T> {
  label: string;
  action: (row: T) => void;
  class?: string;
}

export interface ActionButtonsParams<T> extends ICellRendererParams<T, void> {
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  editLabel?: string;
  deleteLabel?: string;
  additionalButtons?: AdditionalButton<T>[];
}
