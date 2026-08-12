import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2, AlertCircle, Save, CheckCircle2, ArrowLeft, Check, Users, UserX, Clock, X, Lock } from 'lucide-react';
import {
  classesApi,
  attendanceApi,
  ClassStudentEntry,
  AttendanceRecord,
  AttendanceStatus,
} from '@/services/dashboardApi';
import { TeacherCard } from '@/components/Dashboard/teacher/TeacherCard';
import { Button } from '@/components/ui/button';
import { getSlotByTime } from '@/components/WeeklyScheduleGrid';

export const TeacherSessionAttendance = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const classId = Number(searchParams.get('classId'));
  const dateStr = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  // Business rule: a Teacher may only create/edit attendance on the day the session actually
  // happens. Recomputed on every render (not memoized) so the UI naturally flips to read-only
  // if a tab is left open across midnight. The Backend independently enforces the same rule —
  // this is UX only, not the source of truth.
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isAttendanceEditable = dateStr === todayStr;
  const isPastSession = dateStr < todayStr;
  const isFutureSession = dateStr > todayStr;
  const classCode = searchParams.get('classCode') || '';
  const className = searchParams.get('className') || '';
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');

  const [roster, setRoster] = useState<ClassStudentEntry[]>([]);
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
  const [draftStatuses, setDraftStatuses] = useState<Record<number, AttendanceStatus>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [classDetail, attendanceResult] = await Promise.all([
          classesApi.getById(classId),
          attendanceApi.getAttendance({ classId, attendanceDate: dateStr }),
        ]);
        if (cancelled) return;

        const students = classDetail.students ?? [];
        setRoster(students);
        
        const existing = attendanceResult.items || [];
        setExistingRecords(existing);

        const initialDrafts: Record<number, AttendanceStatus> = {};
        
        // If we have existing records, prepopulate drafts with them
        if (existing.length > 0) {
          existing.forEach((r) => {
            initialDrafts[r.studentId] = r.status;
          });
        }
        setDraftStatuses(initialDrafts);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Không thể tải danh sách học sinh.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [classId, dateStr]);

  const stats = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let unmarked = 0;

    roster.forEach(student => {
      const status = draftStatuses[student.id];
      if (status === 'Present') present++;
      else if (status === 'Late') late++;
      else if (status === 'Absent' || status === 'Excused') absent++;
      else unmarked++;
    });

    return { total: roster.length, present, late, absent, unmarked };
  }, [roster, draftStatuses]);

  const handleMarkAllPresent = () => {
    setDraftStatuses(prev => {
      const newDrafts = { ...prev };
      roster.forEach(s => {
        newDrafts[s.id] = 'Present';
      });
      return newDrafts;
    });
  };

  const handleSetStatus = (studentId: number, status: AttendanceStatus) => {
    setDraftStatuses(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!classId || roster.length === 0) return;
    if (!isAttendanceEditable) {
      setError('Đã qua ngày diễn ra buổi học, không thể lưu điểm danh.');
      return;
    }
    setIsSaving(true);
    setError(null);
    setSaveSuccess(null);
    try {
      const newRecords: { studentId: number; status: AttendanceStatus }[] = [];
      const updatePromises: Promise<any>[] = [];

      roster.forEach(student => {
        const draftStatus = draftStatuses[student.id];
        if (!draftStatus) return; // Skip if no status selected

        const existingRecord = existingRecords.find(r => r.studentId === student.id);
        if (existingRecord) {
          // If existing, check if changed
          if (existingRecord.status !== draftStatus) {
            updatePromises.push(
              attendanceApi.updateAttendance(existingRecord.id, draftStatus)
            );
          }
        } else {
          // If new, add to batch POST
          newRecords.push({
            studentId: student.id,
            status: draftStatus,
          });
        }
      });

      const promises = [...updatePromises];
      
      if (newRecords.length > 0) {
        promises.push(
          attendanceApi.createAttendance({
            classId,
            attendanceDate: dateStr,
            records: newRecords
          })
        );
      }

      if (promises.length === 0) {
        setSaveSuccess('Không có thay đổi nào để lưu.');
        setIsSaving(false);
        return;
      }

      const results = await Promise.allSettled(promises);
      const failures = results.filter(r => r.status === 'rejected');
      
      if (failures.length > 0) {
        setError(`Đã lưu ${promises.length - failures.length}/${promises.length} yêu cầu. Một số bản ghi bị lỗi.`);
      } else {
        setSaveSuccess('Đã lưu điểm danh thành công.');
        
        // Optionally redirect back after success
        setTimeout(() => {
          navigate('/dashboard/teacher/schedule');
        }, 2000);
      }
      
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lưu điểm danh thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = startTime ? format(parseISO(startTime), 'EEEE, dd/MM/yyyy', { locale: vi }) : dateStr;
  const timeDisplay = (startTime && endTime) ? `${startTime.includes('T') ? startTime.split('T')[1].substring(0, 5) : format(parseISO(startTime), 'HH:mm')} – ${endTime.includes('T') ? endTime.split('T')[1].substring(0, 5) : format(parseISO(endTime), 'HH:mm')}` : '';
  const slot = startTime ? `Tiết ${getSlotByTime(startTime)}` : '';

  return (
    <div className="space-y-6 pb-24">
      {/* Header Context */}
      <div>
        <Link 
          to="/dashboard/teacher/schedule" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Chi tiết buổi học
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Điểm danh lớp {classCode}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {className} • {formattedDate} {slot ? `· ${slot}` : ''} {timeDisplay ? `· ${timeDisplay}` : ''}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-medium">{saveSuccess}</span>
        </div>
      )}

      {!isLoading && !isAttendanceEditable && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/50 border border-border text-muted-foreground text-sm">
          <Lock className="w-4 h-4 shrink-0" />
          {isPastSession
            ? 'Buổi học đã kết thúc ngày điểm danh. Bạn chỉ có thể xem kết quả điểm danh.'
            : 'Buổi học chưa diễn ra. Bạn sẽ có thể điểm danh vào đúng ngày học.'}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
          <p>Đang tải danh sách học sinh...</p>
        </div>
      ) : roster.length === 0 ? (
        <TeacherCard>
          <div className="text-center py-16 text-muted-foreground">
            Lớp này chưa có học sinh nào hoặc không tìm thấy dữ liệu.
          </div>
        </TeacherCard>
      ) : (
        <>
          {/* Top Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-card border border-border p-3 rounded-xl flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{stats.total}</span>
              <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Học sinh</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-emerald-600">{stats.present}</span>
              <span className="text-xs text-emerald-600/80 mt-1 uppercase tracking-wider font-semibold flex items-center gap-1">
                <Users className="w-3 h-3" /> Có mặt
              </span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-amber-600">{stats.late}</span>
              <span className="text-xs text-amber-600/80 mt-1 uppercase tracking-wider font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" /> Đi muộn
              </span>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-red-600">{stats.absent}</span>
              <span className="text-xs text-red-600/80 mt-1 uppercase tracking-wider font-semibold flex items-center gap-1">
                <UserX className="w-3 h-3" /> Vắng
              </span>
            </div>
            <div className="bg-muted/50 border border-border p-3 rounded-xl flex flex-col items-center justify-center col-span-2 md:col-span-1">
              <span className="text-2xl font-bold text-foreground">{stats.unmarked}</span>
              <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Chưa ĐD</span>
            </div>
          </div>

          {/* Mark All Present Action */}
          {isAttendanceEditable && (
            <div className="flex justify-end">
              <Button
                onClick={handleMarkAllPresent}
                variant="outline"
                className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 bg-emerald-500/5 transition-colors gap-2"
              >
                <Check className="w-4 h-4" />
                Đánh dấu tất cả có mặt
              </Button>
            </div>
          )}

          {/* Student List */}
          <div className="space-y-3">
            {roster.map((student) => {
              const currentStatus = draftStatuses[student.id];

              return (
                <div key={student.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-border/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-sm shrink-0">
                      {student.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{student.fullName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {student.email}
                      </div>
                    </div>
                  </div>

                  {isAttendanceEditable ? (
                    <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
                      <button
                        onClick={() => handleSetStatus(student.id, 'Present')}
                        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                          currentStatus === 'Present'
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-background text-muted-foreground border-border hover:border-emerald-500/50'
                        }`}
                      >
                        Có mặt
                      </button>
                      <button
                        onClick={() => handleSetStatus(student.id, 'Late')}
                        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                          currentStatus === 'Late'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-background text-muted-foreground border-border hover:border-amber-500/50'
                        }`}
                      >
                        Đi muộn
                      </button>
                      <button
                        onClick={() => handleSetStatus(student.id, 'Absent')}
                        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                          (currentStatus === 'Absent' || currentStatus === 'Excused')
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-background text-muted-foreground border-border hover:border-red-500/50'
                        }`}
                      >
                        Vắng
                      </button>
                    </div>
                  ) : (
                    <div className="self-start sm:self-auto">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${
                        currentStatus === 'Present'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : currentStatus === 'Late'
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          : (currentStatus === 'Absent' || currentStatus === 'Excused')
                          ? 'bg-red-500/10 text-red-600 border-red-500/20'
                          : 'bg-muted/50 text-muted-foreground border-border'
                      }`}>
                        {currentStatus === 'Present' ? 'Có mặt'
                          : currentStatus === 'Late' ? 'Đi muộn'
                          : (currentStatus === 'Absent' || currentStatus === 'Excused') ? 'Vắng'
                          : 'Chưa điểm danh'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Sticky Footer for Save Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 px-6 z-40 lg:pl-[280px]">
        <div className="max-w-7xl mx-auto flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/teacher/schedule')}
            disabled={isSaving}
          >
            {isAttendanceEditable ? 'Hủy' : 'Quay lại'}
          </Button>
          {isAttendanceEditable && (
            <Button
              onClick={handleSave}
              disabled={isSaving || roster.length === 0}
              className="bg-indigo-500 hover:bg-indigo-600 text-white gap-2 border-0"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lưu điểm danh
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
