import { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Modal } from './DataTable';
import { studentsApi } from '@/services/schoolAdminApi';

interface ImportedStudent {
  email: string;
  fullName: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
}

interface ImportResult {
  success: boolean;
  email: string;
  fullName: string;
  message?: string;
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkImportModal = ({ isOpen, onClose, onSuccess }: BulkImportModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportedStudent[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setResults([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: ImportedStudent[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          setError('File Excel trống hoặc không có dữ liệu');
          return;
        }

        const validData = jsonData.filter(row => row.fullName && row.email).map(row => {
          let dateOfBirth: string | undefined;
          if (row.dateOfBirth) {
            const rawDate = row.dateOfBirth as unknown;
            if (Object.prototype.toString.call(rawDate) === '[object Date]' && !isNaN((rawDate as Date).getTime())) {
              dateOfBirth = (rawDate as Date).toISOString().split('T')[0];
            } else if (typeof rawDate === 'number') {
              // Excel serial date number - convert to ISO date string
              const date = new Date(((rawDate as number) - 25569) * 86400 * 1000);
              dateOfBirth = date.toISOString().split('T')[0];
            } else {
              const dateStr = String(rawDate);
              // Try to parse various date formats
              const parsed = new Date(dateStr);
              if (!isNaN(parsed.getTime())) {
                dateOfBirth = parsed.toISOString().split('T')[0];
              } else {
                dateOfBirth = dateStr;
              }
            }
          }

          return {
            email: String(row.email || '').trim().toLowerCase(),
            fullName: String(row.fullName || '').trim(),
            phone: row.phone ? String(row.phone).trim() : undefined,
            gender: row.gender ? String(row.gender).trim() : undefined,
            dateOfBirth,
            address: row.address ? String(row.address).trim() : undefined,
          };
        });

        if (validData.length === 0) {
          setError('File phải có cột "email" và "fullName"');
          return;
        }

        // Check for duplicate emails within the file
        const emailCount: Record<string, number> = {};
        const phoneCount: Record<string, number> = {};
        const duplicates: string[] = [];
        const duplicatePhones: string[] = [];

        validData.forEach(student => {
          emailCount[student.email] = (emailCount[student.email] || 0) + 1;
          if (student.phone) {
            phoneCount[student.phone] = (phoneCount[student.phone] || 0) + 1;
          }
        });

        // Find duplicate emails
        Object.entries(emailCount).forEach(([email, count]) => {
          if (count > 1) {
            duplicates.push(`Email trùng lặp: ${email} (${count} lần)`);
          }
        });

        // Find duplicate phones
        Object.entries(phoneCount).forEach(([phone, count]) => {
          if (count > 1) {
            duplicatePhones.push(`SĐT trùng lặp: ${phone} (${count} lần)`);
          }
        });

        if (duplicates.length > 0 || duplicatePhones.length > 0) {
          const allDuplicates = [...duplicates, ...duplicatePhones];
          setError(`Phát hiện trùng lặp trong file:\n${allDuplicates.join('\n')}`);
          return;
        }

        setPreviewData(validData);
      } catch {
        setError('Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.');
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  }, []);

  const handleImport = async () => {
    if (previewData.length === 0) return;

    setImporting(true);
    setResults([]);

    try {
      const response = await studentsApi.createBulk(previewData);
      const resultsData = response.data?.data || [];
      setResults(resultsData);

      if (resultsData.length === 0) {
        setResults(previewData.map(s => ({
          success: false,
          email: s.email,
          fullName: s.fullName,
          message: 'Không có phản hồi từ server',
        })));
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Lỗi không xác định';
      setError(errorMessage);
      setResults(previewData.map(s => ({
        success: false,
        email: s.email,
        fullName: s.fullName,
        message: errorMessage,
      })));
    }

    setImporting(false);
  };

  // Auto close when all succeed
  useEffect(() => {
    if (results.length > 0 && results.every(r => r.success)) {
      const timer = setTimeout(() => {
        onSuccess();
        onClose();
        setFile(null);
        setPreviewData([]);
        setResults([]);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [results, onSuccess, onClose]);

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setResults([]);
    setError(null);
    onClose();
  };

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nhập học sinh từ Excel" size="xl">
      <div className="space-y-4">
        {!previewData.length && !results.length && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Kéo thả file Excel (.xlsx, .xls) hoặc click để chọn
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                File cần có các cột: email, fullName, phone, gender, dateOfBirth, address
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="excel-upload"
              />
              <label
                htmlFor="excel-upload"
                className="inline-flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer text-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Chọn file Excel
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        )}

        {file && previewData.length > 0 && !results.length && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {previewData.length} học sinh được tìm thấy
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => {
                setFile(null);
                setPreviewData([]);
              }}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="max-h-60 overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">STT</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Họ tên</th>
                    <th className="p-2 text-left">SĐT</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((student, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{student.email}</td>
                      <td className="p-2">{student.fullName}</td>
                      <td className="p-2">{student.phone || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Hủy
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? 'Đang nhập...' : `Nhập ${previewData.length} học sinh`}
              </Button>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm">{successCount} thành công</span>
              </div>
              {failCount > 0 && (
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm">{failCount} thất bại</span>
                </div>
              )}
            </div>

            <div className="max-h-60 overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">STT</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Họ tên</th>
                    <th className="p-2 text-left">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{result.email}</td>
                      <td className="p-2">{result.fullName}</td>
                      <td className="p-2">
                        {result.success ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" /> Thành công
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-4 h-4" /> {result.message}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={handleClose}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
