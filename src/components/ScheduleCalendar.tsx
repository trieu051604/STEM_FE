import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { scheduleApi, type ScheduleCalendarItem, type ScheduleResponse } from '@/services/schoolAdminApi';
import { Plus, Trash2, Edit, Calendar, Clock, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';

// Slot definitions with colors for monthly calendar
const SLOT_COLORS = [
  { slot: 1, color: '#3b82f6', name: 'Tiết 1' },      // Blue
  { slot: 2, color: '#10b981', name: 'Tiết 2' },      // Green
  { slot: 3, color: '#8b5cf6', name: 'Tiết 3' },      // Purple
  { slot: 4, color: '#f59e0b', name: 'Tiết 4' },      // Orange
];

const getSlotFromTime = (timeStr: string): number => {
  const time = timeStr.split('T')[1]?.substring(0, 5) || '';
  if (time >= '07:00' && time < '09:15') return 1;
  if (time >= '09:30' && time < '11:45') return 2;
  if (time >= '12:30' && time < '14:45') return 3;
  if (time >= '15:00' && time < '17:15') return 4;
  return 0;
};

const getColorForSlot = (startTime: string): string => {
  const slot = getSlotFromTime(startTime);
  return SLOT_COLORS.find(s => s.slot === slot)?.color || '#6b7280';
};

interface ClassSchedule {
  id: number;
  classCode: string;
  className: string;
}

interface ScheduleCalendarProps {
  classId?: number;
  schedules?: ScheduleResponse[];
  classInfo?: ClassSchedule;
  isAdmin?: boolean;
  onScheduleChange?: () => void | Promise<void> | ((options?: any) => Promise<any>);
}

export function ScheduleCalendar({ classId, schedules: initialSchedules, classInfo, isAdmin = false, onScheduleChange }: ScheduleCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<ScheduleCalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleCalendarItem | null>(null);
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    endTime: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch schedules
  useEffect(() => {
    if (classId) {
      fetchSchedulesFromClass();
    } else {
      fetchMySchedule();
    }
  }, [classId]);

  // Map initial schedules to events
  useEffect(() => {
    if (initialSchedules && initialSchedules.length > 0) {
      const mappedEvents: ScheduleCalendarItem[] = initialSchedules.map((s) => ({
        id: s.id,
        title: classInfo ? `${classInfo.classCode}` : s.className,
        // Strip 'Z' suffix because time is already local (not UTC)
        start: s.startTime.replace('Z', ''),
        end: s.endTime.replace('Z', ''),
        classCode: s.classCode || classInfo?.classCode || '',
        className: s.className || classInfo?.className || '',
        color: getColorForSlot(s.startTime),
      }));
      setEvents(mappedEvents);
      setLoading(false);
    }
  }, [initialSchedules, classInfo]);

  const fetchSchedulesFromClass = async () => {
    if (!classId) return;

    try {
      setLoading(true);
      const today = new Date();
      const fromDate = format(today, 'yyyy-MM-dd');
      const toDate = format(addDays(today, 30), 'yyyy-MM-dd');
      const data = await scheduleApi.getByClassId(classId, fromDate, toDate);
      const mappedEvents: ScheduleCalendarItem[] = data.map((s) => ({
        id: s.id,
        title: s.lessonTitle || s.className || s.classCode || 'Buổi học',
        // Strip 'Z' suffix because time is already local (not UTC)
        start: s.startTime.replace('Z', ''),
        end: s.endTime.replace('Z', ''),
        classCode: s.classCode,
        className: s.className,
        lessonTitle: s.lessonTitle,
        color: getColorForSlot(s.startTime),
      }));
      setEvents(mappedEvents);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMySchedule = async () => {
    try {
      setLoading(true);
      const data = await scheduleApi.getMySchedule();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
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

  const handleDateClick = (info: any) => {
    if (!isAdmin || !classId || classId <= 0) return;
    const date = info.dateStr.split('T')[0];
    setFormData({
      startDate: date,
      startTime: '08:00',
      endTime: '09:00',
    });
    setError(null);
    setShowAddModal(true);
  };

  const handleEventClick = (info: any) => {
    const event = info.event;
    const eventData: ScheduleCalendarItem = {
      id: parseInt(event.id),
      title: event.title,
      // Strip 'Z' suffix because time is already local (not UTC)
      start: event.startStr.replace('Z', ''),
      end: (event.endStr || event.startStr).replace('Z', ''),
      classCode: event.extendedProps.classCode || '',
      className: event.extendedProps.className || '',
      color: event.backgroundColor,
    };
    setSelectedEvent(eventData);

    const startDate = eventData.start.split('T')[0];
    const startTime = eventData.start.split('T')[1]?.substring(0, 5) || '08:00';
    const endTime = eventData.end.split('T')[1]?.substring(0, 5) || '09:00';

    setFormData({
      startDate,
      startTime,
      endTime,
    });

    if (isAdmin) {
      setShowEditModal(true);
    }
  };

  const handleCreateSchedule = async () => {
    if (!classId || classId <= 0 || !formData.startDate || !formData.startTime || !formData.endTime) {
      setError('Vui lòng chọn lớp học và điền đầy đủ thông tin');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const startTime = `${formData.startDate}T${formData.startTime}:00`;
      const endTime = `${formData.startDate}T${formData.endTime}:00`;

      const newSchedule = await scheduleApi.create({
        classId,
        startTime,
        endTime,
      });

      // Strip 'Z' suffix because backend returns local time with Z suffix
      const scheduleData = newSchedule.schedule;
      const newEvent: ScheduleCalendarItem = {
        id: scheduleData.id,
        title: classInfo?.classCode || '',
        start: scheduleData.startTime.replace('Z', ''),
        end: scheduleData.endTime.replace('Z', ''),
        classCode: classInfo?.classCode || '',
        className: classInfo?.className || '',
        color: getColorForSlot(scheduleData.startTime),
      };

      setEvents([...events, newEvent]);
      setShowAddModal(false);
      await notifyScheduleChange();
    } catch (err: any) {
      console.error('Failed to create schedule:', err);
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi tạo lịch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!selectedEvent) return;

    setSubmitting(true);
    try {
      const id = typeof selectedEvent.id === 'string' ? parseInt(selectedEvent.id) : selectedEvent.id;
      await scheduleApi.delete(id);
      setEvents(events.filter(e => e.id !== selectedEvent.id));
      setShowEditModal(false);
      setSelectedEvent(null);
      await notifyScheduleChange();
    } catch (err: any) {
      console.error('Failed to delete schedule:', err);
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi xóa lịch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!selectedEvent || !formData.startDate || !formData.startTime || !formData.endTime) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const startTime = `${formData.startDate}T${formData.startTime}:00`;
      const endTime = `${formData.startDate}T${formData.endTime}:00`;
      const id = typeof selectedEvent.id === 'string' ? parseInt(selectedEvent.id) : selectedEvent.id;

      await scheduleApi.update(id, {
        startTime,
        endTime,
      });

      setEvents(events.map(e =>
        e.id === selectedEvent.id
          ? {
              ...e,
              start: startTime,
              end: endTime,
            }
          : e
      ));
      setShowEditModal(false);
      setSelectedEvent(null);
      await notifyScheduleChange();
    } catch (err: any) {
      console.error('Failed to update schedule:', err);
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật lịch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="schedule-calendar space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Lịch học</h3>
          {classInfo && (
            <span className="text-sm text-muted-foreground">- {classInfo.classCode}</span>
          )}
        </div>
        {isAdmin && classId && classId > 0 && (
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Thêm lịch
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          views={{
            dayGridMonth: {
              titleFormat: { year: 'numeric', month: 'long' },
              buttonText: 'Tháng',
            },
            timeGridWeek: {
              titleFormat: { year: 'numeric', month: 'short', day: 'numeric' },
              buttonText: 'Tuần',
            },
            timeGridDay: {
              titleFormat: { year: 'numeric', month: 'short', day: 'numeric', weekday: 'long' },
              buttonText: 'Ngày',
            },
          }}
          buttonText={{
            today: 'Hôm nay',
            month: 'Tháng',
            week: 'Tuần',
            day: 'Ngày',
          }}
          events={events as any}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          editable={false}
          selectable={isAdmin}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          locale="vi"
          height="auto"
          eventDisplay="block"
          timeZone="local"
          allDayText="Cả ngày"
          noEventsText="Không có sự kiện"
          eventContent={(eventInfo) => (
            <div className="p-1 text-xs overflow-hidden text-white dark:text-slate-900">
              <div className="font-semibold truncate">{eventInfo.event.title}</div>
              <div className="opacity-90 dark:opacity-70">
                {format(eventInfo.event.start!, 'HH:mm')} - {format(eventInfo.event.end! || eventInfo.event.start!, 'HH:mm')}
              </div>
            </div>
          )}
        />
      )}

      {/* Add Schedule Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Thêm lịch học mới
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Ngày học
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Giờ bắt đầu
                </label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Giờ kết thúc
                </label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
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
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Chỉnh sửa lịch học
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Ngày học
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Giờ bắt đầu
                </label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Giờ kết thúc
                </label>
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
                Hủy
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
