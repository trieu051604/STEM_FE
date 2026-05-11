import { Upload, FileText, Video, Link2, Trash2, Plus } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/common/UIComponents';

const FILES = [
  { name: 'Bài giảng Vật lý Chương 3.pdf', size: '2.4 MB', type: 'pdf', uploaded: '2 giờ trước' },
  { name: 'Video thí nghiệm.mp4', size: '145 MB', type: 'video', uploaded: 'Hôm qua' },
  { name: 'Bài tập tự luyện.docx', size: '0.8 MB', type: 'doc', uploaded: '3 ngày trước' },
];

const TYPE_ICON: Record<string, React.ReactNode> = { pdf: <FileText size={20} className="text-red-400" />, video: <Video size={20} className="text-accent-400" />, doc: <FileText size={20} className="text-brand-400" /> };

export function UploadMaterialsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tài liệu giảng dạy" subtitle="Quản lý và tải lên tài liệu học tập" />
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upload area */}
        <SectionCard title="Tải lên tài liệu" className="lg:col-span-1">
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-brand-500/50 transition-colors cursor-pointer mb-4">
            <Upload size={32} className="text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-white mb-1">Kéo & thả file vào đây</p>
            <p className="text-xs text-slate-400">PDF, DOCX, MP4, PNG — Tối đa 500MB</p>
          </div>
          <div className="space-y-2">
            {[{ icon: <FileText size={16} className="text-red-400" />, label: 'PDF / Tài liệu' },
              { icon: <Video size={16} className="text-accent-400" />, label: 'Video bài giảng' },
              { icon: <Link2 size={16} className="text-brand-400" />, label: 'Link ngoài' }].map((t, i) => (
              <button key={i} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 hover:border-brand-500/30 transition-colors text-sm text-slate-300">
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Files list */}
        <SectionCard title="Tài liệu đã tải lên" className="lg:col-span-2">
          <div className="space-y-2">
            {FILES.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 hover:border-slate-600 transition-colors group">
                {TYPE_ICON[f.type]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{f.name}</p>
                  <p className="text-xs text-slate-400">{f.size} • {f.uploaded}</p>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button className="btn-ghost w-full justify-center border border-dashed border-slate-700 hover:border-brand-500/50 mt-2 py-3">
              <Plus size={16} /> Tải lên thêm
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
