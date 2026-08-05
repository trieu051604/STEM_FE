import { useState } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { scheduleApi, type ScheduleResponse } from '@/services/schoolAdminApi';

interface ScheduleCalendarProps {
  classId: number;
  onScheduleSelect?: (schedule: ScheduleResponse) => void;
}

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const SLOTS = [
  { number: 1, name: 'Tiết 1', start: '07:00', end: '09:15' },
  { number: 2, name: 'Tiết 2', start: '09:30', end: '11:45' },
  { number: 3, name: 'Tiết 3', start: '12:30', end: '14:45' },
  { number: 4, name: 'Tiết 4', start: '15:00', end: '17:15' },
];

const SLOT_COLORS = [
  'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
  'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
  'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
  'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
];

export function ScheduleCalendar({ classId, onScheduleSelect }: ScheduleCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const weekDays = DAYS.map((day, index) => ({
    name: day,
    date: addDays(currentWeekStart, index),
  }));

  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const getScheduleForSlot = (dayIndex: number, slotNumber: number) => {
    return schedules.find((s) => {
      const scheduleDay = new Date(s.scheduledDate).getDay();
      const mappedDay = scheduleDay === 0 ? 6 : scheduleDay - 1;
      return mappedDay === dayIndex && s.slotNumber === slotNumber;
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm hover:bg-muted rounded-lg transition-colors"
          >
            Hôm nay
          </button>
        </div>
        <span className="font-medium">
          {format(currentWeekStart, 'dd/MM')} -{' '}
          {format(addDays(currentWeekStart, 6), 'dd/MM/yyyy')}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="w-20 p-3 text-left text-sm font-medium text-muted-foreground">
                Tiết
              </th>
              {weekDays.map((day, index) => (
                <th
                  key={index}
                  className={`p-3 text-center text-sm font-medium ${
                    isSameDay(day.date, new Date())
                      ? 'bg-primary/10 text-primary'
                      : ''
                  }`}
                >
                  <div>{day.name}</div>
                  <div className="text-xs">{format(day.date, 'dd/MM')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slot, slotIndex) => (
              <tr key={slot.number} className="border-t border-border">
                <td className="p-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{slot.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {slot.start} - {slot.end}
                    </span>
                  </div>
                </td>
                {weekDays.map((day, dayIndex) => {
                  const schedule = getScheduleForSlot(dayIndex, slot.number);
                  return (
                    <td
                      key={dayIndex}
                      className="p-2"
                      onClick={() => schedule && onScheduleSelect?.(schedule)}
                    >
                      {schedule ? (
                        <div
                          className={`p-2 rounded-lg border ${
                            SLOT_COLORS[slotIndex]
                          } cursor-pointer hover:opacity-80 transition-opacity`}
                        >
                          <div className="flex items-center gap-1 text-xs font-medium">
                            <Clock className="h-3 w-3" />
                            {schedule.room}
                          </div>
                          {schedule.teacherName && (
                            <div className="flex items-center gap-1 text-xs mt-1">
                              <User className="h-3 w-3" />
                              {schedule.teacherName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-16" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
