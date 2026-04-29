import * as XLSX from 'xlsx';

const ensureXlsxExtension = (name) => (name.toLowerCase().endsWith('.xlsx') ? name : `${name}.xlsx`);

export const exportArrayToExcel = ({ rows = [], sheetName = 'Datos', fileName = 'reporte.xlsx' } = {}) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return false;
  }

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, ensureXlsxExtension(fileName));
  return true;
};

export const exportGroupedSheetsToExcel = ({ sheets = [], fileName = 'reporte.xlsx' } = {}) => {
  if (!Array.isArray(sheets) || sheets.length === 0) {
    return false;
  }

  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet, index) => {
    const rows = Array.isArray(sheet?.rows) ? sheet.rows : [];
    if (!rows.length) return;
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const safeName = String(sheet?.name || `Hoja${index + 1}`).slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, safeName);
  });

  if (!workbook.SheetNames.length) return false;

  XLSX.writeFile(workbook, ensureXlsxExtension(fileName));
  return true;
};
