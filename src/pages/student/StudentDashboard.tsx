import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores';
import { Link } from 'react-router-dom';

export function StudentDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <section>
        <h2 className="text-3xl font-extrabold text-primary tracking-tight mb-2">
          Chào buổi sáng, {user?.fullName.split(' ').pop() || 'bạn'}! 👋
        </h2>
        <p className="text-slate-500 font-medium font-body">Hôm nay là một ngày tuyệt vời để khám phá các định luật vật lý mới.</p>
      </section>

      <div className="grid grid-cols-12 gap-8 font-body">
        {/* Left Column: Stats & Courses */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-b-4 border-primary/10">
              <div className="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary">meeting_room</span>
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">Tổng lớp học</p>
              <h3 className="text-3xl font-black text-primary font-headline">08</h3>
            </div>
            
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-b-4 border-secondary/10">
              <div className="w-12 h-12 bg-secondary/5 rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>assignment_late</span>
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">Bài tập chờ</p>
              <h3 className="text-3xl font-black text-secondary font-headline">04</h3>
            </div>
            
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-b-4 border-tertiary/10">
              <div className="w-12 h-12 bg-tertiary/5 rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-tertiary" style={{fontVariationSettings: "'FILL' 1"}}>workspace_premium</span>
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">Huy hiệu đạt được</p>
              <h3 className="text-3xl font-black text-tertiary font-headline">12</h3>
            </div>
          </div>

          {/* Course Cards Section */}
          <div>
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-xl font-bold text-primary font-headline">Khóa học đang theo dõi</h3>
              <Link to="/student/courses" className="text-secondary text-sm font-bold flex items-center gap-1 hover:underline">
                Xem tất cả <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Course Card 1 */}
              <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm group hover:shadow-md transition-all border border-slate-100">
                <div className="h-40 overflow-hidden relative">
                  <img alt="Khóa học Arduino" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBW5HaWkj-loFjF9rVdijpNlbiuNd7xCA_6t_8M-vZFYT95VXsI2HtdkkJtidDA249Xp3wwArg0BAqmFzOuyax5D7hCHc9ErLslcf4jDHonyLSpfWZ84Kf2nCKsJSneiVxGYjST5jFsUNmIru795OS12UukI3tKVMeDKVlkpp9LF3vq7DptwkZagv6Wj40Po9NFs_vwJMYBhLj5WmqyifPIIESYJG-TzUma7TlrEtDfgKOnvF3MNGxILS_mdhEbsui9-x-8GgjmFKI" />
                  <div className="absolute top-4 left-4 bg-primary/90 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">Cơ bản</div>
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-bold text-primary mb-2 font-headline">Cơ bản về Arduino Uno</h4>
                  <p className="text-slate-500 text-sm mb-6 line-clamp-2 italic">Học cách lập trình điều khiển thiết bị điện tử từ con số 0.</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400">Tiến độ hoàn thành</span>
                      <span className="text-primary">65%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Card 2 */}
              <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm group hover:shadow-md transition-all border border-slate-100">
                <div className="h-40 overflow-hidden relative">
                  <img alt="Phòng thí nghiệm Vật lý" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYVtI2AXTt75CYKuTjonRX7LuW65QKheL2baf6FXBkBalL9p0P7S3olwbZy_YyrrUNW2ZEjK0kcITkg7y6YnSOXLMSBfygLweFWH9L8uxiS5PbR1hasKrcP_Yoc4kS-04VhNJxTEOpwnfSn6XA_pYY0JyfWr_ZKrLznOZIjQe1_Hfgcq0552maLxzsxjHb7UQcKmUr8tTIyngOjPOpcWrp4XGFU0G49ZwkoOlKxP0o_Kkv4xWtcSrDKYLywiuKIwGSg0cDD0Bksqs" />
                  <div className="absolute top-4 left-4 bg-tertiary/90 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">Nâng cao</div>
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-bold text-primary mb-2 font-headline">Vật lý Lượng tử Ảo</h4>
                  <p className="text-slate-500 text-sm mb-6 line-clamp-2 italic">Khám phá thế giới vi mô thông qua các thí nghiệm mô phỏng 3D.</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400">Tiến độ hoàn thành</span>
                      <span className="text-primary">28%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '28%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Feed & Announcements */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary font-headline">Hoạt động gần đây</h3>
              <span className="material-symbols-outlined text-slate-300">history</span>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 text-sm" style={{fontVariationSettings: "'FILL' 1"}}>assignment</span>
                </div>
                <div>
                  <p className="text-sm text-on-surface"><strong>Thầy Hoàng</strong> đã đăng bài tập mới: <span className="text-primary font-medium">Mạch điện song song</span></p>
                  <p className="text-xs text-slate-400 mt-1">2 giờ trước</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600 text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                </div>
                <div>
                  <p className="text-sm text-on-surface">Bạn đã nhận được huy hiệu <strong>"Kỹ sư tập sự"</strong></p>
                  <p className="text-xs text-slate-400 mt-1">5 giờ trước</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600 text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                </div>
                <div>
                  <p className="text-sm text-on-surface">Hệ thống đã phê duyệt báo cáo thí nghiệm <strong>Lab #03</strong></p>
                  <p className="text-xs text-slate-400 mt-1">Hôm qua</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-600 text-sm" style={{fontVariationSettings: "'FILL' 1"}}>campaign</span>
                </div>
                <div>
                  <p className="text-sm text-on-surface">Thông báo: <strong>Bảo trì hệ thống</strong> vào chủ nhật tuần này</p>
                  <p className="text-xs text-slate-400 mt-1">2 ngày trước</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-8 py-3 text-sm font-bold text-slate-400 border border-dashed border-slate-200 rounded-lg hover:border-primary hover:text-primary transition-all">
              Tải thêm hoạt động
            </button>
          </div>

          <Link to="/student/lab/demo" className="block">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-primary rounded-xl p-6 relative overflow-hidden text-white group cursor-pointer shadow-lg"
            >
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-2 font-body">Phòng Lab Đề Xuất</p>
                <h4 className="text-xl font-bold mb-4 font-headline">Khám phá năng lượng tái tạo 🌿</h4>
                <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2">
                  Thử ngay <span className="material-symbols-outlined text-sm">arrow_outward</span>
                </button>
              </div>
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-secondary opacity-20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  );
}
