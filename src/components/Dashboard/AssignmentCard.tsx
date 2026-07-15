import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  School,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssignmentEntity } from '@/services/dashboardApi';
import { AssignmentTypeBadge } from './AssignmentTypeBadge';

interface AssignmentCardProps {
  assignment: AssignmentEntity;
  canManageAssignments: boolean;
  onEdit?: (assignment: AssignmentEntity) => void;
  onDelete?: (assignment: AssignmentEntity) => void;
  onOpenDetails?: (assignment: AssignmentEntity) => void;
  isDeleting?: boolean;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function formatDate(value?: string) {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  canManageAssignments,
  onEdit,
  onDelete,
  onOpenDetails,
  isDeleting,
}) => {
  const hasSubmissions = assignment.submissionCount > 0;

  // Customize labels based on assignment type
  let stat1Label = 'Bài nộp';
  let stat2Label = 'Tiêu chí';

  if (assignment.assignment_type === 'quiz') {
    stat1Label = 'Lượt làm bài';
    stat2Label = 'Số câu hỏi'; // Assuming metricCount represents questions for quiz
  } else if (assignment.assignment_type === 'practical_simulation') {
    stat2Label = 'Tiêu chí (Manual)';
  }

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col gap-2">
            <div className="bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider w-fit">
              {assignment.courseTitle || 'Bài tập'}
            </div>
            <AssignmentTypeBadge type={assignment.assignment_type} />
          </div>
          {canManageAssignments && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => onEdit?.(assignment)}
                aria-label="Sửa bài tập"
                title="Sửa bài tập"
              >
                <FileText className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                onClick={() => onDelete?.(assignment)}
                disabled={isDeleting}
                aria-label="Xóa bài tập"
                title="Xóa bài tập"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-[#0f4c5c] mb-2 line-clamp-2 group-hover:text-cyan-600 transition-colors">
          {assignment.title}
        </h3>
        <div className="space-y-2 text-sm text-slate-500 mb-6">
          <p className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {assignment.classCode || `Lớp #${assignment.classId}`}
          </p>
          <p className="flex items-center gap-1.5">
            <School className="w-4 h-4" />
            {assignment.schoolName || 'Chưa có trường'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
            <p className="text-xs text-slate-500 mb-1">{stat1Label}</p>
            <p className="text-2xl font-bold text-[#0f4c5c]">
              {assignment.submissionCount}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
            <p className="text-xs text-slate-500 mb-1">{stat2Label}</p>
            <p className="text-2xl font-bold text-[#0f4c5c]">
              {assignment.metricCount}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>
              Cập nhật:{' '}
              <span className="font-semibold">{formatDate(assignment.updatedAt)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50/50 border-t border-border flex justify-between items-center">
        <div className="text-sm">
          {hasSubmissions ? (
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Có bài nộp
            </span>
          ) : (
            <span className="text-amber-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> Chưa có bài nộp
            </span>
          )}
        </div>
        <Button
          type="button"
          onClick={() => onOpenDetails?.(assignment)}
          className="bg-[#0f4c5c] hover:bg-[#0a3540] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1 h-auto"
        >
          {canManageAssignments ? 'Chi tiết' : 'Xem chi tiết'}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};
