import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { schedulesApi, ScheduleCalendarItem } from '@/services/dashboardApi';

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun ... 6 = Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatShortDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${fmt(start)} - ${fmt(end)}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export const MyClassesPage = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState<ScheduleCalendarItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekStart = useMemo(() => addDays(startOfWeek(new Date()), weekOffset * 7), [weekOffset]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const days = useMemo(
    () => DAY_LABELS.map((name, index) => ({ name, date: addDays(weekStart, index) })),
    [weekStart]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const rangeEnd = new Date(weekEnd);
        rangeEnd.setHours(23, 59, 59, 999);
        const result = await schedulesApi.getMySchedule({
          fromDate: weekStart.toISOString(),
          toDate: rangeEnd.toISOString(),
        });
        if (!cancelled) setEvents(result);
      } catch {
        if (!cancelled) setError('Không thể tải lịch dạy. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [weekStart, weekEnd]);

  const getEventsForDay = (date: Date) =>
    events
      .filter((event) => event.start && isSameDay(new Date(event.start), date))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <div className="p-4 md:p-6 bg-white min-h-[calc(100vh-4rem)]">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0f4c5c] mb-1">Danh sách lớp phụ trách</h1>
          <p className="text-muted-foreground text-sm">Lịch dạy hàng tuần</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-slate-700 min-w-[140px] text-center">
            {formatShortDate(weekStart)} - {formatShortDate(weekEnd)}
          </span>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs font-medium text-[#0f4c5c] underline ml-1"
            >
              Tuần này
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="overflow-x-auto border border-border rounded-sm shadow-sm">
        <div className="grid grid-cols-7 min-w-[900px]">
          {days.map((day) => {
            const today = isSameDay(day.date, new Date());
            return (
              <div
                key={day.name}
                className={`border-b border-r border-[#8fa8e5] p-2 text-white last:border-r-0 ${
                  today ? 'bg-[#4f6fc4]' : 'bg-[#6b8cdb]'
                }`}
              >
                <div className="font-semibold text-sm">{day.name}</div>
                <div className="text-xs opacity-90">{formatShortDate(day.date)}</div>
              </div>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400 min-w-[900px]">
            <Loader2 className="w-5 h-5 animate-spin" />
            Đang tải lịch dạy...
          </div>
        ) : (
          <div className="grid grid-cols-7 min-w-[900px]">
            {days.map((day) => {
              const dayEvents = getEventsForDay(day.date);
              return (
                <div key={day.name} className="border-r border-border last:border-r-0 p-2 space-y-2 align-top min-h-[160px]">
                  {dayEvents.length === 0 ? (
                    <span className="text-slate-300 text-xs">-</span>
                  ) : (
                    dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-md p-2 text-xs text-white shadow-sm"
                        style={{ backgroundColor: event.color }}
                      >
                        <div className="font-semibold">{event.classCode}</div>
                        <div className="opacity-90 truncate">{event.className}</div>
                        <div className="opacity-90 mt-1">{formatTimeRange(event.start, event.end)}</div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
