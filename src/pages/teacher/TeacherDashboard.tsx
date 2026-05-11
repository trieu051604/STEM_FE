import { motion } from 'framer-motion';
import { Users, BookOpen, FlaskConical, BarChart3, Clock, Bell, Plus, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { KPICard } from '@/components/common/KPICard';
import { SectionCard, PageHeader, LiveIndicator, AvatarGroup, StatusBadge } from '@/components/common/UIComponents';
import { MOCK_STUDENTS, MOCK_COURSES, PERFORMANCE_DATA } from '@/utils/mockData';
import { useCurrentUser } from '@/stores';
import { Link } from 'react-router-dom';

const kpis = [
  { title: 'Tổng học sinh', value: 156, change: 4, changeLabel: ' mới', icon: <Users size={20} />, color: 'brand' as const },
  { title: 'Khóa học đang dạy', value: 6, change: 1, changeLabel: ' mới', icon: <BookOpen size={20} />, color: 'accent' as const },
  { title: 'Bài tập chờ chấm', value: 23, change: -5, changeLabel: ' so với tuần trước', icon: <Clock size={20} />, color: 'warning' as const },
  { title: 'Lab sessions hôm nay', value: 2, icon: <FlaskConical size={20} />, color: 'success' as const },
];

const PENDING_SUBMISSIONS = [
  { student: 'Phạm Thị Học', course: 'Vật lý lượng tử', type: 'Bài tập', submitted: '30 phút trước' },
  { student: 'Trần Văn An', course: 'Hóa học hữu cơ', type: 'Quiz', submitted: '2 giờ trước' },
  { student: 'Lê Thị Bình', course: 'Vật lý lượng tử', type: 'Lab report', submitted: '3 giờ trước' },
];

export function TeacherDashboard() {
  const user = useCurrentUser();
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Xin chào, ${user?.fullName?.split(' ').slice(-1)[0]} 👨‍🏫`}
        subtitle="Quản lý lớp học và hoạt động giảng dạy"
        actions={
          <div className="flex gap-2">
            <Link to="/teacher/courses/create" className="btn-primary"><Plus size={16} /> Tạo khóa học</Link>
            <Link to="/teacher/lab/demo" className="btn-secondary"><FlaskConical size={16} /> Mở Lab</Link>
          </div>
        }
      />

      {/* Live session alert */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LiveIndicator />
          <div>
            <p className="text-sm font-semibold text-white">Lab Hóa học đang chạy — 14 học sinh tham gia</p>
            <p className="text-xs text-slate-400">Bắt đầu lúc 14:00 • Còn 35 phút</p>
          </div>
        </div>
        <Link to="/teacher/lab/demo" className="btn-primary text-sm">Điều khiển Lab →</Link>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => <KPICard key={k.title} {...k} index={i} />)}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Class performance chart */}
        <SectionCard title="Điểm trung bình lớp" subtitle="12 tuần qua" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={PERFORMANCE_DATA.slice(-8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[60, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Pending submissions */}
        <SectionCard title="Chờ chấm điểm" actions={<Link to="/teacher/assignments" className="text-xs text-brand-400">Xem tất cả</Link>}>
          <div className="space-y-3">
            {PENDING_SUBMISSIONS.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 flex items-start gap-3">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.student}`} className="w-8 h-8 rounded-full" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white">{s.student}</p>
                  <p className="text-xs text-slate-400">{s.course} • {s.type}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{s.submitted}</p>
                </div>
                <Link to="/teacher/grading" className="btn-primary text-xs py-1 px-2 flex-shrink-0">Chấm</Link>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Student status */}
        <SectionCard title="Học sinh" actions={<Link to="/teacher/students" className="text-xs text-brand-400">Xem tất cả</Link>}>
          <div className="space-y-2">
            {MOCK_STUDENTS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="relative">
                  <img src={s.avatar} className="w-8 h-8 rounded-full" />
                  {s.isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{s.fullName}</p>
                  <p className="text-xs text-slate-400">{s.grade} • GPA {s.gpa}</p>
                </div>
                <StatusBadge status={s.isOnline ? 'active' : 'inactive'} />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* My courses */}
        <SectionCard title="Khóa học đang dạy" actions={<Link to="/teacher/courses/create" className="text-xs text-brand-400">+ Tạo mới</Link>}>
          <div className="space-y-3">
            {MOCK_COURSES.slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                <img src={c.thumbnail} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.title}</p>
                  <p className="text-xs text-slate-400">{c.studentCount} học sinh</p>
                </div>
                <AvatarGroup users={MOCK_STUDENTS.slice(0, 3).map(s => ({ name: s.fullName, avatar: s.avatar }))} max={3} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
