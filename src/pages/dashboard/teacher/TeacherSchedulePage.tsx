import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, addDays, parseISO, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
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
        const itemDate = parseISO(item.start);
        // Find which day of the week it matches
        const dayIndex = weekDays.findIndex(d => isSameDay(d, itemDate));
        if (dayIndex !== -1) {
          const slot = getSlotByTime(item.start);
          grid[dayIndex][slot] = item;
        }
      });
    }
    return grid;
  }, [scheduleItems, weekDays]);

  // Use slots 1 to 6
  const slots = SLOTS.map(s => s.number);

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
              <CalendarIcon className="w-4 h-4 text-indigo-500" />
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
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="p-3 border-b border-r border-border bg-muted/30 w-24 text-center font-medium text-xs text-muted-foreground uppercase tracking-wider">
                    Ca học
                  </th>
                  {weekDays.map((day, i) => (
                    <th key={i} className={`p-3 border-b border-border bg-muted/10 text-center ${isSameDay(day, new Date()) ? 'bg-indigo-500/5' : ''}`}>
                      <div className={`font-semibold text-sm ${isSameDay(day, new Date()) ? 'text-indigo-500' : 'text-foreground'}`}>
                        {format(day, 'EEEE', { locale: vi })}
                      </div>
                      <div className={`text-xs mt-0.5 ${isSameDay(day, new Date()) ? 'text-indigo-400' : 'text-muted-foreground'}`}>
                        {format(day, 'dd/MM')}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map((slot) => (
                  <tr key={slot.number}>
                    <td className="p-3 border-b border-r border-border bg-muted/10 text-center">
                      <span className="text-sm font-medium text-foreground">{slot.name}</span>
                      <div className="text-xs text-muted-foreground mt-0.5">{slot.displayStart} - {slot.displayEnd}</div>
                    </td>
                    {weekDays.map((day, dayIndex) => {
                      const session = gridData[dayIndex][slot.number];
                      return (
                        <td key={dayIndex} className="p-2 border-b border-border border-r last:border-r-0 relative min-w-[140px] h-28 align-top">
                          {session ? (
                            <div
                              onClick={() => handleSessionClick(session)}
                              className="h-full bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2 cursor-pointer hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all flex flex-col justify-between group"
                            >
                              <div>
                                <div className="font-bold text-indigo-500 text-sm group-hover:underline">
                                  {session.classCode || session.title}
                                </div>
                                <div className="text-xs text-foreground/80 line-clamp-2 mt-1 font-medium">
                                  {session.className}
                                </div>
                              </div>
                              <div className="mt-2 text-[10px] text-muted-foreground flex flex-col gap-0.5">
                                <span>{session.start.includes('T') ? session.start.split('T')[1].substring(0, 5) : format(parseISO(session.start), 'HH:mm')} - {session.end.includes('T') ? session.end.split('T')[1].substring(0, 5) : format(parseISO(session.end), 'HH:mm')}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                              <span className="text-xl">—</span>
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
