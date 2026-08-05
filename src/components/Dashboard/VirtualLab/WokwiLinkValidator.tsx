import { type ChangeEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ValidateWokwiProjectResponse } from '@/services/dashboardApi';

interface WokwiLinkValidatorProps {
  value: string;
  onChange: (val: string) => void;
  onValidChange: (isValid: boolean) => void;
  onValidate: (value: string) => Promise<ValidateWokwiProjectResponse>;
  onValidationResult?: (result: ValidateWokwiProjectResponse | null) => void;
  initiallyValid?: boolean;
}

export const WokwiLinkValidator = ({
  value,
  onChange,
  onValidChange,
  onValidate,
  onValidationResult,
  initiallyValid,
}: WokwiLinkValidatorProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>(
    initiallyValid ? 'valid' : 'idle'
  );
  const [message, setMessage] = useState(
    initiallyValid ? 'Project hợp lệ — sẵn sàng lưu' : ''
  );

  const handleCheck = async () => {
    if (!value.trim()) {
      setStatus('invalid');
      setMessage('Vui lòng nhập Link hoặc ID dự án Wokwi');
      onValidChange(false);
      onValidationResult?.(null);
      return;
    }

    setIsChecking(true);
    setStatus('idle');
    setMessage('');

    try {
      const result = await onValidate(value);
      setStatus(result.isValid ? 'valid' : 'invalid');
      setMessage(result.message || (result.isValid ? 'Project hợp lệ — sẵn sàng lưu' : 'Link Wokwi không hợp lệ.'));
      onValidChange(result.isValid);
      onValidationResult?.(result);
    } catch (error) {
      setStatus('invalid');
      setMessage('Không kiểm tra được link Wokwi. Vui lòng thử lại.');
      onValidChange(false);
      onValidationResult?.(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
    if (status !== 'idle') {
      setStatus('idle');
      setMessage('');
      onValidChange(false);
      onValidationResult?.(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          placeholder="VD: https://wokwi.com/projects/123456789..."
          value={value}
          onChange={handleChange}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            status === 'valid' && 'border-green-500 focus-visible:ring-green-500',
            status === 'invalid' && 'border-red-500 focus-visible:ring-red-500'
          )}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleCheck}
          disabled={isChecking || !value.trim()}
          className="shrink-0"
        >
          {isChecking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Kiểm tra link
        </Button>
      </div>

      {status === 'valid' && (
        <div className="flex items-center gap-1.5 text-sm font-medium text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          {message || 'Project hợp lệ — sẵn sàng lưu'}
        </div>
      )}

      {status === 'invalid' && (
        <div className="flex items-center gap-1.5 text-sm font-medium text-red-500">
          <XCircle className="w-4 h-4" />
          {message}
        </div>
      )}
    </div>
  );
};
