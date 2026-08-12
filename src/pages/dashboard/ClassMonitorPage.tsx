import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Play, CheckCircle2, XCircle, Code2, PencilRuler, Square, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { virtualLabHub } from '@/services/virtualLabHub';
import { StudentSandboxViewer } from '@/components/Dashboard/VirtualLab/Monitor/StudentSandboxViewer';
import { classesApi } from '@/services/dashboardApi';
import type { ClassEntity } from '@/services/dashboardApi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

// Đúng danh sách trạng thái mục 4.5 yêu cầu — "idle" là trạng thái ngay sau
// StudentJoined (chưa sửa gì); không có "offline" thật sự phát hiện được vì
// VirtualLabHub.OnDisconnectedAsync chỉ âm thầm rời group, KHÔNG broadcast
// gì cho các Teacher đang xem — ghi vào backlog VIRTUAL_LAB_PLAN.md, không
// tự thêm event mới ở BE trong task này.
type StudentStatusValue =
  | 'idle'
  | 'editing_diagram'
  | 'editing_code'
  | 'compiling'
  | 'compile_success'
  | 'compile_failed'
  | 'running'
  | 'stopped'
  | 'submitted';

interface StudentStatus {
  projectId: string;
  studentId: number;
  studentName: string;
  status: StudentStatusValue;
  lastUpdated: number;
}

export const ClassMonitorPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState<ClassEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [students, setStudents] = useState<Record<string, StudentStatus>>({});
  const [selectedStudent, setSelectedStudent] = useState<StudentStatus | null>(null);
  const [now, setNow] = useState(Date.now());

  // Tick for "last updated" time
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!classId) return;

    const fetchClassInfo = async () => {
      try {
        const cls = await classesApi.getById(Number(classId));
        setClassInfo(cls);
      } catch (error) {
        console.error('Failed to load class info', error);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchClassInfo();

    // SignalR
    virtualLabHub.watchClass(Number(classId)).catch(console.error);

    const updateStudent = (projectId: string, updates: Partial<StudentStatus>) => {
      setStudents(prev => {
        const existing = prev[projectId];
        if (!existing && !updates.studentName) return prev; // Only join can create new entry

        return {
          ...prev,
          [projectId]: {
            projectId,
            studentId: updates.studentId ?? existing?.studentId ?? 0,
            studentName: updates.studentName ?? existing?.studentName ?? 'Unknown',
            status: updates.status ?? existing?.status ?? 'idle',
            lastUpdated: Date.now()
          }
        };
      });
    };

    const onJoined = (projectId: string, studentId: number, studentName: string) => {
      updateStudent(projectId, { studentId, studentName, status: 'idle' });
    };

    const onCodeUpdated = (projectId: string) => {
      updateStudent(projectId, { status: 'editing_code' });
    };

    const onDiagramUpdated = (projectId: string) => {
      updateStudent(projectId, { status: 'editing_diagram' });
    };

    const onCompileStarted = (projectId: string) => {
      updateStudent(projectId, { status: 'compiling' });
    };

    // success là bool THẬT do BE gửi (BroadcastCompileFinishedAsync) — phân
    // biệt đúng compile_success/compile_failed thay vì gộp chung "coding"
    // như bản cũ (mất hẳn tín hiệu biên dịch lỗi trên dashboard).
    const onCompileFinished = (projectId: string, success: boolean) => {
      updateStudent(projectId, { status: success ? 'compile_success' : 'compile_failed' });
    };

    // StudentRunBooting/StudentRunCompleted giờ đã broadcast tới CẢ class
    // group (xem SignalRSimulationEventBroadcaster.cs) — trước đây chỉ tới
    // project group nên dashboard lớp KHÔNG BAO GIỜ nhận được, học sinh
    // "kẹt" mãi ở compiling dù đã chạy xong từ lâu.
    const onRunBooting = (projectId: string) => {
      updateStudent(projectId, { status: 'running' });
    };

    const onRunCompleted = (projectId: string) => {
      updateStudent(projectId, { status: 'stopped' });
    };

    const onSubmitted = (projectId: string) => {
      updateStudent(projectId, { status: 'submitted' });
    };

    const onStopped = (projectId: string) => {
      updateStudent(projectId, { status: 'stopped' });
    };

    virtualLabHub.on('StudentJoined', onJoined);
    virtualLabHub.on('StudentCodeUpdated', onCodeUpdated);
    virtualLabHub.on('StudentDiagramUpdated', onDiagramUpdated);
    virtualLabHub.on('StudentCompileStarted', onCompileStarted);
    virtualLabHub.on('StudentCompileFinished', onCompileFinished);
    virtualLabHub.on('StudentRunBooting', onRunBooting);
    virtualLabHub.on('StudentRunCompleted', onRunCompleted);
    virtualLabHub.on('StudentSubmitted', onSubmitted);
    virtualLabHub.on('StudentStopped', onStopped);

    return () => {
      virtualLabHub.off('StudentJoined', onJoined);
      virtualLabHub.off('StudentCodeUpdated', onCodeUpdated);
      virtualLabHub.off('StudentDiagramUpdated', onDiagramUpdated);
      virtualLabHub.off('StudentCompileStarted', onCompileStarted);
      virtualLabHub.off('StudentCompileFinished', onCompileFinished);
      virtualLabHub.off('StudentRunBooting', onRunBooting);
      virtualLabHub.off('StudentRunCompleted', onRunCompleted);
      virtualLabHub.off('StudentSubmitted', onSubmitted);
      virtualLabHub.off('StudentStopped', onStopped);
      virtualLabHub.unwatchClass(Number(classId)).catch(console.error);
    };
  }, [classId]);

  const studentList = Object.values(students).sort((a, b) => b.lastUpdated - a.lastUpdated);
  const activeCount = studentList.filter(s => s.status !== 'stopped' && s.status !== 'submitted' && s.status !== 'idle').length;

  const getStatusBadge = (status: StudentStatus['status']) => {
    switch (status) {
      case 'idle':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">Đã vào, chưa thao tác</span>;
      case 'editing_diagram':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20"><PencilRuler className="w-3.5 h-3.5" /> Đang chỉnh mạch</span>;
      case 'editing_code':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20"><Code2 className="w-3.5 h-3.5" /> Đang chỉnh code</span>;
      case 'compiling':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Biên dịch</span>;
      case 'compile_success':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> Biên dịch OK</span>;
      case 'compile_failed':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20"><XCircle className="w-3.5 h-3.5" /> Lỗi biên dịch</span>;
      case 'running':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><Play className="w-3.5 h-3.5" /> Đang chạy Lab</span>;
      case 'stopped':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground"><Square className="w-3.5 h-3.5" /> Đã dừng</span>;
      case 'submitted':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> Đã nộp bài</span>;
    }
  };

  const monitoringTitle = isLoading
    ? 'Đang tải...'
    : classInfo
      ? `Giám sát: ${classInfo.classCode ?? classInfo.name}`
      : 'Giám sát lớp học';

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          aria-label="Quay lại Tổng quan"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">
            {monitoringTitle}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            Realtime Monitoring - {activeCount} học sinh đang hoạt động
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 min-h-[500px]">
        {studentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground">Chưa có học sinh nào truy cập Virtual Lab.</p>
            <p className="text-sm mt-2 text-muted-foreground">Học sinh sẽ xuất hiện ở đây khi họ bắt đầu làm bài.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentList.map(student => (
              <div
                key={student.projectId}
                className="p-4 rounded-xl border border-border bg-muted/30 transition-all hover:border-indigo-500/40 cursor-pointer group flex flex-col gap-4"
                onClick={() => setSelectedStudent(student)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 bg-indigo-500">
                      {student.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {student.studentName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Cập nhật {formatDistanceToNow(student.lastUpdated, { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                </div>
                {getStatusBadge(student.status)}

                <Button
                  variant="outline"
                  className="w-full text-indigo-400 border-indigo-500/30 group-hover:bg-indigo-500/10 group-hover:text-indigo-300 transition-colors"
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  Xem màn hình
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedStudent && (
        <StudentSandboxViewer
          projectId={selectedStudent.projectId}
          studentName={selectedStudent.studentName}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};
