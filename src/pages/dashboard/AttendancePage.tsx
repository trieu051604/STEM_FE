import { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  classesApi,
  attendanceApi,
  ClassEntity,
  ClassStudentEntry,
  AttendanceRecord,
  AttendanceStatus,
} from '@/services/dashboardApi';
import { TeacherPageHeader } from '@/components/Dashboard/teacher/TeacherPageHeader';
import { TeacherCard } from '@/components/Dashboard/teacher/TeacherCard';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; activeClass: string }[] = [
  { value: 'Present', label: 'Có mặt', activeClass: 'bg-emerald-500 text-white border-emerald-500' },
  { value: 'Absent', label: 'Vắng', activeClass: 'bg-red-500 text-white border-red-500' },
];

function todayIsoDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
  const serverMessage = axiosError?.response?.data?.message;
  if (serverMessage) return serverMessage;
  if (axiosError?.response?.status === 403) return 'Bạn không có quyền điểm danh lớp này.';
  return fallback;
}

export const AttendancePage = () => {
  const { user } = useAuthStore();

  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());

  const [roster, setRoster] = useState<ClassStudentEntry[]>([]);
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
  const [draftStatuses, setDraftStatuses] = useState<Record<number, AttendanceStatus>>({});
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [savingRecordId, setSavingRecordId] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    async function loadClasses() {
      setIsLoadingClasses(true);
      setClassesError(null);
      try {
        const result = await classesApi.getMyClasses();
        if (cancelled) return;
        setClasses(result.items);
        if (result.items.length > 0) {
          setSelectedClassId((prev) => prev ?? result.items[0].id);
        }
      } catch {
        if (!cancelled) setClassesError('Không thể tải danh sách lớp.');
      } finally {
        if (!cancelled) setIsLoadingClasses(false);
      }
    }

    loadClasses();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!selectedClassId) return;
    let cancelled = false;

    async function loadRosterAndAttendance() {
      setIsLoadingRoster(true);
      setRosterError(null);
      setSaveError(null);
      setSaveSuccess(null);
      try {
        const [classDetail, attendanceResult] = await Promise.all([
          classesApi.getById(selectedClassId!),
          attendanceApi.getAttendance({ classId: selectedClassId!, attendanceDate: selectedDate }),
        ]);
        if (cancelled) return;

        const students = classDetail.students ?? [];
        setRoster(students);
        setExistingRecords(attendanceResult.items);

        const initialDrafts: Record<number, AttendanceStatus> = {};
        const existingByStudent = new Map(attendanceResult.items.map(r => [r.studentId, r.status]));
        students.forEach((s) => {
          // Only seed a draft when a real record already exists; a student with
          // no record yet has not been marked and must stay unselected instead
          // of silently showing as "Present".
          const existingStatus = existingByStudent.get(s.id);
          if (existingStatus) {
            initialDrafts[s.id] = existingStatus;
          }
        });
        setDraftStatuses(initialDrafts);
      } catch (err) {
        if (!cancelled) setRosterError(getErrorMessage(err, 'Không thể tải danh sách học sinh / điểm danh.'));
      } finally {
        if (!cancelled) setIsLoadingRoster(false);
      }
    }

    loadRosterAndAttendance();
    return () => {
      cancelled = true;
    };
  }, [selectedClassId, selectedDate]);

  const alreadyMarked = existingRecords.length > 0;

  const recordsByScheduleAndStudent = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    existingRecords.forEach((r) => {
      const key = `${r.scheduleId ?? 'none'}-${r.studentId}`;
      map.set(key, r);
    });
    console.log('DEBUG recordsByScheduleAndStudent map:', Object.fromEntries(map));
    return map;
  }, [existingRecords]);

  const scheduleIds = useMemo(() => {
    const ids = [...new Set(existingRecords.map((r) => r.scheduleId))].sort((a, b) => (a ?? 0) - (b ?? 0));
    console.log('DEBUG scheduleIds:', ids);
    return ids;
  }, [existingRecords]);

  const handleSubmitNew = async () => {
    if (!selectedClassId || roster.length === 0) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      // Create attendance records for ALL schedules in the day
      const markedRoster = roster.filter((s) => draftStatuses[s.id]);
      const createdRecords: AttendanceRecord[] = [];
      for (const scheduleId of scheduleIds) {
        const created = await attendanceApi.createAttendance({
          classId: selectedClassId,
          scheduleId: scheduleId ?? undefined,
          attendanceDate: selectedDate,
          records: markedRoster.map((s) => ({
            studentId: s.id,
            status: draftStatuses[s.id],
          })),
        });
        createdRecords.push(...created);
      }
      setExistingRecords((prev) => [...prev, ...createdRecords]);
      setSaveSuccess(`Đã lưu điểm danh cho ${createdRecords.length} bản ghi (${scheduleIds.length} slot).`);
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Lưu điểm danh thất bại.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateExisting = async (record: AttendanceRecord, status: AttendanceStatus) => {
    setSavingRecordId(record.id);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const updated = await attendanceApi.updateAttendance(record.id, status, record.note);
      setExistingRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSaveSuccess(`Đã cập nhật điểm danh cho ${updated.studentName}.`);
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Cập nhật điểm danh thất bại.'));
    } finally {
      setSavingRecordId(null);
    }
  };

  return (
    <div className="space-y-6">
      <TeacherPageHeader
        title="Điểm danh học sinh"
        description="Chọn lớp và ngày để điểm danh hoặc xem lại kết quả."
      />

      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Lớp học</label>
          <select
            value={selectedClassId ?? ''}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            disabled={isLoadingClasses || classes.length === 0}
            className="border border-border rounded-md px-3 py-2 text-sm min-w-[220px] bg-background text-foreground"
          >
            {classes.length === 0 && <option value="">Không có lớp</option>}
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.classCode ?? c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Ngày</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
          />
        </div>
      </div>

      {classesError && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {classesError}
        </div>
      )}

      {rosterError && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {rosterError}
        </div>
      )}

      {saveError && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {saveError}
        </div>
      )}

      {saveSuccess && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {saveSuccess}
        </div>
      )}

      {isLoadingRoster ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Đang tải danh sách học sinh...
        </div>
      ) : roster.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Lớp này chưa có học sinh nào.
        </div>
      ) : (
        <TeacherCard noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium sticky left-0 bg-muted z-10">Học sinh</th>
                  <th className="px-4 py-3 font-medium sticky left-24 bg-muted z-10">Email</th>
                  {scheduleIds.map((scheduleId) => (
                    <th key={scheduleId} className="px-4 py-3 font-medium text-center min-w-[180px]">
                      Slot {scheduleId ?? '?'}
                    </th>
                  ))}
                  {!alreadyMarked && <th className="px-4 py-3 font-medium text-center">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {roster.map((student) => {
                  return (
                    <tr key={student.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium text-foreground sticky left-0 bg-background z-10">{student.fullName}</td>
                      <td className="px-4 py-3 text-muted-foreground sticky left-24 bg-background z-10">{student.email}</td>
                      {scheduleIds.map((scheduleId) => {
                        const key = `${scheduleId ?? 'none'}-${student.id}`;
                        const existing = recordsByScheduleAndStudent.get(key);
                        const isSavingThis = savingRecordId === existing?.id;
                        return (
                          <td key={scheduleId} className="px-4 py-3 text-center">
                            <div className="flex gap-1 justify-center flex-wrap">
                              {STATUS_OPTIONS.map((opt) => {
                                const currentValue = existing?.status;
                                const isActive = currentValue === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    disabled={alreadyMarked && (!existing || isSavingThis)}
                                    onClick={() => {
                                      if (existing) {
                                        handleUpdateExisting(existing, opt.value);
                                      }
                                    }}
                                    className={`px-2 py-0.5 rounded-full text-xs font-semibold border transition-colors ${
                                      isActive ? opt.activeClass : 'bg-background text-muted-foreground border-border hover:border-foreground/50'
                                    } ${isSavingThis ? 'opacity-50 cursor-wait' : ''}`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        );
                      })}
                      {!alreadyMarked && (
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center flex-wrap">
                            {STATUS_OPTIONS.map((opt) => {
                              const currentValue = draftStatuses[student.id];
                              const isActive = currentValue === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  onClick={() => setDraftStatuses((prev) => ({ ...prev, [student.id]: opt.value }))}
                                  className={`px-2 py-0.5 rounded-full text-xs font-semibold border transition-colors ${
                                    isActive ? opt.activeClass : 'bg-background text-muted-foreground border-border hover:border-foreground/50'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!alreadyMarked && (
            <div className="p-4 border-t border-border flex justify-end">
              <button
                onClick={handleSubmitNew}
                disabled={isSaving}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors border-0"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu điểm danh
              </button>
            </div>
          )}
        </TeacherCard>
      )}
    </div>
  );
};
