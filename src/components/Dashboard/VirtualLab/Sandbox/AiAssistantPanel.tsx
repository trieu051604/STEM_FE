import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles, Undo2, X } from 'lucide-react';
import { aiAssistantApi, type ProposedChange } from '@/services/aiAssistantApi';
import { AiProposedChangesPanel } from './AiProposedChangesPanel';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  changes?: ProposedChange[];
  isError?: boolean;
  usage?: { dailyUsedTokens: number; dailyLimitTokens: number } | null;
}

interface AiAssistantPanelProps {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
  currentCode: string;
  currentDiagramJson: string;
  onApplyChange: (change: ProposedChange) => void;
  onUndo: () => void;
  canUndo: boolean;
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Không gọi được AI Assistant lúc này, vui lòng thử lại sau.';
}

export const AiAssistantPanel = ({
  open,
  onClose,
  projectId,
  currentCode,
  currentDiagramJson,
  onApplyChange,
  onUndo,
  canUndo,
}: AiAssistantPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [changeStatus, setChangeStatus] = useState<Record<string, 'pending' | 'applied' | 'rejected'>>({});
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!open) return null;

  const statusFor = (changeId: string) => changeStatus[changeId] ?? 'pending';

  const handleApplyOne = (change: ProposedChange) => {
    onApplyChange(change);
    setChangeStatus((prev) => ({ ...prev, [change.id]: 'applied' }));
    setToast('Đã áp dụng thay đổi từ AI.');
  };

  const handleRejectOne = (change: ProposedChange) => {
    setChangeStatus((prev) => ({ ...prev, [change.id]: 'rejected' }));
  };

  const handleApplyAll = (changes: ProposedChange[]) => {
    changes.forEach((change) => onApplyChange(change));
    setChangeStatus((prev) => {
      const next = { ...prev };
      changes.forEach((change) => {
        next[change.id] = 'applied';
      });
      return next;
    });
    setToast('Đã áp dụng thay đổi từ AI.');
  };

  const handleRejectAll = (changes: ProposedChange[]) => {
    setChangeStatus((prev) => {
      const next = { ...prev };
      changes.forEach((change) => {
        next[change.id] = 'rejected';
      });
      return next;
    });
  };

  const handleSend = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || isSending || !projectId) return;

    const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setIsSending(true);

    try {
      const response = await aiAssistantApi.assist(projectId, {
        prompt: trimmed,
        currentCode,
        currentDiagramJson,
      });

      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: response.answer || (response.success ? '(Không có nội dung trả lời.)' : 'Đã có lỗi xảy ra.'),
        changes: response.success ? response.proposedChanges : [],
        isError: !response.success,
        usage: response.usage
          ? { dailyUsedTokens: response.usage.dailyUsedTokens, dailyLimitTokens: response.usage.dailyLimitTokens }
          : null,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', text: getErrorMessage(error), isError: true },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-end bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md h-full max-h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-[#0f4c5c]">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5" />
            <div>
              <h2 className="text-sm font-bold">AI Assistant</h2>
              <p className="text-[11px] text-cyan-100">
                AI chỉ đề xuất — mọi thay đổi cần bạn bấm "Áp dụng" mới có hiệu lực.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {canUndo && (
              <button
                type="button"
                onClick={onUndo}
                title="Hoàn tác thay đổi AI vừa áp dụng"
                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Hoàn tác
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground pt-10 px-4">
              <Bot className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Hỏi AI về code hoặc sơ đồ mạch đang mở. AI sẽ đề xuất thay đổi, bạn xem trước rồi mới bấm Áp dụng.
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  message.role === 'user'
                    ? 'bg-[#0f4c5c] text-white'
                    : message.isError
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-white border border-border text-foreground'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.changes && message.changes.length > 0 && (
                  <AiProposedChangesPanel
                    changes={message.changes}
                    currentCode={currentCode}
                    statusFor={statusFor}
                    onApplyOne={handleApplyOne}
                    onRejectOne={handleRejectOne}
                    onApplyAll={handleApplyAll}
                    onRejectAll={handleRejectAll}
                  />
                )}
                {message.usage && (
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Token hôm nay: {message.usage.dailyUsedTokens}/{message.usage.dailyLimitTokens}
                  </p>
                )}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-3.5 py-2.5 bg-white border border-border flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                AI đang suy nghĩ...
              </div>
            </div>
          )}
        </div>

        {toast && (
          <div className="mx-4 mb-2 rounded-lg bg-emerald-600 text-white text-xs font-bold px-3 py-2 text-center shrink-0">
            {toast}
          </div>
        )}

        <div className="p-3 border-t border-border shrink-0 flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Hỏi AI về code/sơ đồ mạch..."
            disabled={isSending || !projectId}
            className="flex-1 rounded-full border border-border px-4 py-2 text-sm outline-none focus:border-[#0f4c5c] disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={isSending || !prompt.trim() || !projectId}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#0f4c5c] text-white disabled:opacity-40 hover:bg-[#0a3540] transition-colors shrink-0"
            aria-label="Gửi"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
