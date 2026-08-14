import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Cpu, Search, Play, CheckCircle, Clock, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { studentApi, StudentVirtualLab } from '@/services/teacherStudentApi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const ITEMS_PER_PAGE = 12;

export default function StudentSimulationsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');

  const { data: simulationsData, isLoading } = useQuery({
    queryKey: ['student-simulations', currentPage, searchTerm, filterStatus, filterClass],
    queryFn: () => studentApi.getVirtualLabs({
      pageNumber: currentPage,
      pageSize: ITEMS_PER_PAGE,
      classId: filterClass !== 'all' ? Number(filterClass) : undefined,
    }),
  });

  const { data: classesData } = useQuery({
    queryKey: ['student-classes-for-filter'],
    queryFn: () => studentApi.getClasses({ pageSize: 100 }),
  });

  const simulations = simulationsData?.items || [];
  const totalPages = Math.ceil((simulationsData?.total || 0) / ITEMS_PER_PAGE);
  const classes = classesData?.items || [];

  // Filter by search term and status
  const filteredSimulations = simulations.filter(sim => {
    const matchesSearch = sim.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sim.className.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sim.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_started':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Chưa làm</span>;
      case 'in_progress':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Đang làm</span>;
      case 'completed':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Hoàn thành</span>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started':
        return <Cpu className="w-6 h-6 text-gray-400" />;
      case 'in_progress':
        return <Play className="w-6 h-6 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      default:
        return <Cpu className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'border-gray-200 dark:border-gray-700';
      case 'in_progress':
        return 'border-blue-200 dark:border-blue-800';
      case 'completed':
        return 'border-green-200 dark:border-green-800';
      default:
        return 'border-border';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Phòng Lab Ảo</h1>
        <p className="text-muted-foreground">Luyện tập với các mô phỏng STEM</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm phòng lab..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Tất cả lớp</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>

        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            Tất cả
          </Button>
          <Button
            variant={filterStatus === 'not_started' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('not_started')}
          >
            Chưa làm
          </Button>
          <Button
            variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('in_progress')}
          >
            Đang làm
          </Button>
          <Button
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('completed')}
          >
            Hoàn thành
          </Button>
        </div>
      </div>

      {/* Simulations Grid */}
      {filteredSimulations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSimulations.map((sim) => (
            <div
              key={sim.id}
              className={`bg-card rounded-xl border ${getStatusColor(sim.status)} overflow-hidden transition-all hover:shadow-md`}
            >
              {/* Preview Area */}
              <div className="h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center relative">
                {getStatusIcon(sim.status)}
                <div className="absolute top-3 right-3">
                  {getStatusBadge(sim.status)}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold line-clamp-1" title={sim.title}>{sim.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <BookOpen className="w-3 h-3" />
                    {sim.className}
                  </p>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {sim.description}
                </p>

                <div className="flex items-center justify-between">
                  {sim.score !== undefined && (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Điểm: {sim.score}/100
                    </span>
                  )}
                  {sim.dueDate && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(sim.dueDate), { addSuffix: true, locale: vi })}
                    </span>
                  )}
                </div>

                <Link to={`/dashboard/student/simulations/${sim.id}`} className="block">
                  <Button className="w-full gap-2" variant={sim.status === 'completed' ? 'outline' : 'default'}>
                    {sim.status === 'not_started' && <><Cpu className="w-4 h-4" /> Bắt đầu</>}
                    {sim.status === 'in_progress' && <><Play className="w-4 h-4" /> Tiếp tục</>}
                    {sim.status === 'completed' && <><CheckCircle className="w-4 h-4" /> Xem lại</>}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Cpu className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Không có phòng lab nào</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterStatus !== 'all' || filterClass !== 'all'
              ? 'Không tìm thấy phòng lab phù hợp với bộ lọc'
              : 'Các phòng lab sẽ xuất hiện khi được giao'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
