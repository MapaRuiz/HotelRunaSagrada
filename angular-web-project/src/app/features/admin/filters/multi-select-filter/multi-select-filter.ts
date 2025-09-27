import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AgFilterComponent } from 'ag-grid-angular';
import type {
  IFilterParams,
  IDoesFilterPassParams,
  IAfterGuiAttachedParams
} from 'ag-grid-community';

interface MultiSelectFilterParams<TData> extends IFilterParams<TData> {
  valueGetter: (item: TData) => string | null | undefined;
  title?: string;
  options?: string[];
}

@Component({
  selector: 'app-multi-select-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './multi-select-filter.html',
  styleUrls: ['./multi-select-filter.css']
})
export class MultiSelectFilterComponent<TData>
  implements AgFilterComponent
{
  private params!: MultiSelectFilterParams<TData>;
  selected = new Set<string>();
  options: string[] = [];
  title = 'Filtrar';
  search = '';
  filteredOptions: string[] = [];

  agInit(params: MultiSelectFilterParams<TData>): void {
    this.params = params;
    this.title = params.title ?? this.title;
    this.options = params.options ?? this.buildDistinctValues(params);
    this.filteredOptions = [...this.options];
  }

  isFilterActive(): boolean {
    return this.selected.size > 0;
  }

  doesFilterPass(params: IDoesFilterPassParams<TData>): boolean {
    if (!this.isFilterActive()) return true;
    const value = this.getValue(params.data);
    return value ? this.selected.has(value) : false;
  }

  getModel(): string[] | null {
    return this.isFilterActive() ? [...this.selected] : null;
  }

  setModel(model: string[] | null): void {
    this.selected = new Set(model ?? []);
  }

  afterGuiAttached(_params?: IAfterGuiAttachedParams): void {
    /* focus UI if needed */
  }

  onNewRowsLoaded(): void {
    if (this.params.options) return;
    this.options = this.buildDistinctValues(this.params);
    const term = this.search.trim().toLocaleLowerCase();
    this.filteredOptions = term
      ? this.options.filter(opt => opt.toLocaleLowerCase().includes(term))
      : [...this.options];
  }

  onSelectionChange(value: string, checked: boolean): void {
    checked ? this.selected.add(value) : this.selected.delete(value);
    this.params.filterChangedCallback();
  }

  onClear(): void {
    this.selected.clear();
    this.params.filterChangedCallback();
    this.params.api.onFilterChanged();
  }

  onApply(): void {
    this.params.api.onFilterChanged();
  }

private buildDistinctValues(params: MultiSelectFilterParams<TData>): string[] {
  const distinct = new Set<string>();

  params.api.forEachNode(node => {
    const value = this.getValue(node.data);
    if (value) {
      distinct.add(value);
    }
  });

  return Array.from(distinct).sort();
}

  private getValue(item: TData | undefined): string | undefined {
    if (!item) return undefined;
    return this.params.valueGetter(item) ?? undefined;
  }

  onSearch(): void {
    const term = this.search.trim().toLocaleLowerCase();
    this.filteredOptions = term
      ? this.options.filter(opt => opt.toLocaleLowerCase().includes(term))
      : [...this.options];
  }
}
