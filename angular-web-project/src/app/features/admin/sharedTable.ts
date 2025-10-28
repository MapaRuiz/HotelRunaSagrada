import { AG_GRID_LOCALE_ES } from '@ag-grid-community/locale';
import { GridApi } from 'ag-grid-community';
import { themeQuartz } from 'ag-grid-community';

const DEFAULT_DATE_LOCALE = 'es-ES';
const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

export const AG_GRID_LOCALE = {
  ...AG_GRID_LOCALE_ES,
  // override here if you want custom wording, e.g.
  // paginationPageSize: 'Filas por página',
};

export const gridTheme = themeQuartz.withParams({
  accentColor: '#778E69',
  backgroundColor: '#F2F3ED',
  borderColor: '#BCC399',
  borderRadius: 5,
  browserColorScheme: 'light',
  fontFamily: {
    googleFont: 'Lato',
  },
  fontSize: 14,
  headerBackgroundColor: '#151513',
  headerFontFamily: {
    googleFont: 'Quantico',
  },
  headerFontSize: 16,
  headerTextColor: '#BCC399',
  wrapperBorderRadius: 1,
  headerCellHoverBackgroundColor: 'rgba(119, 142, 105, 0.9)',
  headerCellMovingBackgroundColor: 'rgba(119, 142, 105, 0.9)',
});

// Shared pagination configuration for all admin tables
export const PAGINATION_CONFIG = {
  pagination: true,
  paginationPageSize: 5,
  paginationPageSizeSelector: [5, 10, 15, 20, 50],
  suppressPaginationPanel: false,
};

export function formatDisplayDate(
  dateInput?: string | Date,
  fallback = 'Sin información',
  locale: string = DEFAULT_DATE_LOCALE,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTIONS
): string {
  if (!dateInput) return fallback;

  try {
    const value = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput);
    if (Number.isNaN(value.getTime())) {
      return fallback;
    }
    return value.toLocaleDateString(locale, options);
  } catch {
    return fallback;
  }
}

export function updateResponsiveColumns(
  api: GridApi,
  columns: string[],
  shouldHide: boolean
): void {
  if (!api || columns.length === 0) return;

  // Verificar que la API no esté destruida
  const maybeDestroyed = (api as any).isDestroyed;
  if (typeof maybeDestroyed === 'function' && maybeDestroyed.call(api)) {
    return;
  }

  // setColumnsVisible espera: (keys, visible)
  // Si shouldHide = true, entonces visible = false
  api.setColumnsVisible(columns, !shouldHide);

  // Ajustar columnas después del cambio
  try {
    api.sizeColumnsToFit();
  } catch {}

  if (shouldHide) {
    api.resetRowHeights();
  }
}
