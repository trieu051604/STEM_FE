import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { scheduleApi, type ScheduleResponse, type ScheduleConflictInfo, type TeacherConflictInfo } from '@/services/schoolAdminApi';

interface ClassInfo {
  id: number;
  classCode: string;
  className: string;
}

interface WeeklyScheduleGridProps {
  classId?: number;
  schedules?: ScheduleResponse[];
  classInfo?: ClassInfo;
  isAdmin?: boolean;
  onScheduleChange?: () => void | Promise<void> | ((options?: any) => Promise<any>);
}

// Slot definitions - times are LOCAL (stored as-is from DB)
const SLOTS = [
  { number: 1, name: 'Tiết 1', start: '07:00', end: '09:15', displayStart: '07:00', displayEnd: '09:15', color: 'from-blue-500 to-blue-600', bgDark: 'dark:from-blue-600 dark:to-blue-700' },
  { number: 2, name: 'Tiết 2', start: '09:30', end: '11:45', displayStart: '09:30', displayEnd: '11:45', color: 'from-green-500 to-green-600', bgDark: 'dark:from-green-600 dark:to-green-700' },
  { number: 3, name: 'Tiết 3', start: '12:30', end: '14:45', displayStart: '12:30', displayEnd: '14:45', color: 'from-purple-500 to-purple-600', bgDark: 'dark:from-purple-600 dark:to-purple-700' },
  { number: 4, name: 'Tiết 4', start: '15:00', end: '17:15', displayStart: '15:00', displayEnd: '17:15', color: 'from-orange-500 to-orange-600', bgDark: 'dark:from-orange-600 dark:to-orange-700' },
];

// Monday to Friday only (T2-T6)
const DAYS_OF_WEEK = [
  { key: 1, short: 'T2', full: 'Thứ Hai', fullEn: 'Monday' },
  { key: 2, short: 'T3', full: 'Thứ Ba', fullEn: 'Tuesday' },
  { key: 3, short: 'T4', full: 'Thứ Tư', fullEn: 'Wednesday' },
  { key: 4, short: 'T5', full: 'Thứ Năm', fullEn: 'Thursday' },
  { key: 5, short: 'T6', full: 'Thứ Sáu', fullEn: 'Friday' },
  { key: 6, short: 'T7', full: 'Thứ Bảy', fullEn: 'Saturday' },
  { key: 0, short: 'CN', full: 'CN', fullEn: 'Sunday' },
];

export function WeeklyScheduleGrid({ classId, schedules: initialSchedules, classInfo, isAdmin = false, onScheduleChange }: WeeklyScheduleGridProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [schedules, setSchedules] = useState<ScheduleResponse[]>(initialSchedules || []);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleResponse | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; slot: typeof SLOTS[0] } | null>(null);
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ScheduleConflictInfo[]>([]);
  const [teacherConflicts, setTeacherConflicts] = useState<TeacherConflictInfo[]>([]);

  // Fetch schedules when week changes or classId changes
  useEffect(() => {
    if (classId) {
      fetchSchedules();
    }
  }, [classId, currentWeekStart]);

  // Set initial schedules only when not loading (not undefined)
  useEffect(() => {
    if (initialSchedules && initialSchedules.length > 0) {
      setSchedules(initialSchedules);
    }
  }, [initialSchedules]);

  const fetchSchedules = async () => {
    if (!classId) return;

    try {
      setLoading(true);
      const data = await scheduleApi.getByClassId(classId);
      setSchedules(data);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const notifyScheduleChange = async () => {
    try {
      if (onScheduleChange) {
        await onScheduleChange();
      }
    } catch (error) {
      console.error('Failed to refresh schedule data:', error);
    }
  };

// Sort slots by start time for display order
const SORTED_SLOTS = [...SLOTS].sort((a, b) => a.start.localeCompare(b.start));

// Generate week days
const weekDays = useMemo(() => {
  return DAYS_OF_WEEK.map((day, index) => ({
    ...day,
    date: addDays(currentWeekStart, index),
  }));
}, [currentWeekStart]);

// Group schedules by day and slot
const scheduleGrid = useMemo(() => {
  const grid: Record<number, Record<number, ScheduleResponse[]>> = {};

  // Initialize grid with sorted slots
  DAYS_OF_WEEK.forEach(day => {
    grid[day.key] = {};
    SORTED_SLOTS.forEach(slot => {
      grid[day.key][slot.number] = [];
    });
  });

  // Calculate week boundaries (use local time for week boundaries since currentWeekStart is local)
  const weekStart = new Date(currentWeekStart);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Fill in schedules (only for current week)
  schedules.forEach(schedule => {
    // Skip if startTime is undefined
    if (!schedule.startTime) return;
    
    // Parse time directly from string to avoid timezone conversion
    const timePart = schedule.startTime.split('T')[1];
    const scheduleTime = timePart?.substring(0, 5) || ''; // "HH:mm"

    // Parse date directly from string (use local date components)
    const datePart = schedule.startTime.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    const scheduleDate = new Date(year, month - 1, day);

    // Filter: Only show schedules in the current week
    const scheduleDayOfWeek = scheduleDate.getDay();
    const adjustedDay = scheduleDayOfWeek === 0 ? 7 : scheduleDayOfWeek;

    if (scheduleDate.getTime() < weekStart.getTime() || scheduleDate.getTime() >= weekEnd.getTime()) return;

    // Find matching slot (time is already local)
    const matchingSlot = SORTED_SLOTS.find(slot => {
      return scheduleTime >= slot.start && scheduleTime < slot.end;
    });

    if (matchingSlot && grid[adjustedDay]) {
      grid[adjustedDay][matchingSlot.number].push(schedule);
    }
  });

  return grid;
}, [schedules, currentWeekStart]);

  const goToPreviousWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handleCellClick = (day: typeof DAYS_OF_WEEK[0], slot: typeof SLOTS[0]) => {
    if (!isAdmin) return;

    setSelectedSlot({ day: day.key, slot });
    setFormData({
      startTime: slot.displayStart,
      endTime: slot.displayEnd,
    });
    setError(null);
    setShowAddModal(true);
  };

  const handleScheduleClick = (schedule: ScheduleResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSchedule(schedule);

    // Parse time directly (already local)
    const startTimeStr = schedule.startTime || '';
    const endTimeStr = schedule.endTime || '';
    const scheduleTime = startTimeStr.split('T')[1]?.substring(0, 5) || '';

    // Find matching slot
    const matchingSlot = SLOTS.find(slot => {
      return scheduleTime >= slot.start && scheduleTime < slot.end;
    });

    // Use slot display times for form
    setFormData({
      startTime: matchingSlot?.displayStart || startTimeStr.split('T')[1]?.substring(0, 5) || '',
      endTime: matchingSlot?.displayEnd || endTimeStr.split('T')[1]?.substring(0, 5) || '',
    });

    if (isAdmin) {
      setShowEditModal(true);
    }
  };

  const handleCreateSchedule = async () => {
    if (!classId || !selectedSlot || !formData.startTime || !formData.endTime) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const selectedDay = weekDays.find(d => d.key === selectedSlot.day);
      if (!selectedDay) return;

      const startDateTime = `${format(selectedDay.date, 'yyyy-MM-dd')}T${formData.startTime}:00`;
      const endDateTime = `${format(selectedDay.date, 'yyyy-MM-dd')}T${formData.endTime}:00`;

      const response = await scheduleApi.create({
        classId,
        startTime: startDateTime,
        endTime: endDateTime,
      });

      setSchedules([...schedules, response.schedule]);
      setShowAddModal(false);

      // Show warning if there are conflicts
      if (response.conflicts && response.conflicts.length > 0) {
        setConflicts(response.conflicts);
      } else {
        setConflicts([]);
      }

      // Show warning if there are teacher conflicts
      if (response.teacherConflicts && response.teacherConflicts.length > 0) {
        setTeacherConflicts(response.teacherConflicts);
        const classCodes = response.teacherConflicts.map(c => c.conflictingClassCode).join(', ');
        const teacherWarning = `Cảnh báo: Giáo viên trùng lịch với lớp ${classCodes}!`;
        setError(teacherWarning);
        setShowEditModal(true);
      } else {
        setTeacherConflicts([]);
        if (response.conflicts && response.conflicts.length > 0) {
          const conflictNames = response.conflicts.slice(0, 3).map(c => c.studentName).join(', ');
          const moreText = response.conflicts.length > 3 ? ` và ${response.conflicts.length - 3} học sinh khác` : '';
          setError(`Cảnh báo: ${conflictNames}${moreText} bị trùng lịch với lớp khác!`);
          setShowEditModal(true);
        } else {
          await notifyScheduleChange();
        }
      }
    } catch (err: any) {
      console.error('Failed to create schedule:', err);
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi tạo lịch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!selectedSchedule || !formData.startTime || !formData.endTime) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const scheduleDate = new Date(selectedSchedule.startTime);
      const startDateTime = `${format(scheduleDate, 'yyyy-MM-dd')}T${formData.startTime}:00`;
      const endDateTime = `${format(scheduleDate, 'yyyy-MM-dd')}T${formData.endTime}:00`;

      await scheduleApi.update(selectedSchedule.id, {
        startTime: startDateTime,
        endTime: endDateTime,
      });

      setSchedules(schedules.map(s =>
        s.id === selectedSchedule.id
          ? {
              ...s,
              startTime: startDateTime,
              endTime: endDateTime,
            }
          : s
      ));
      setShowEditModal(false);
      setSelectedSchedule(null);
      await notifyScheduleChange();
    } catch (err: any) {
      console.error('Failed to update schedule:', err);
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật lịch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;

    setSubmitting(true);

    try {
      await scheduleApi.delete(selectedSchedule.id);
      setSchedules(schedules.filter(s => s.id !== selectedSchedule.id));
      setShowEditModal(false);
      setSelectedSchedule(null);
      setConflicts([]);
      setTeacherConflicts([]);
      await notifyScheduleChange();
    } catch (err: any) {
      console.error('Failed to delete schedule:', err);
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi xóa lịch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseEditModal = (open: boolean) => {
    if (!open) {
      setConflicts([]);
      setTeacherConflicts([]);
      setError(null);
      setSelectedSchedule(null);
    }
    setShowEditModal(open);
  };

  return (
    <div className="weekly-schedule-grid space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div>
            <h3 className="font-semibold">
              Tuần {format(currentWeekStart, 'dd/MM')} - {format(addDays(currentWeekStart, 6), 'dd/MM/yyyy')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {format(currentWeekStart, 'MMMM yyyy', { locale: vi })}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hôm nay
          </Button>
        </div>

        {isAdmin && (
          <Button size="sm" onClick={() => {
            setSelectedSlot({ day: 1, slot: SLOTS[0] });
            setFormData({ startTime: SLOTS[0].start, endTime: SLOTS[0].end });
            setShowAddModal(true);
          }}>
            <Plus className="w-4 h-4 mr-1" />
            Thêm lịch
          </Button>
        )}
      </div>

      {/* Schedule Grid */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[900px]">
            {/* Header Row */}
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <th className="sticky left-0 z-20 w-28 p-4 text-center font-bold border-r-2 border-blue-500 bg-blue-600">
                  <div className="flex flex-col items-center gap-1">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm">THỜI GIAN</span>
                  </div>
                </th>
                {weekDays.map((day) => (
                  <th
                    key={day.key}
                    className={`p-3 text-center font-bold min-w-[130px] ${
                      isToday(day.date)
                        ? 'bg-yellow-500/30 border-b-4 border-yellow-400'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col items-center leading-tight">
                      <span className="text-sm font-bold">{day.full}</span>
                      <span className="text-2xl font-extrabold">{format(day.date, 'dd')}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {SORTED_SLOTS.map((slot) => (
                <tr key={slot.number} className="border-t-2 border-border">
                  {/* Slot Column */}
                  <td className="sticky left-0 z-20 p-3 text-center font-bold bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-r-2 border-border min-w-[140px]">
                    <div className="flex flex-col items-center gap-0.5 leading-tight">
                      <span className="text-base font-bold text-blue-700 dark:text-blue-300">Tiết {slot.number}</span>
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {slot.displayStart} - {slot.displayEnd}
                      </span>
                    </div>
                  </td>

                  {/* Day Columns */}
                  {weekDays.map((day) => {
                    const cellSchedules = scheduleGrid[day.key]?.[slot.number] || [];
                    const isTodayCell = isToday(day.date);

                    return (
                      <td
                        key={`${day.key}-${slot.number}`}
                        className={`p-2 min-h-[100px] align-top border-r border-border ${
                          isTodayCell ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30' : ''
                        }`}
                        onClick={() => handleCellClick(day, slot)}
                        style={{ cursor: isAdmin ? 'pointer' : 'default' }}
                      >
                        {cellSchedules.length === 0 ? (
                          <div className="h-full min-h-[60px] flex items-center justify-center text-muted-foreground/20 text-xs">
                            {isAdmin && isTodayCell ? '+' : ''}
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {cellSchedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                className={`p-2 rounded-lg text-white text-xs cursor-pointer hover:opacity-90 transition-opacity shadow-sm bg-gradient-to-br ${slot.color} ${slot.bgDark}`}
                                onClick={(e) => handleScheduleClick(schedule, e)}
                              >
                                <p className="font-bold text-sm truncate">{classInfo?.classCode || schedule.classCode}</p>
                                <div className="flex items-center gap-1 opacity-90">
                                  <Clock className="w-3 h-3 shrink-0" />
                                  <span>
                                    {schedule.startTime.split('T')[1].substring(0, 5)} - {schedule.endTime.split('T')[1].substring(0, 5)}
                                  </span>
                                </div>
                              </div>
                            ))}
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
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span>Sắp tới</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-200 border border-yellow-400"></div>
          <span>Hôm nay</span>
        </div>
      </div>

      {/* Add Schedule Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Thêm lịch học
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedSlot && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium">
                  {DAYS_OF_WEEK.find(d => d.key === selectedSlot.day)?.full} - Tiết {selectedSlot.slot.number}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedSlot.slot.start} - {selectedSlot.slot.end}
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Giờ bắt đầu</label>
                <Input
                  type="time"
                  value={selectedSlot?.slot?.displayStart || ''}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Giờ kết thúc</label>
                <Input
                  type="time"
                  value={selectedSlot?.slot?.displayEnd || ''}
                  disabled
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateSchedule} disabled={submitting}>
              {submitting ? 'Đang thêm...' : 'Thêm lịch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Modal */}
      <Dialog open={showEditModal} onOpenChange={handleCloseEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Chỉnh sửa lịch học
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedSchedule && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium">{selectedSchedule.classCode}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(selectedSchedule.startTime), 'EEEE, dd/MM/yyyy', { locale: vi })}
                </p>
              </div>
            )}

            {error && (
              <div className={`p-3 rounded-lg border text-sm ${conflicts.length > 0 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'}`}>
                {error}
              </div>
            )}

            {/* Show conflicts if any */}
            {conflicts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                  Danh sách học sinh bị trùng lịch:
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {conflicts.map((conflict, index) => (
                    <div key={`student-${index}`} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                      <p className="font-medium">{conflict.studentName}</p>
                      <p className="text-muted-foreground">
                        Trùng với lớp {conflict.conflictingClassCode}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show teacher conflicts if any */}
            {teacherConflicts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                  Cảnh báo trùng lịch giáo viên:
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {teacherConflicts.map((conflict, index) => (
                    <div key={`teacher-${index}`} className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-xs">
                      <p className="font-medium">Lớp {conflict.conflictingClassCode}</p>
                      <p className="text-muted-foreground">
                        {conflict.conflictingStartTime.split('T')[1]?.substring(0, 5)} - {conflict.conflictingEndTime.split('T')[1]?.substring(0, 5)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Giờ bắt đầu</label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Giờ kết thúc</label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row justify-between sm:justify-between">
            <Button
              variant="destructive"
              onClick={handleDeleteSchedule}
              disabled={submitting}
              className="mr-2"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Đóng
              </Button>
              <Button onClick={handleUpdateSchedule} disabled={submitting}>
                <Edit className="w-4 h-4 mr-2" />
                Cập nhật
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
