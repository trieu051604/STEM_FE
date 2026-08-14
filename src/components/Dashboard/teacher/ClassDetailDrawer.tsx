import React from 'react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, Clock, BookOpen, Users, CheckCircle2 } from 'lucide-react';
import { ScheduleCalendarItem } from '@/services/dashboardApi';
import { getSlotByTime } from '@/components/WeeklyScheduleGrid';

interface ClassDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  session: ScheduleCalendarItem | null;
}

export const ClassDetailDrawer: React.FC<ClassDetailDrawerProps> = ({ isOpen, onClose, session }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  // A Teacher may only take/edit attendance on the day the session actually happens (see
  // Backend CreateAttendanceHandler/UpdateAttendanceHandler for the enforced rule). Past/future
  // sessions stay navigable so the Teacher can still view attendance history — only the label
  // changes to set the right expectation before they open the page.
  const sessionDateStr = session?.start ? format(parseISO(session.start), 'yyyy-MM-dd') : '';
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isSessionToday = sessionDateStr === todayStr;

  const handleNavigateToAttendance = () => {
    if (session && session.classId && session.id) {
      const dateStr = session.start ? format(parseISO(session.start), 'yyyy-MM-dd') : '';
      navigate(`/dashboard/teacher/schedule/attendance?classId=${session.classId}&date=${dateStr}&classCode=${session.classCode || session.title}&className=${session.className}&startTime=${session.start}&endTime=${session.end}&scheduleId=${session.id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 transition-opacity">
      <div 
        className="w-full max-w-md bg-card h-full shadow-xl flex flex-col border-l border-border transform transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Chi tiết buổi học</h2>
            <p className="text-sm text-muted-foreground truncate max-w-[280px]">
              {session?.classCode || session?.title} · {session?.className}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {session ? (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full w-fit ${session.classId ? 'text-amber-500 bg-amber-500/10' : 'text-muted-foreground bg-muted/50'}`}>
                <Clock className="w-4 h-4" />
                {session.classId ? 'Chưa điểm danh' : 'Chưa hỗ trợ điểm danh (Thiếu ClassId)'}
              </div>

              {/* Info Group */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Thông tin buổi học</h3>
                
                <div className="grid grid-cols-3 gap-2 py-2 border-b border-border/50">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Ngày
                  </div>
                  <div className="col-span-2 text-sm font-medium text-foreground">
                    {format(parseISO(session.start), 'EEEE, dd/MM/yyyy', { locale: vi })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-b border-border/50">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Slot
                  </div>
                  <div className="col-span-2 text-sm font-medium text-foreground">
                    Tiết {getSlotByTime(session.start)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-b border-border/50">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Thời gian
                  </div>
                  <div className="col-span-2 text-sm font-medium text-foreground">
                    {session.start.includes('T') ? session.start.split('T')[1].substring(0, 5) : format(parseISO(session.start), 'HH:mm')} – {session.end.includes('T') ? session.end.split('T')[1].substring(0, 5) : format(parseISO(session.end), 'HH:mm')}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-b border-border/50">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Lớp
                  </div>
                  <div className="col-span-2 text-sm font-medium text-foreground">
                    {session.classCode || session.title}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-b border-border/50">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Môn học
                  </div>
                  <div className="col-span-2 text-sm font-medium text-foreground">
                    {session.className}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Vui lòng chọn một buổi học
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/10">
          <button 
            onClick={handleNavigateToAttendance}
            disabled={!session || !session.classId}
            title={!session?.classId ? "Tính năng điểm danh đang bảo trì do thiếu ClassId từ hệ thống" : ""}
            className={`w-full font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border-0 ${
              session?.classId 
                ? 'bg-indigo-500 hover:bg-indigo-600 text-white' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {session?.classId && !isSessionToday ? 'Xem danh sách & Điểm danh' : 'Danh sách & Điểm danh'} {!session?.classId && '(Unavailable)'}
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
