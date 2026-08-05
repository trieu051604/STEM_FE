import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { dashboardApi } from '@/services/dashboardApi';

interface DashboardChartsProps {
  stats: any;
  role: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// School Admin Charts
export function SchoolAdminCharts({ stats }: DashboardChartsProps) {
  const { data: chartData } = useQuery({
    queryKey: ['dashboard-chart'],
    queryFn: dashboardApi.getChartData,
    staleTime: 5 * 60 * 1000,
  });

  const enrollmentData = chartData?.enrollmentTrend || [
    { name: 'T1', students: 0 },
    { name: 'T2', students: 0 },
    { name: 'T3', students: 0 },
    { name: 'T4', students: 0 },
    { name: 'T5', students: 0 },
    { name: 'T6', students: 0 },
  ];

  const roleDistribution = [
    { name: 'Giáo viên', value: stats?.totalTeachers || 0 },
    { name: 'Học sinh', value: stats?.totalStudents || 0 },
    { name: 'Lớp học', value: stats?.totalClasses || 0 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Enrollment Trend Chart */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Xu hướng đăng ký học sinh</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={enrollmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="students"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution Pie Chart */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Phân bố người dùng</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={roleDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {roleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Teacher Charts
export function TeacherCharts({ stats }: DashboardChartsProps) {
  const assignmentsData = [
    { name: 'T1', assignments: Math.floor(Math.random() * 10) + 2 },
    { name: 'T2', assignments: Math.floor(Math.random() * 10) + 3 },
    { name: 'T3', assignments: Math.floor(Math.random() * 10) + 5 },
    { name: 'T4', assignments: Math.floor(Math.random() * 10) + 4 },
    { name: 'T5', assignments: Math.floor(Math.random() * 10) + 6 },
    { name: 'T6', assignments: Math.floor(Math.random() * 10) + 8 },
  ];

  const performanceData = [
    { name: 'Xuất sắc', students: Math.floor(Math.random() * 10) + 5 },
    { name: 'Khá', students: Math.floor(Math.random() * 15) + 10 },
    { name: 'Trung bình', students: Math.floor(Math.random() * 10) + 5 },
    { name: 'Yếu', students: Math.floor(Math.random() * 5) + 1 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Assignments Bar Chart */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Bài tập đã tạo (6 tháng gần nhất)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={assignmentsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="assignments" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Student Performance */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Phân bố xếp loại học sinh</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={performanceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="students"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Student Charts
export function StudentCharts({ stats }: DashboardChartsProps) {
  const progressData = [
    { name: 'T1', progress: Math.floor(Math.random() * 30) + 10 },
    { name: 'T2', progress: Math.floor(Math.random() * 30) + 25 },
    { name: 'T3', progress: Math.floor(Math.random() * 30) + 40 },
    { name: 'T4', progress: Math.floor(Math.random() * 30) + 55 },
    { name: 'T5', progress: Math.floor(Math.random() * 30) + 70 },
    { name: 'T6', progress: Math.floor(Math.random() * 30) + 85 },
  ];

  const completionData = [
    { name: 'Hoàn thành', value: stats?.completedLessons || 5 },
    { name: 'Đang học', value: stats?.enrolledClasses || 3 },
    { name: 'Chưa bắt đầu', value: 2 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Learning Progress */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Tiến độ học tập</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="progress"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Course Completion */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Tình trạng khóa học</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={completionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {completionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Master Admin Charts
export function MasterAdminCharts({ stats }: DashboardChartsProps) {
  const { data: chartData } = useQuery({
    queryKey: ['dashboard-chart'],
    queryFn: dashboardApi.getChartData,
    staleTime: 5 * 60 * 1000,
  });

  const schoolsGrowth = chartData?.schoolsGrowth || [
    { name: 'T1', schools: 0 },
    { name: 'T2', schools: 0 },
    { name: 'T3', schools: 0 },
    { name: 'T4', schools: 0 },
    { name: 'T5', schools: 0 },
    { name: 'T6', schools: stats?.totalSchools || 0 },
  ];

  const usersByRole = chartData?.usersByRole || [
    { name: 'Master Admin', value: 0 },
    { name: 'School Admin', value: 0 },
    { name: 'Giáo viên', value: 0 },
    { name: 'Học sinh', value: 0 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Schools Growth */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Tăng trưởng trường học</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={schoolsGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="schools" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Users by Role */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Phân bố người dùng theo vai trò</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={usersByRole}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {usersByRole.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
