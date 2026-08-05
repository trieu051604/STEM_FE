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
import { cn } from '@/lib/utils';

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
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">Đã vào, chưa thao tác</span>;
      case 'editing_diagram':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"><PencilRuler className="w-3.5 h-3.5" /> Đang chỉnh mạch</span>;
      case 'editing_code':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"><Code2 className="w-3.5 h-3.5" /> Đang chỉnh code</span>;
      case 'compiling':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Biên dịch</span>;
      case 'compile_success':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700"><CheckCircle2 className="w-3.5 h-3.5" /> Biên dịch OK</span>;
      case 'compile_failed':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700"><XCircle className="w-3.5 h-3.5" /> Lỗi biên dịch</span>;
      case 'running':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"><Play className="w-3.5 h-3.5" /> Đang chạy Lab</span>;
      case 'stopped':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600"><Square className="w-3.5 h-3.5" /> Đã dừng</span>;
      case 'submitted':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700"><CheckCircle2 className="w-3.5 h-3.5" /> Đã nộp bài</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-border hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#0f4c5c]">
            {isLoading ? 'Đang tải...' : classInfo ? `Giám sát: ${classInfo.classCode ?? classInfo.name}` : 'Giám sát lớp học'}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Realtime Monitoring - {activeCount} học sinh đang hoạt động
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm min-h-[500px]">
        {studentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
            <Users className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Chưa có học sinh nào truy cập Virtual Lab.</p>
            <p className="text-sm mt-2">Học sinh sẽ xuất hiện ở đây khi họ bắt đầu làm bài.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentList.map(student => (
              <div
                key={student.projectId}
                className="p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer group flex flex-col gap-4 border-cyan-100 bg-white hover:border-cyan-300"
                onClick={() => setSelectedStudent(student)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner bg-gradient-to-br from-cyan-500 to-[#0f4c5c]">
                      {student.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0f4c5c]">
                        {student.studentName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Cập nhật {formatDistanceToNow(student.lastUpdated, { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(student.status)}
                </div>

                <Button
                  variant="outline"
                  className="w-full bg-slate-50 border-slate-200 group-hover:bg-cyan-50 group-hover:border-cyan-200 transition-colors text-cyan-700"
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
