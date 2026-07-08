import React, { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlusCircle, Edit2, Trash2, ChevronDown, Plus } from 'lucide-react';

const mockLabs = [
  {
    id: 1,
    title: 'Quang học & Thấu kính',
    subject: 'Vật lý',
    subjectBadge: 'VẬT LÝ',
    subjectColor: 'bg-blue-100 text-blue-700',
    description: 'Khám phá hiện tượng khúc xạ và phản xạ ánh sáng qua hệ thống thấu...',
    students: 124,
    avatars: ['https://i.pravatar.cc/150?img=11', 'https://i.pravatar.cc/150?img=12'],
    extraStudents: 121,
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 2,
    title: 'Phản ứng Axit-Bazơ',
    subject: 'Hóa học',
    subjectBadge: 'HÓA HỌC',
    subjectColor: 'bg-emerald-100 text-emerald-700',
    description: 'Thực hành chuẩn độ và quan sát sự biến đổi màu sắc của các chất chỉ t...',
    students: 86,
    avatars: ['https://i.pravatar.cc/150?img=33', 'https://i.pravatar.cc/150?img=34'],
    extraStudents: 53,
    image: 'https://images.unsplash.com/photo-1603126857599-f6e15782fd5d?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 3,
    title: 'Lập trình Cánh tay Robot',
    subject: 'Robot',
    subjectBadge: 'ROBOT',
    subjectColor: 'bg-orange-100 text-orange-700',
    description: 'Học cách điều khiển tọa độ XYZ và lập trình chu kỳ hoạt động cho cánh...',
    students: 42,
    avatars: ['https://i.pravatar.cc/150?img=55', 'https://i.pravatar.cc/150?img=56'],
    extraStudents: 39,
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=600',
  }
];

const tabs = ['Tất cả', 'Vật lý', 'Hóa học', 'Sinh học', 'Robot'];

export const VirtualLabPage = () => {
  const [activeTab, setActiveTab] = useState('Tất cả');
  
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0f4c5c]">
            Quản lý Phòng Thí Nghiệm
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-base">
            Kiến tạo và điều phối các không gian thực hành STEM chuyên sâu dành cho học sinh của bạn.
          </p>
        </div>
        <button className="bg-[#b45309] hover:bg-[#92400e] text-white rounded-full px-6 py-3 h-auto flex items-center gap-2 shadow-sm font-semibold transition-colors shrink-0">
          <PlusCircle className="w-5 h-5" />
          Tạo phòng thí nghiệm mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center shrink-0">
            <Icon name="FlaskConical" className="w-6 h-6 text-cyan-700" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0f4c5c]">12</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Labs Đang Chạy</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
            <Icon name="Users" className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0f4c5c]">458</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Tổng Học Sinh</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
            <Icon name="CheckSquare" className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0f4c5c]">89%</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Tỷ lệ Hoàn Thành</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
            <Icon name="Clock" className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0f4c5c]">42m</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Thời Gian TB</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap",
                activeTab === tab 
                  ? "bg-[#0f4c5c] text-white" 
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        {/* Sort */}
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 shrink-0">
          SẮP XẾP THEO: 
          <button className="flex items-center gap-1 text-[#0f4c5c] font-bold hover:bg-slate-100 px-2 py-1 rounded transition-colors">
            Mới nhất
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Standard Cards */}
        {mockLabs.map((lab) => (
          <div key={lab.id} className="bg-white rounded-3xl overflow-hidden border border-border shadow-sm flex flex-col">
            <div className="h-48 relative overflow-hidden">
              <img src={lab.image} alt={lab.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
              <div className="absolute top-4 left-4">
                <span className={cn("text-[10px] font-bold px-3 py-1 rounded-full", lab.subjectColor, "bg-white shadow-sm")}>
                  {lab.subjectBadge}
                </span>
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-[#0f4c5c] mb-2">{lab.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-6">
                {lab.description}
              </p>
              
              <div className="mt-auto flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-[#0f4c5c]">
                    <Icon name="User" className="w-4 h-4 text-orange-500" />
                    {lab.students} Học sinh
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {lab.avatars.map((avatar, idx) => (
                    <img key={idx} src={avatar} alt="avatar" className="w-6 h-6 rounded-full border-2 border-white" />
                  ))}
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-600">
                    +{lab.extraStudents}
                  </div>
                </div>
              </div>
              
              <div className="h-px bg-border my-5"></div>
              
              <div className="flex items-center justify-between gap-3">
                <button className="flex-1 bg-[#0f4c5c] hover:bg-[#0a3540] text-white py-2.5 rounded-full text-sm font-bold transition-colors">
                  Xem Lab
                </button>
                <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-[#0f4c5c] transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Featured Card (Sinh học) */}
        <div className="lg:col-span-2 bg-white rounded-3xl overflow-hidden border border-border shadow-sm flex flex-col md:flex-row h-full min-h-[380px]">
          <div className="md:w-1/2 relative bg-[#13222a]">
             <img src="https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=800" alt="DNA" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen" />
             <div className="absolute top-6 left-6 z-10">
                <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-white text-emerald-700 shadow-sm">
                  SINH HỌC
                </span>
             </div>
          </div>
          
          <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-white relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-2xl md:text-3xl font-bold text-[#0f4c5c]">Tế bào & Vi sinh vật</h3>
              <Icon name="BookOpen" className="w-6 h-6 text-cyan-600" />
            </div>
            
            <p className="text-muted-foreground leading-relaxed mb-8">
              Nghiên cứu cấu trúc tế bào nhân thực và nhân sơ dưới kính hiển vi điện tử ảo độ phân giải cực cao. Phân tích các bào quan và chức năng của chúng.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">LỚP HỌC</p>
                <p className="font-bold text-[#0f4c5c]">Sinh học K10 - A2</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SĨ SỐ</p>
                <p className="font-bold text-[#0f4c5c]">206 Học sinh</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-auto">
              <button className="bg-[#0f4c5c] hover:bg-[#0a3540] text-white px-8 py-3 rounded-full text-sm font-bold transition-colors">
                Xem Chi tiết
              </button>
              <button className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-[#0f4c5c] transition-colors ml-auto md:ml-0">
                <Icon name="MoreHorizontal" className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Create New Lab Card */}
        <div className="bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-8 text-center min-h-[380px] hover:bg-slate-100 hover:border-slate-400 transition-all cursor-pointer group">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 mb-6 group-hover:scale-110 group-hover:bg-slate-300 group-hover:text-[#0f4c5c] transition-all">
            <Plus className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#0f4c5c] mb-2">Tạo Lab Mới</h3>
          <p className="text-sm text-muted-foreground max-w-[200px]">
            Thiết kế một không gian học thuật mới ngay hôm nay.
          </p>
        </div>
        
      </div>
    </div>
  );
};
