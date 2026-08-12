import * as XLSX from 'xlsx';
import type { QuizQuestion } from './QuizBuilder';

// Excel column schema mirrors QuizBuilder's real QuizQuestion shape 1:1 — no invented
// fields (no "score"/"explanation": the real domain, AssignmentQuizDetail.QuestionsJson,
// doesn't support them). Parsing happens entirely client-side, matching the existing
// convention already established in this repo for bulk Excel import
// (school-admin/components/BulkImportModal.tsx uses the same xlsx + sheet_to_json
// approach with no dedicated backend "parse Excel" endpoint) — imported questions are
// merged into QuizBuilder's own `questions` state and go through the same Save
// (Create/Update Assignment) path as manually-typed ones, so backend authorization/
// validation on that existing endpoint applies unchanged.

export const QUIZ_EXCEL_HEADERS = [
  'Câu hỏi',
  'Loại câu hỏi',
  'Lựa chọn 1',
  'Lựa chọn 2',
  'Lựa chọn 3',
  'Lựa chọn 4',
  'Đáp án đúng',
] as const;

const TYPE_LABEL_TO_VALUE: Record<string, QuizQuestion['type']> = {
  'một đáp án': 'single_choice',
  'chọn 1 đáp án': 'single_choice',
  single_choice: 'single_choice',
  'nhiều đáp án': 'multiple_choice',
  'chọn nhiều đáp án': 'multiple_choice',
  multiple_choice: 'multiple_choice',
  'điền khuyết': 'fill_blank',
  fill_blank: 'fill_blank',
};

export interface QuizExcelRowError {
  row: number; // 1-based, matches the Excel row number as the teacher sees it (header = row 1)
  field: string;
  message: string;
}

export interface QuizExcelParseResult {
  questions: QuizQuestion[];
  rowStatuses: Array<{ row: number; question: QuizQuestion | null; errors: QuizExcelRowError[] }>;
  errors: QuizExcelRowError[];
  hasFatalError: boolean; // file itself unreadable / no header / zero data rows
}

function normalizeType(raw: unknown): QuizQuestion['type'] | null {
  const key = String(raw ?? '').trim().toLowerCase();
  return TYPE_LABEL_TO_VALUE[key] ?? null;
}

function makeId() {
  return Math.random().toString(36).substr(2, 9);
}

function parseRow(
  rawRow: Record<string, unknown>,
  rowNumber: number
): { question: QuizQuestion | null; errors: QuizExcelRowError[] } {
  const errors: QuizExcelRowError[] = [];

  const text = String(rawRow['Câu hỏi'] ?? '').trim();
  if (!text) {
    errors.push({ row: rowNumber, field: 'Câu hỏi', message: 'Nội dung câu hỏi không được để trống.' });
  }

  const type = normalizeType(rawRow['Loại câu hỏi']);
  if (!type) {
    errors.push({
      row: rowNumber,
      field: 'Loại câu hỏi',
      message: 'Loại câu hỏi phải là "Một đáp án", "Nhiều đáp án" hoặc "Điền khuyết".',
    });
  }

  const correctRaw = String(rawRow['Đáp án đúng'] ?? '').trim();

  if (type === 'fill_blank') {
    if (!correctRaw) {
      errors.push({ row: rowNumber, field: 'Đáp án đúng', message: 'Câu điền khuyết cần nhập đáp án đúng.' });
    }
    if (errors.length > 0) return { question: null, errors };
    return {
      question: { id: makeId(), text, type: 'fill_blank', options: [], correctAnswer: correctRaw },
      errors: [],
    };
  }

  if (type === 'single_choice' || type === 'multiple_choice') {
    const optionTexts = ['Lựa chọn 1', 'Lựa chọn 2', 'Lựa chọn 3', 'Lựa chọn 4']
      .map((key) => String(rawRow[key] ?? '').trim());
    const filledOptions = optionTexts
      .map((optText, index) => ({ index: index + 1, text: optText }))
      .filter((option) => option.text.length > 0);

    if (filledOptions.length < 2) {
      errors.push({ row: rowNumber, field: 'Lựa chọn', message: 'Cần ít nhất 2 lựa chọn không rỗng.' });
    }

    if (!correctRaw) {
      errors.push({ row: rowNumber, field: 'Đáp án đúng', message: 'Cần chỉ ra lựa chọn đúng (VD: 1 hoặc 1,3).' });
    }

    const correctIndexes = correctRaw
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 4);

    if (correctRaw && correctIndexes.length === 0) {
      errors.push({
        row: rowNumber,
        field: 'Đáp án đúng',
        message: 'Đáp án đúng phải là số thứ tự lựa chọn (1-4), cách nhau bởi dấu phẩy.',
      });
    }

    if (type === 'single_choice' && correctIndexes.length > 1) {
      errors.push({
        row: rowNumber,
        field: 'Đáp án đúng',
        message: 'Câu "Một đáp án" chỉ được có đúng 1 đáp án đúng.',
      });
    }

    const invalidCorrectRefs = correctIndexes.filter(
      (idx) => !filledOptions.some((option) => option.index === idx)
    );
    if (invalidCorrectRefs.length > 0) {
      errors.push({
        row: rowNumber,
        field: 'Đáp án đúng',
        message: `Đáp án đúng tham chiếu lựa chọn không tồn tại/rỗng: ${invalidCorrectRefs.join(', ')}.`,
      });
    }

    if (errors.length > 0) return { question: null, errors };

    return {
      question: {
        id: makeId(),
        text,
        type,
        options: filledOptions.map((option) => ({
          id: makeId(),
          text: option.text,
          isCorrect: correctIndexes.includes(option.index),
        })),
      },
      errors: [],
    };
  }

  return { question: null, errors };
}

export function parseQuizExcelWorkbook(data: ArrayBuffer): QuizExcelParseResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: 'array' });
  } catch {
    return {
      questions: [],
      rowStatuses: [],
      errors: [{ row: 0, field: 'File', message: 'Không thể đọc file. Vui lòng kiểm tra định dạng .xlsx.' }],
      hasFatalError: true,
    };
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = sheetName ? workbook.Sheets[sheetName] : null;
  if (!worksheet) {
    return {
      questions: [],
      rowStatuses: [],
      errors: [{ row: 0, field: 'File', message: 'File Excel không có sheet dữ liệu nào.' }],
      hasFatalError: true,
    };
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
  if (rawRows.length === 0) {
    return {
      questions: [],
      rowStatuses: [],
      errors: [{ row: 0, field: 'File', message: 'File Excel trống hoặc thiếu dòng tiêu đề đúng định dạng.' }],
      hasFatalError: true,
    };
  }

  const rowStatuses = rawRows.map((rawRow, index) => {
    const rowNumber = index + 2; // +1 for 1-based, +1 for header row
    const { question, errors } = parseRow(rawRow, rowNumber);
    return { row: rowNumber, question, errors };
  });

  const errors = rowStatuses.flatMap((status) => status.errors);
  const questions = rowStatuses
    .map((status) => status.question)
    .filter((question): question is QuizQuestion => question !== null);

  return { questions, rowStatuses, errors, hasFatalError: false };
}

export function downloadQuizExcelTemplate() {
  const sampleRows = [
    {
      'Câu hỏi': '1 + 1 = ?',
      'Loại câu hỏi': 'Một đáp án',
      'Lựa chọn 1': '2',
      'Lựa chọn 2': '3',
      'Lựa chọn 3': '',
      'Lựa chọn 4': '',
      'Đáp án đúng': '1',
    },
    {
      'Câu hỏi': 'Chọn các số chẵn',
      'Loại câu hỏi': 'Nhiều đáp án',
      'Lựa chọn 1': '2',
      'Lựa chọn 2': '3',
      'Lựa chọn 3': '4',
      'Lựa chọn 4': '5',
      'Đáp án đúng': '1,3',
    },
    {
      'Câu hỏi': 'Thủ đô của Việt Nam là ?',
      'Loại câu hỏi': 'Điền khuyết',
      'Lựa chọn 1': '',
      'Lựa chọn 2': '',
      'Lựa chọn 3': '',
      'Lựa chọn 4': '',
      'Đáp án đúng': 'Hà Nội',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: [...QUIZ_EXCEL_HEADERS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Câu hỏi mẫu');
  XLSX.writeFile(workbook, 'mau-import-cau-hoi-quiz.xlsx');
}
