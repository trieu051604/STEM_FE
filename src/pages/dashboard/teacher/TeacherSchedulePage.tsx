import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { TeacherPageHeader } from '@/components/Dashboard/teacher/TeacherPageHeader';
import { schedulesApi, ScheduleCalendarItem } from '@/services/dashboardApi';
import { ClassDetailDrawer } from '@/components/Dashboard/teacher/ClassDetailDrawer';
import { SLOTS, getSlotByTime } from '@/components/WeeklyScheduleGrid';

export const TeacherSchedulePage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<ScheduleCalendarItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Calculate week start (Monday) and end (Sunday)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  
  const fromDate = format(weekStart, 'yyyy-MM-dd');
  const toDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');

  const { data: scheduleItems, isLoading } = useQuery({
    queryKey: ['teacher-schedule', fromDate, toDate],
    queryFn: () => schedulesApi.getMySchedule({ fromDate, toDate }),
    staleTime: 5 * 60 * 1000,
  });

  const handlePrevWeek = () => setCurrentDate((prev) => addDays(prev, -7));
  const handleNextWeek = () => setCurrentDate((prev) => addDays(prev, 7));

  // Generate headers for Monday to Sunday
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Map items to grid [DayIndex][SlotIndex]
  // DayIndex: 0 (Mon) to 6 (Sun)
  // SlotIndex: 1 to 6
  const gridData = useMemo(() => {
    const grid: Record<number, Record<number, ScheduleCalendarItem>> = {};
    for (let day = 0; day < 7; day++) {
      grid[day] = {};
    }
    
    if (scheduleItems) {
      scheduleItems.forEach((item) => {
        // Parse date directly from the ISO string's date part (no timezone conversion) —
        // StartTime is stored/transmitted as literal wall-clock digits with a spurious
        // "Z" suffix (see WeeklyScheduleGrid.tsx), so converting via parseISO()/isSameDay()
        // rolls late-day times into the next local calendar day and misplaces the session.
        const datePart = item.start.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        const itemDate = new Date(year, month - 1, day);
        const dayIndex = weekDays.findIndex(d => isSameDay(d, itemDate));
        if (dayIndex !== -1) {
          const slot = getSlotByTime(item.start);
          // Check for collision
          if (grid[dayIndex][slot]) {
            console.warn('SCHEDULE COLLISION detected!', {
              existing: grid[dayIndex][slot],
              new: item,
              slot,
              dayIndex,
            });
          }
          grid[dayIndex][slot] = item;
        }
      });
    }
    console.log('DEBUG gridData:', JSON.stringify(grid, (key, value) => {
      if (value && typeof value === 'object' && 'start' in value) {
        return { id: value.id, start: value.start, end: value.end, classCode: value.classCode };
      }
      return value;
    }, 2));
    return grid;
  }, [scheduleItems, weekDays]);

  // Use first 4 slots (Tiết 1-4) only
  const slots = SLOTS.slice(0, 4);

  const handleSessionClick = (session: ScheduleCalendarItem) => {
    setSelectedSession(session);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <TeacherPageHeader
          title="Lịch dạy hàng tuần"
          description="Quản lý và theo dõi lịch dạy các lớp của bạn."
        />
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden">
            <button
              onClick={handlePrevWeek}
              className="p-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 py-2 font-medium text-sm border-x border-border flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              {format(weekStart, 'dd/MM')} - {format(addDays(weekStart, 6), 'dd/MM/yyyy')}
            </div>
            <button
              onClick={handleNextWeek}
              className="p-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Đang tải lịch...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              {/* Header Row - Match Admin Style */}
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
                    {/* Slot Column - Match Admin Style */}
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
                      const isTodayCell = isSameDay(day, new Date());
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
