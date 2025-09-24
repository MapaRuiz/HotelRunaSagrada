import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ActionButtonsParams } from './action-buttons-param';

@Component({
  selector: 'app-action-buttons-cell',
  imports: [],
  templateUrl: './action-buttons-cell.html',
  styleUrl: './action-buttons-cell.css'
})
export class ActionButtonsComponent<T>
  implements ICellRendererAngularComp
{
  params!: ActionButtonsParams<T>;

  agInit(params: ActionButtonsParams<T>): void {
    this.params = params;
  }
  refresh(): boolean { return false; }

  onEdit()   { this.params.onEdit(this.params.data as T); }
  onDelete() { this.params.onDelete(this.params.data as T); }
}
