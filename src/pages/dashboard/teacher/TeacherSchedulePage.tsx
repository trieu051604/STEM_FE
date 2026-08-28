import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, addDays, isSameDay, parseISO, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TeacherPageHeader } from '@/components/Dashboard/teacher/TeacherPageHeader';
import { schedulesApi, ScheduleCalendarItem } from '@/services/dashboardApi';
import { ClassDetailDrawer } from '@/components/Dashboard/teacher/ClassDetailDrawer';
import { SLOTS, getSlotByTime } from '@/components/WeeklyScheduleGrid';

export const TeacherSchedulePage = () => {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<ScheduleCalendarItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Calculate week start (Monday) and end (Sunday)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  
  // Calculate query dates based on view mode
  const { fromDate, toDate } = useMemo(() => {
    if (view === 'week') {
      return {
        fromDate: format(weekStart, 'yyyy-MM-dd'),
        toDate: format(addDays(weekStart, 6), 'yyyy-MM-dd'),
      };
    } else {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      // Include padding days from surrounding weeks
      const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const gridEnd = addDays(startOfWeek(monthEnd, { weekStartsOn: 1 }), 6);
      return {
        fromDate: format(gridStart, 'yyyy-MM-dd'),
        toDate: format(gridEnd, 'yyyy-MM-dd'),
      };
    }
  }, [view, weekStart, currentMonth]);

  const { data: scheduleItems, isLoading } = useQuery({
    queryKey: ['teacher-schedule', fromDate, toDate],
    queryFn: () => schedulesApi.getMySchedule({ fromDate, toDate }),
    staleTime: 5 * 60 * 1000,
  });

  const handlePrevWeek = () => setCurrentDate((prev) => addDays(prev, -7));
  const handleNextWeek = () => setCurrentDate((prev) => addDays(prev, 7));

  const handlePrevMonth = () => setCurrentMonth((prev) => addMonths(prev, -1));
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setCurrentMonth(today);
  };

  // Generate headers for Monday to Sunday
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Map items to grid [DayIndex][SlotIndex]
  const gridData = useMemo(() => {
    const grid: Record<number, Record<number, ScheduleCalendarItem>> = {};
    for (let day = 0; day < 7; day++) {
      grid[day] = {};
    }
    
    if (scheduleItems) {
      scheduleItems.forEach((item) => {
        const datePart = item.start.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        const itemDate = new Date(year, month - 1, day);
        const dayIndex = weekDays.findIndex(d => isSameDay(d, itemDate));
        if (dayIndex !== -1) {
          const slot = getSlotByTime(item.start);
          grid[dayIndex][slot] = item;
        }
      });
    }
    return grid;
  }, [scheduleItems, weekDays]);

  // Use first 4 slots (Tiết 1-4)
  const slots = SLOTS.slice(0, 4);

  const handleSessionClick = (session: ScheduleCalendarItem) => {
    setSelectedSession(session);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <TeacherPageHeader
          title={view === 'week' ? "Lịch dạy hàng tuần" : "Lịch dạy theo tháng"}
          description="Quản lý và theo dõi lịch dạy các lớp của bạn."
        />
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick jump to Today */}
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hôm nay
          </Button>

          {/* Navigation Controls */}
          <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden">
            <button
              onClick={view === 'week' ? handlePrevWeek : handlePrevMonth}
              className="p-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 py-2 font-medium text-sm border-x border-border flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              {view === 'week' ? (
                <span>{format(weekStart, 'dd/MM')} - {format(addDays(weekStart, 6), 'dd/MM/yyyy')}</span>
              ) : (
                <span className="capitalize">Tháng {format(currentMonth, 'MM/yyyy')}</span>
              )}
            </div>
            <button
              onClick={view === 'week' ? handleNextWeek : handleNextMonth}
              className="p-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* View Toggle (Tuần / Tháng) */}
          <div className="flex items-center bg-muted rounded-lg p-1 border border-border">
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === 'week' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === 'month' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tháng
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Đang tải lịch dạy...</span>
          </div>
        ) : view === 'week' ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              {/* Header Row */}
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <th className="sticky left-0 z-20 w-32 p-4 text-center font-bold border-r-2 border-blue-500 bg-blue-600">
                    <div className="flex flex-col items-center gap-1">
                      <Clock className="w-5 h-5" />
                      <span className="text-sm">THỜI GIAN</span>
                    </div>
                  </th>
                  {weekDays.map((day, i) => (
                    <th key={i} className={`p-3 text-center font-bold min-w-[130px] ${isSameDay(day, new Date()) ? 'bg-yellow-500/30 border-b-4 border-yellow-400' : ''}`}>
                      <div className="flex flex-col items-center leading-tight">
                        <span className="text-sm font-bold">{format(day, 'EEEE', { locale: vi })}</span>
                        <span className="text-2xl font-extrabold">{format(day, 'dd')}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.number} className="border-t-2 border-border hover:bg-muted/5 transition-colors">
                    {/* Slot Column */}
                    <td className="sticky left-0 z-20 p-3 text-center font-bold bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-r-2 border-border min-w-[140px]">
                      <div className="flex flex-col items-center gap-0.5 leading-tight">
                        <span className="text-base font-bold text-blue-700 dark:text-blue-300">Tiết {slot.number}</span>
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {slot.displayStart} - {slot.displayEnd}
                        </span>
                      </div>
                    </td>
                    {weekDays.map((day, dayIndex) => {
                      const session = gridData[dayIndex][slot.number];
                      const slotColor = getSlotColor(slot.number);
                      return (
                        <td key={dayIndex} className="p-2 border-b border-border border-r last:border-r-0 relative min-w-[140px] h-28 align-top">
                          {session ? (
                            <div
                              onClick={() => handleSessionClick(session)}
                              className={`h-full ${slotColor.bg} rounded-lg p-2 cursor-pointer hover:opacity-90 transition-opacity flex flex-col justify-between shadow-sm`}
                            >
                              <div>
                                <div className="font-bold text-sm text-white truncate">
                                  {session.classCode || session.title}
                                </div>
                                <div className="text-xs text-white/80 line-clamp-2 mt-1 font-medium">
                                  {session.className}
                                </div>
                              </div>
                              <div className="mt-2 text-[10px] text-white/70 flex flex-col gap-0.5">
                                <span>{session.start.includes('T') ? session.start.split('T')[1].substring(0, 5) : format(parseISO(session.start), 'HH:mm')} - {session.end.includes('T') ? session.end.split('T')[1].substring(0, 5) : format(parseISO(session.end), 'HH:mm')}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground/20">
                              <span className="text-lg">—</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <TeacherMonthView
            currentMonth={currentMonth}
            scheduleItems={scheduleItems || []}
            onSessionClick={handleSessionClick}
          />
        )}
      </div>

      <ClassDetailDrawer  
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        session={selectedSession}
      />
    </div>
  );
};

// Teacher Month View Component
function TeacherMonthView({
  currentMonth,
  scheduleItems,
  onSessionClick,
}: {
  currentMonth: Date;
  scheduleItems: ScheduleCalendarItem[];
  onSessionClick: (session: ScheduleCalendarItem) => void;
}) {
  const [year, month] = [currentMonth.getFullYear(), currentMonth.getMonth()];
  
  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  // Adjust for Monday start (T2 = 1, CN = 7)
  const startDayOfWeek = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;
  
  // Generate calendar days
  const calendarDays: (number | null)[] = [];
  
  // Add empty cells for days before first day of month
  for (let i = 1; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Group schedules by day number in current month
  const schedulesByDay = useMemo(() => {
    const map: Record<number, ScheduleCalendarItem[]> = {};
    scheduleItems.forEach((item) => {
      if (!item.start) return;
      const datePart = item.start.split('T')[0];
      const [y, m, d] = datePart.split('-').map(Number);
      if (y === year && m === month + 1) {
        if (!map[d]) map[d] = [];
        map[d].push(item);
      }
    });
    return map;
  }, [scheduleItems, year, month]);

  const weekDayHeaders = [
    { key: 1, label: 'Thứ Hai' },
    { key: 2, label: 'Thứ Ba' },
    { key: 3, label: 'Thứ Tư' },
    { key: 4, label: 'Thứ Năm' },
    { key: 5, label: 'Thứ Sáu' },
    { key: 6, label: 'Thứ Bảy' },
    { key: 7, label: 'Chủ Nhật' },
  ];

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-7 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        {weekDayHeaders.map((header) => (
          <div key={header.key} className="p-3 text-center font-bold text-sm">
            {header.label}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const daySessions = day ? (schedulesByDay[day] || []) : [];
          const isTodayCell = day === new Date().getDate() && 
                              month === new Date().getMonth() && 
                              year === new Date().getFullYear();
          
          return (
            <div
              key={index}
              className={`min-h-[120px] border-r border-b border-border p-2 transition-colors ${
                day === null ? 'bg-muted/20' : 'hover:bg-muted/40'
              } ${isTodayCell ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}`}
            >
              {day !== null && (
                <>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-bold ${
                      isTodayCell 
                        ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs' 
                        : 'text-foreground'
                    }`}>
                      {day}
                    </span>
                    {daySessions.length > 0 && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {daySessions.length} buổi
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {daySessions.map((session) => {
                      const slot = getSlotByTime(session.start);
                      const slotColor = getSlotColor(slot);
                      const startTime = session.start.includes('T') ? session.start.split('T')[1].substring(0, 5) : '';
                      return (
                        <div
                          key={session.id}
                          onClick={() => onSessionClick(session)}
                          className={`text-xs p-1.5 rounded-lg text-white cursor-pointer hover:opacity-90 transition-opacity shadow-sm ${slotColor.bg}`}
                          title={`${session.classCode} - ${session.className}`}
                        >
                          <div className="font-bold truncate leading-tight">
                            {session.classCode}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] opacity-90 mt-0.5">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span>T{slot} ({startTime})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper function to get slot colors matching WeeklyScheduleGrid
function getSlotColor(slotNumber: number) {
  const colors: Record<number, { bg: string; text: string; subtext: string }> = {
    1: { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', text: 'text-white', subtext: 'text-blue-50' },
    2: { bg: 'bg-gradient-to-br from-green-500 to-green-600', text: 'text-white', subtext: 'text-green-50' },
    3: { bg: 'bg-gradient-to-br from-purple-500 to-purple-600', text: 'text-white', subtext: 'text-purple-50' },
    4: { bg: 'bg-gradient-to-br from-orange-500 to-orange-600', text: 'text-white', subtext: 'text-orange-50' },
    5: { bg: 'bg-gradient-to-br from-red-500 to-red-600', text: 'text-white', subtext: 'text-red-50' },
    6: { bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600', text: 'text-white', subtext: 'text-indigo-50' },
  };
  return colors[slotNumber] || colors[1];
}

