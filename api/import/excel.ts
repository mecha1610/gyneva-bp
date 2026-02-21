import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as XLSX from 'xlsx';
import { setCors, checkRateLimit, allowMethods, requireAuth } from '../_lib/middleware.js';
import { badRequest, serverError } from '../_lib/errors.js';
import { EXCEL_ROW_MAP, EXCEL_SCALAR_MAP, getExcelMonthColumns } from '../../lib/constants.js';
import type { BusinessPlanData } from '../../lib/types.js';

// Helper: get cell value from worksheet
function cellVal(ws: XLSX.WorkSheet, row: number, col: number): number {
  const addr = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
  const cell = ws[addr];
  return cell ? (typeof cell.v === 'number' ? cell.v : 0) : 0;
}

// Helper: get row of values at specified columns
function getRow(ws: XLSX.WorkSheet, row: number, cols: number[]): number[] {
  return cols.map(c => {
    const v = cellVal(ws, row, c);
    return typeof v === 'number' ? v : 0;
  });
}

function parseExcelWorksheet(ws: XLSX.WorkSheet): BusinessPlanData {
  const mCols = getExcelMonthColumns();

  const fteAdminBase = getRow(ws, EXCEL_ROW_MAP.fteAdmin, mCols);
  const fteAdminExtra = getRow(ws, EXCEL_ROW_MAP.fteAdminExtra, mCols);
  const fteAdmin = fteAdminBase.map((v, i) => v + (fteAdminExtra[i] || 0));

  return {
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
    const ws = workbook.Sheets['Backend'];

    if (!ws) {
      return badRequest(res, 'Sheet "Backend" not found in workbook');
    }

    const data = parseExcelWorksheet(ws);

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

    return res.status(200).json({
      data,
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
