import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as XLSX from 'xlsx';
import { setCors, checkRateLimit, allowMethods, requireAuth } from '../_lib/middleware';
import { badRequest, serverError } from '../_lib/errors';
import { EXCEL_ROW_MAP, EXCEL_SCALAR_MAP, getExcelMonthColumns } from '../../lib/constants';
import type { BusinessPlanData } from '../../lib/types';

// Helper: get cell value from worksheet
function cellVal(ws: XLSX.WorkSheet, row: number, col: number): number {
  const addr = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
  const cell = ws[addr];
  return cell ? (typeof cell.v === 'number' ? Math.round(cell.v) : 0) : 0;
}

// Helper: get row of values at specified columns
function getRow(ws: XLSX.WorkSheet, row: number, cols: number[]): number[] {
  return cols.map(c => {
    const v = cellVal(ws, row, c);
    return typeof v === 'number' ? v : 0;
  });
}

// Check if a row exists within worksheet range
function rowInRange(ws: XLSX.WorkSheet, row: number): boolean {
  const range = ws['!ref'];
  if (!range) return false;
  const decoded = XLSX.utils.decode_range(range);
  return (row - 1) >= decoded.s.r && (row - 1) <= decoded.e.r;
}

function parseExcelWorksheet(ws: XLSX.WorkSheet): { data: BusinessPlanData; warnings: string[] } {
  const warnings: string[] = [];
  const mCols = getExcelMonthColumns();

  // Validate critical rows exist in range
  const criticalRows = [
    { name: 'CA (chiffre d\'affaires)', row: EXCEL_ROW_MAP.ca },
    { name: 'Résultat', row: EXCEL_ROW_MAP.result },
    { name: 'Cashflow', row: EXCEL_ROW_MAP.cashflow },
  ];
  for (const { name, row } of criticalRows) {
    if (!rowInRange(ws, row)) {
      warnings.push(`Ligne critique "${name}" (row ${row}) hors de la plage du worksheet`);
    }
  }

  const fteAdminBase = getRow(ws, EXCEL_ROW_MAP.fteAdmin, mCols);
  const fteAdminExtra = getRow(ws, EXCEL_ROW_MAP.fteAdminExtra, mCols);
  const fteAdmin = fteAdminBase.map((v, i) => v + (fteAdminExtra[i] || 0));

  const data: BusinessPlanData = {
    ca: getRow(ws, EXCEL_ROW_MAP.ca, mCols),
    caAssoc: getRow(ws, EXCEL_ROW_MAP.caAssoc, mCols),
    caIndep: getRow(ws, EXCEL_ROW_MAP.caIndep, mCols),
    caInterne: getRow(ws, EXCEL_ROW_MAP.caInterne, mCols),
    caSage: getRow(ws, EXCEL_ROW_MAP.caSage, mCols),
    result: getRow(ws, EXCEL_ROW_MAP.result, mCols),
    cashflow: getRow(ws, EXCEL_ROW_MAP.cashflow, mCols),
    treso1m: getRow(ws, EXCEL_ROW_MAP.treso1m, mCols),
    treso3m: getRow(ws, EXCEL_ROW_MAP.treso3m, mCols),
    admin: getRow(ws, EXCEL_ROW_MAP.admin, mCols),
    opex: getRow(ws, EXCEL_ROW_MAP.opex, mCols),
    lab: getRow(ws, EXCEL_ROW_MAP.lab, mCols),
    fteAssoc: getRow(ws, EXCEL_ROW_MAP.fteAssoc, mCols),
    fteIndep: getRow(ws, EXCEL_ROW_MAP.fteIndep, mCols),
    fteInterne: getRow(ws, EXCEL_ROW_MAP.fteInterne, mCols),
    fteAdmin,
    fteTotal: getRow(ws, EXCEL_ROW_MAP.fteTotal, mCols),
    consultDay: cellVal(ws, EXCEL_SCALAR_MAP.consultDay.row, EXCEL_SCALAR_MAP.consultDay.col),
    fee: cellVal(ws, EXCEL_SCALAR_MAP.fee.row, EXCEL_SCALAR_MAP.fee.col),
    daysYear: cellVal(ws, EXCEL_SCALAR_MAP.daysYear.row, EXCEL_SCALAR_MAP.daysYear.col),
    revSpec: cellVal(ws, EXCEL_SCALAR_MAP.revSpec.row, EXCEL_SCALAR_MAP.revSpec.col),
    capex: cellVal(ws, EXCEL_SCALAR_MAP.capex.row, EXCEL_SCALAR_MAP.capex.col),
  };

  // Detect rows that are entirely zero
  const rowLabels: Record<string, string> = {
    ca: 'CA total', caAssoc: 'CA associés', caIndep: 'CA indépendants',
    caInterne: 'CA internes', result: 'Résultat', cashflow: 'Cashflow',
  };
  for (const [key, label] of Object.entries(rowLabels)) {
    const arr = data[key as keyof BusinessPlanData] as number[];
    if (Array.isArray(arr) && arr.every(v => v === 0)) {
      warnings.push(`"${label}" contient uniquement des zéros — vérifiez le fichier source`);
    }
  }

  return { data, warnings };
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (checkRateLimit(req, res)) return;
  if (!allowMethods(req, res, ['POST'])) return;

  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    // Expect base64-encoded file in body
    const { file, filename } = req.body as { file?: string; filename?: string };
    if (!file) {
      return badRequest(res, 'Missing file data (expected base64-encoded xlsx)');
    }

    const buffer = Buffer.from(file, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Find "Backend" sheet, or fallback to first sheet if only one exists
    let ws = workbook.Sheets['Backend'];
    let sheetUsed = 'Backend';

    if (!ws) {
      const sheetNames = workbook.SheetNames;
      if (sheetNames.length === 1) {
        ws = workbook.Sheets[sheetNames[0]];
        sheetUsed = sheetNames[0];
      } else {
        return badRequest(
          res,
          `Feuille "Backend" introuvable. Feuilles disponibles : ${sheetNames.map(s => `"${s}"`).join(', ')}`,
        );
      }
    }

    const { data, warnings } = parseExcelWorksheet(ws);

    // Validate: all arrays should have 36 elements
    const arrayKeys = [
      'ca', 'caAssoc', 'caIndep', 'caInterne', 'caSage',
      'result', 'cashflow', 'treso1m', 'treso3m',
      'admin', 'opex', 'lab',
      'fteAssoc', 'fteIndep', 'fteInterne', 'fteAdmin', 'fteTotal',
    ] as const;

    for (const key of arrayKeys) {
      if (data[key].length !== 36) {
        return badRequest(res, `Invalid data: ${key} has ${data[key].length} elements, expected 36`);
      }
    }

    if (sheetUsed !== 'Backend') {
      warnings.unshift(`Feuille "Backend" absente — utilisation de "${sheetUsed}" (seule feuille disponible)`);
    }

    return res.status(200).json({
      data,
      warnings,
      filename: filename || 'imported.xlsx',
      message: 'Excel parsed successfully',
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('not a valid')) {
      return badRequest(res, 'Invalid Excel file format');
    }
    return serverError(res, err);
  }
}
