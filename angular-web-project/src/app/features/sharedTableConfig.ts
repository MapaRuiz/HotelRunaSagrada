import { AG_GRID_LOCALE_ES } from '@ag-grid-community/locale';
import { IDateFilterParams, ITextFilterParams, themeQuartz } from 'ag-grid-community';

export const TEXT_FILTER_CONFIG: ITextFilterParams = {
  filterOptions: ['contains', 'equals', 'notContains', 'startsWith'],
  maxNumConditions: 1,
};

export const DATE_FILTER_CONFIG: IDateFilterParams = {
  filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'],
  maxNumConditions: 1,
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

// utils/dateUtils.ts
export function formatDate(value?: string): string {
  if (!value) return 'Sin definir';
  try {
    const date = new Date(value + 'T12:00:00');
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}
