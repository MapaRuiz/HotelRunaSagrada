import { AG_GRID_LOCALE_ES } from '@ag-grid-community/locale';
import { themeQuartz } from 'ag-grid-community';

export const AG_GRID_LOCALE = {
  ...AG_GRID_LOCALE_ES,
  // override here if you want custom wording, e.g.
  // paginationPageSize: 'Filas por página',
};

export const gridTheme = themeQuartz.withParams({
      accentColor: "#778E69",
      backgroundColor: "#F2F3ED",
      borderColor: "#BCC399",
      borderRadius: 5,
      browserColorScheme: "light",
      fontFamily: {
          googleFont: "Lato"
      },
      fontSize: 14,
      headerBackgroundColor: "#151513",
      headerFontFamily: {
          googleFont: "Quantico"
      },
      headerFontSize: 16,
      headerTextColor: "#BCC399",
      wrapperBorderRadius: 1,
      headerCellHoverBackgroundColor: "rgba(119, 142, 105, 0.9)",
      headerCellMovingBackgroundColor: "rgba(119, 142, 105, 0.9)"
  });