import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Loader2, Sparkles, ArrowLeft, Upload, X, FileText } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { api } from '@/services';

// Vietnamese phone validation regex
const VN_PHONE_REGEX = /^(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})$/;

// Zod Schema for "Trường học / Đối tác" (Complex B2B) Registration
const B2BSchema = z.object({
  orgName: z
    .string()
    .min(1, { message: 'Tên trường học / tổ chức không được để trống.' }),
  address: z
    .string()
    .min(1, { message: 'Địa chỉ cụ thể không được để trống.' }),
  studentSize: z
    .string()
    .min(1, { message: 'Vui lòng chọn quy mô học sinh.' }),
  repName: z
    .string()
    .min(1, { message: 'Họ và tên người đại diện không được để trống.' }),
  title: z
    .string()
    .min(1, { message: 'Chức vụ không được để trống.' }),
  email: z
    .string()
    .min(1, { message: 'Email liên hệ không được để trống.' })
    .email({ message: 'Email liên hệ không đúng định dạng.' }),
  phone: z
    .string()
    .min(1, { message: 'Số điện thoại liên hệ không được để trống.' })
    .regex(VN_PHONE_REGEX, {
      message: 'Số điện thoại không đúng định dạng Việt Nam.',
    }),
  password: z
    .string()
    .min(1, { message: 'Mật khẩu không được để trống.' })
    .min(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự.' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'Xác nhận mật khẩu không được để trống.' }),
  website: z
    .string()
    .optional()
    .refine((val) => !val || val.startsWith('http'), {
      message: 'Website phải bắt đầu bằng http:// hoặc https://',
    }),
  notes: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp.',
  path: ['confirmPassword'],
});

type B2BFormData = z.infer<typeof B2BSchema>;

export function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; fileName: string; originalName: string } | null>(null);
  const [fileError, setFileError] = useState('');
  const navigate = useNavigate();

  // Form: B2B React Hook Form
  const {
    register: regB2B,
    handleSubmit: handleB2BSubmit,
    setValue: setB2BValue,
    formState: { errors: B2BErrors },
  } = useForm<B2BFormData>({
    resolver: zodResolver(B2BSchema),
  });

  // Submission handler for B2B Form
  const onB2BSubmit = async (data: B2BFormData) => {
    setIsLoading(true);
    setServerError('');
    try {
      const payload = {
        schoolName: data.orgName,
        schoolAddress: data.address,
        representativeName: data.repName,
        representativeEmail: data.email,
        representativePosition: data.title,
        studentScale: data.studentSize,
        website: data.website,
        notes: data.notes,
        fullName: data.repName,
        phone: data.phone,
        password: data.password,
        documentUrl: uploadedFile?.url || null,
      };
      await api.post('/schools/register', payload);
      setIsLoading(false);
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      setIsLoading(false);
      setServerError(err.response?.data?.message || 'Có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại.');
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Chỉ chấp nhận file PDF, JPEG, JPG hoặc PNG.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('Kích thước file không được vượt quá 10MB.');
      return;
    }

    setFileError('');
    setUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'school-registration');

      const response = await api.post('/upload/school-registration', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadedFile({
        url: response.data.url,
        fileName: response.data.fileName,
        originalName: file.name,
      });
    } catch (err: any) {
      setFileError('Tải file thất bại. Vui lòng thử lại.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileError('');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-950 font-sans selection:bg-blue-500/30 relative text-slate-100">
      
      {/* Left Side (Forms Area) */}
      <main className="flex items-center justify-center p-8 sm:p-12 md:p-16 lg:p-20 bg-slate-900 transition-colors duration-300 relative">
        
        {/* Top-Right Theme Toggle */}
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-lg space-y-8">
          
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Quay lại trang chủ
          </Link>

          {/* Logo (Visible on mobile/tablet) */}
          <div className="flex lg:hidden items-center gap-2 mb-8 select-none">
            <Icon name="Cpu" className="text-blue-500 w-8 h-8 animate-pulse" />
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Stem<span className="text-blue-500">Flow</span>
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Đăng ký tài khoản
              <Sparkles className="w-6 h-6 text-blue-400 animate-pulse shrink-0" />
            </h1>
            <p className="text-slate-400 text-sm">
              Khởi tạo không gian học tập và thực hành STEM chuyên nghiệp của bạn.
            </p>
          </div>

          <div className="space-y-6">
            <form onSubmit={handleB2BSubmit(onB2BSubmit)} className="space-y-4">
              
              {/* --- Section 1: Organization Info --- */}
              <div className="border-b border-slate-800/80 pb-4 mb-4">
                <h3 className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-4">1. Thông tin Tổ chức</h3>
                <div className="space-y-4">
                  
                  {/* Tên tổ chức */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="org-name">
                      Tên trường học / Tổ chức
                    </label>
                    <input
                      {...regB2B('orgName')}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white placeholder-slate-600 outline-none text-sm"
                      id="org-name"
                      placeholder="Trường THPT Chuyên StemFlow"
                      disabled={isLoading}
                    />
                    {B2BErrors.orgName && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {B2BErrors.orgName.message}
                      </p>
                    )}
                  </div>

                  {/* Địa chỉ cụ thể */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="org-address">
                      Địa chỉ cụ thể
                    </label>
                    <input
                      {...regB2B('address')}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white placeholder-slate-600 outline-none text-sm"
                      id="org-address"
                      placeholder="Số 123 Đường Trần Hưng Đạo, Quận 1, TP. HCM"
                      disabled={isLoading}
                    />
                    {B2BErrors.address && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {B2BErrors.address.message}
                      </p>
                    )}
                  </div>

                  {/* Quy mô học sinh */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="org-size">
                      Quy mô học sinh
                    </label>
                    <select
                      {...regB2B('studentSize')}
                      onChange={(e) => setB2BValue('studentSize', e.target.value, { shouldValidate: true })}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white outline-none text-sm cursor-pointer"
                      id="org-size"
                      defaultValue=""
                      disabled={isLoading}
                    >
                      <option value="" disabled>Chọn quy mô học sinh</option>
                      <option value="Dưới 100">Dưới 100 học sinh</option>
                      <option value="100-500">100 - 500 học sinh</option>
                      <option value="Trên 500">Trên 500 học sinh</option>
                    </select>
                    {B2BErrors.studentSize && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {B2BErrors.studentSize.message}
                      </p>
                    )}
                  </div>

                </div>
              </div>

              {/* --- Section 2: Representative Info (2 Column Grid) --- */}
              <div className="border-b border-slate-800/80 pb-4 mb-4">
                <h3 className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-4">2. Người Đại diện liên hệ</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Họ và tên người đại diện */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="rep-name">
                      Họ và tên người đại diện
                    </label>
                    <input
                      {...regB2B('repName')}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white placeholder-slate-600 outline-none text-sm"
                      id="rep-name"
                      placeholder="Thầy Nguyễn Văn An"
                      disabled={isLoading}
                    />
                    {B2BErrors.repName && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {B2BErrors.repName.message}
                      </p>
                    )}
                  </div>

                  {/* Chức vụ */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="rep-title">
                      Chức vụ
                    </label>
                    <input
                      {...regB2B('title')}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white placeholder-slate-600 outline-none text-sm"
                      id="rep-title"
                      placeholder="Hiệu trưởng / Trưởng bộ môn"
                      disabled={isLoading}
                    />
                    {B2BErrors.title && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {B2BErrors.title.message}
                      </p>
                    )}
                  </div>

                  {/* Email liên hệ */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="rep-email">
                      Email liên hệ
                    </label>
                    <input
                      {...regB2B('email')}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white placeholder-slate-600 outline-none text-sm"
                      id="rep-email"
                      placeholder="vanan@school.edu.vn"
                      type="email"
                      disabled={isLoading}
                    />
                    {B2BErrors.email && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {B2BErrors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="rep-phone">
                      Số điện thoại
                    </label>
                    <input
                      {...regB2B('phone')}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white placeholder-slate-600 outline-none text-sm"
                      id="rep-phone"
                      placeholder="0912345678"
                      type="tel"
                      disabled={isLoading}
                    />
                    {B2BErrors.phone && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {B2BErrors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* Mật khẩu */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="rep-password">
                      Mật khẩu tài khoản
                    </label>
                    <input
                      {...regB2B('password')}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white placeholder-slate-600 outline-none text-sm"
                      id="rep-password"
                      placeholder="••••••••"
                      type="password"
                      disabled={isLoading}
                    />
                    {B2BErrors.password && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {B2BErrors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Xác nhận mật khẩu */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="rep-confirm-password">
                      Xác nhận mật khẩu
                    </label>
                    <input
                      {...regB2B('confirmPassword')}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white placeholder-slate-600 outline-none text-sm"
                      id="rep-confirm-password"
                      placeholder="••••••••"
                      type="password"
                      disabled={isLoading}
                    />
                    {B2BErrors.confirmPassword && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {B2BErrors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                </div>
              </div>

              {/* --- Section 3: Additional Info (Optional) --- */}
              <div className="space-y-4 pb-2">
                <h3 className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">3. Thông tin bổ sung (Tùy chọn)</h3>

                {/* Website */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="org-website">
                    Website / Fanpage
                  </label>
                  <input
                    {...regB2B('website')}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white placeholder-slate-600 outline-none text-sm"
                    id="org-website"
                    placeholder="https://school.edu.vn"
                    disabled={isLoading}
                  />
                  {B2BErrors.website && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} className="shrink-0" /> {B2BErrors.website.message}
                    </p>
                  )}
                </div>

                {/* File Upload - Certificate */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Giấy chứng nhận / Tài liệu
                  </label>

                  {!uploadedFile ? (
                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center hover:border-slate-500 transition-colors">
                      <input
                        type="file"
                        id="certificate-file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        disabled={isLoading || uploadingFile}
                      />
                      <label
                        htmlFor="certificate-file"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        {uploadingFile ? (
                          <>
                            <Loader2 size={24} className="text-blue-400 animate-spin" />
                            <span className="text-xs text-slate-400">Đang tải file...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={24} className="text-slate-500" />
                            <span className="text-xs text-slate-400">
                              Tải lên giấy chứng nhận (PDF, JPG, PNG) - Tối đa 10MB
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText size={20} className="text-blue-400 shrink-0" />
                        <span className="text-sm text-slate-300 truncate" title={uploadedFile.originalName}>
                          {uploadedFile.originalName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors shrink-0"
                        title="Xóa file"
                      >
                        <X size={16} className="text-slate-400" />
                      </button>
                    </div>
                  )}

                  {fileError && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} className="shrink-0" /> {fileError}
                    </p>
                  )}
                </div>

                {/* Nhu cầu / Ghi chú */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="org-notes">
                    Nhu cầu / Ghi chú thêm
                  </label>
                  <textarea
                    {...regB2B('notes')}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white placeholder-slate-600 outline-none text-sm min-h-[100px] resize-none"
                    id="org-notes"
                    placeholder="Hãy chia sẻ nhu cầu thực hành hoặc thắc mắc của bạn..."
                    disabled={isLoading}
                  />
                </div>

              </div>

              {/* Error alerts from Server */}
              {serverError && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-sm mt-4">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-all duration-150 mt-6 disabled:opacity-50 shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang gửi yêu cầu...
                  </>
                ) : (
                  'Gửi yêu cầu phê duyệt'
                )}
              </button>
            </form>
          </div>

          {/* Link to Login */}
          <div className="text-center pt-2 border-t border-slate-800/40">
            <p className="text-sm text-slate-400">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="text-blue-400 font-bold hover:underline hover:text-blue-300 transition-colors"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>

        </div>
      </main>

      {/* Right Side (Branding & Showcase Area) */}
      <section className="hidden lg:flex relative bg-slate-950 border-l border-slate-800 text-white flex-col justify-between p-16 overflow-hidden select-none">
        
        {/* Wokwi dot grid */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
        
        {/* Glowing blurs */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Top Branding logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <Icon name="Cpu" className="text-blue-500 w-8 h-8 animate-pulse" />
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Stem<span className="text-blue-500">Flow</span>
          </span>
        </div>

        {/* Tagline */}
        <div className="relative z-10 space-y-8 max-w-lg">
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Khởi tạo không gian <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              giáo dục STEM của riêng bạn.
            </span>
          </h2>
          <p className="text-slate-400 leading-relaxed text-lg">
            Học tập lập trình cảm biến, lắp ráp mạch điện IoT thực tế ảo an toàn, tiết kiệm trên trình duyệt mà không cần mua thiết bị vật lý đắt đỏ.
          </p>

          {/* Graphic mockup */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-25"></div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-slate-500 font-mono ml-2">esp32_wlan_node.json</span>
            </div>

            <div className="border border-slate-800 bg-slate-950/40 rounded-xl p-4 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-2 w-20 bg-slate-800 rounded"></div>
                <div className="h-2 w-32 bg-slate-800 rounded"></div>
                <div className="h-2 w-16 bg-slate-800 rounded"></div>
              </div>
              <div className="relative flex items-center justify-center mr-4">
                <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <Icon name="Cpu" className="w-4 h-4 text-blue-500 animate-pulse" />
                </div>
                <div className="absolute -right-6 w-6 h-0.5 bg-rose-500/50"></div>
                <div className="absolute -right-8 w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 border-t border-slate-800/60 pt-8 max-w-lg">
          <blockquote className="text-slate-400 text-sm italic leading-relaxed">
            &ldquo;StemFlow giúp học sinh của chúng tôi tiếp cận với lập trình nhúng và thiết kế mạch điện tử chỉ trong vài phút, loại bỏ hoàn toàn chi phí phần cứng vật lý đắt đỏ.&rdquo;
          </blockquote>
          <div className="mt-4">
            <cite className="not-italic text-sm font-semibold text-white block">
              Thầy Nguyễn Văn An
            </cite>
            <span className="text-xs text-slate-500">
              Giám đốc Trung tâm STEM EduTech
            </span>
          </div>
        </div>

      </section>

    </div>
  );
}
