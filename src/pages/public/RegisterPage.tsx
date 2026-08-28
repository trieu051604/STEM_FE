import { useState, useRef } from 'react';
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
    .min(1, { message: 'Số điện thoại không được để trống.' })
    .regex(VN_PHONE_REGEX, { message: 'Số điện thoại không hợp lệ (10 số, đầu số VN).' }),
  password: z
    .string()
    .min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'Vui lòng xác nhận mật khẩu.' }),
  website: z.string().optional(),
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
  const [showB2BPass, setShowB2BPass] = useState(false);
  const [showB2BConfirmPass, setShowB2BConfirmPass] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background font-sans selection:bg-brand-500/30 relative text-foreground transition-colors duration-300">
      
      {/* Left Side (Forms Area) */}
      <main className="flex items-center justify-center p-8 sm:p-12 md:p-16 lg:p-20 bg-background transition-colors duration-300 relative">
        
        {/* Top-Right Theme Toggle */}
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-lg space-y-8">
          
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Quay lại trang chủ
          </Link>

          {/* Logo (Visible on mobile/tablet) */}
          <div className="flex lg:hidden items-center gap-2 mb-8 select-none">
            <Icon name="Cpu" className="text-brand-500 w-8 h-8 animate-pulse" />
            <span className="font-extrabold text-2xl tracking-tight text-foreground">
              Stem<span className="text-brand-500">Flow</span>
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              Đăng ký tài khoản
              <Sparkles className="w-6 h-6 text-brand-500 animate-pulse shrink-0" />
            </h1>
            <p className="text-muted-foreground text-sm">
              Khởi tạo không gian học tập và thực hành STEM chuyên nghiệp của bạn.
            </p>
          </div>

          <div className="space-y-6">
            <form onSubmit={handleB2BSubmit(onB2BSubmit)} className="space-y-4">
              
              {/* --- Section 1: Organization Info --- */}
              <div className="border-b border-border/80 pb-4 mb-4">
                <h3 className="text-[11px] font-bold text-brand-500 uppercase tracking-widest mb-4">1. Thông tin Tổ chức</h3>
                <div className="space-y-4">
                  
                  {/* Tên tổ chức */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2" htmlFor="org-name">
                      Tên trường học / Tổ chức
                    </label>
                    <input
                      {...regB2B('orgName')}
                      className="w-full px-4 py-3 bg-muted/40 border border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl transition-all text-foreground placeholder:text-muted-foreground outline-none text-sm"
                      id="org-name"
                      placeholder="Ví dụ: Trường THPT Chuyên Lê Hồng Phong"
                      disabled={isLoading}
                    />
                    {B2BErrors.orgName && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {B2BErrors.orgName.message}
                      </p>
                    )}
                  </div>

                  {/* Địa chỉ cụ thể */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2" htmlFor="org-address">
                      Địa chỉ cụ thể
                    </label>
                    <input
                      {...regB2B('address')}
                      className="w-full px-4 py-3 bg-muted/40 border border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl transition-all text-foreground placeholder:text-muted-foreground outline-none text-sm"
                      id="org-address"
                      placeholder="Ví dụ: Số 235 Nguyễn Văn Cừ, Quận 5, TP. HCM"
                      disabled={isLoading}
                    />
                    {B2BErrors.address && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {B2BErrors.address.message}
                      </p>
                    )}
                  </div>

                  {/* Quy mô học sinh */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2" htmlFor="org-size">
                      Quy mô học sinh
                    </label>
                    <select
                      {...regB2B('studentSize')}
                      onChange={(e) => setB2BValue('studentSize', e.target.value, { shouldValidate: true })}
                      className="w-full px-4 py-3 bg-muted/40 border border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl transition-all text-foreground outline-none text-sm cursor-pointer"
                      id="org-size"
                      defaultValue=""
                      disabled={isLoading}
                    >
                      <option value="" disabled className="bg-background text-foreground">Chọn quy mô học sinh</option>
                      <option value="Dưới 100" className="bg-background text-foreground">Dưới 100 học sinh</option>
                      <option value="100-500" className="bg-background text-foreground">100 - 500 học sinh</option>
                      <option value="Trên 500" className="bg-background text-foreground">Trên 500 học sinh</option>
                    </select>
                    {B2BErrors.studentSize && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {B2BErrors.studentSize.message}
                      </p>
                    )}
                  </div>

                </div>
              </div>

              {/* --- Section 2: Representative Info (2 Column Grid) --- */}
              <div className="border-b border-border/80 pb-4 mb-4">
                <h3 className="text-[11px] font-bold text-brand-500 uppercase tracking-widest mb-4">2. Người Đại diện liên hệ</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Họ và tên người đại diện */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2" htmlFor="rep-name">
                      Họ và tên người đại diện
                    </label>
                    <input
                      {...regB2B('repName')}
                      className="w-full px-4 py-3 bg-muted/40 border border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl transition-all text-foreground placeholder:text-muted-foreground outline-none text-sm"
                      id="rep-name"
                      placeholder="Ví dụ: Nguyễn Văn An"
                      disabled={isLoading}
                    />
                    {B2BErrors.repName && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {B2BErrors.repName.message}
                      </p>
                    )}
                  </div>

                  {/* Chức vụ */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2" htmlFor="rep-title">
                      Chức vụ
                    </label>
                    <input
                      {...regB2B('title')}
                      className="w-full px-4 py-3 bg-muted/40 border border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl transition-all text-foreground placeholder:text-muted-foreground outline-none text-sm"
                      id="rep-title"
                      placeholder="Hiệu trưởng / Trưởng bộ môn"
                      disabled={isLoading}
                    />
                    {B2BErrors.title && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {B2BErrors.title.message}
                      </p>
                    )}
                  </div>

                  {/* Email liên hệ */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2" htmlFor="rep-email">
                      Email liên hệ
                    </label>
                    <input
                      {...regB2B('email')}
                      className="w-full px-4 py-3 bg-muted/40 border border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl transition-all text-foreground placeholder:text-muted-foreground outline-none text-sm"
                      id="rep-email"
                      placeholder="admin@truong.edu.vn"
                      type="email"
                      disabled={isLoading}
                    />
                    {B2BErrors.email && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {B2BErrors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2" htmlFor="rep-phone">
                      Số điện thoại
                    </label>
                    <input
                      {...regB2B('phone')}
                      className="w-full px-4 py-3 bg-muted/40 border border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl transition-all text-foreground placeholder:text-muted-foreground outline-none text-sm"
                      id="rep-phone"
                      placeholder="0912 345 678"
                      type="tel"
                      disabled={isLoading}
                    />
                    {B2BErrors.phone && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {B2BErrors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* Mật khẩu */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2" htmlFor="b2b-pass">
                      Mật khẩu tài khoản
                    </label>
                    <div className="relative">
                      <input
                        {...regB2B('password')}
                        className="w-full pl-4 pr-10 py-3 bg-muted/40 border border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl transition-all text-foreground placeholder:text-muted-foreground outline-none text-sm"
                        id="b2b-pass"
                        placeholder="••••••••"
                        type={showB2BPass ? 'text' : 'password'}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowB2BPass(!showB2BPass)}
                      >
                        <Icon name={showB2BPass ? 'EyeOff' : 'Eye'} size={16} />
                      </button>
                    </div>
                    {B2BErrors.password && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {B2BErrors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Xác nhận mật khẩu */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2" htmlFor="b2b-confirm-pass">
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                      <input
                        {...regB2B('confirmPassword')}
                        className="w-full pl-4 pr-10 py-3 bg-muted/40 border border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl transition-all text-foreground placeholder:text-muted-foreground outline-none text-sm"
                        id="b2b-confirm-pass"
                        placeholder="••••••••"
                        type={showB2BConfirmPass ? 'text' : 'password'}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowB2BConfirmPass(!showB2BConfirmPass)}
                      >
                        <Icon name={showB2BConfirmPass ? 'EyeOff' : 'Eye'} size={16} />
                      </button>
                    </div>
                    {B2BErrors.confirmPassword && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {B2BErrors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                </div>
              </div>

              {/* --- Section 3: Optional Additional Info --- */}
              <div className="pb-4">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">3. Thông tin bổ sung (Tùy chọn)</h3>
                
                {/* Website */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2" htmlFor="org-website">
                    Website / Fanpage
                  </label>
                  <input
                    {...regB2B('website')}
                    className="w-full px-4 py-3 bg-muted/40 border border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl transition-all text-foreground placeholder:text-muted-foreground outline-none text-sm"
                    id="org-website"
                    placeholder="https://truong.edu.vn"
                    type="url"
                    disabled={isLoading}
                  />
                  {B2BErrors.website && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle size={12} className="shrink-0" /> {B2BErrors.website.message}
                    </p>
                  )}
                </div>

                {/* Upload Giấy tờ pháp lý */}
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                    Giấy chứng nhận / Tài liệu
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-border hover:border-brand-500/50 bg-muted/20 hover:bg-muted/40 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    {uploadingFile ? (
                      <>
                        <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                        <span className="text-xs font-semibold text-brand-500">Đang tải lên...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-muted-foreground group-hover:text-brand-500 transition-colors" />
                        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                          {uploadedFile ? uploadedFile.originalName : 'Tải lên tài liệu xác thực trường học (PDF, JPG, PNG)'}
                        </span>
                      </>
                    )}
                    <span className="text-[10px] text-muted-foreground/70">
                      Tối đa 10MB • Quyết định thành lập hoặc Giấy phép hoạt động
                    </span>
                  </div>

                  {uploadedFile && (
                    <div className="mt-2 flex items-center justify-between p-2.5 bg-muted/40 rounded-lg border border-border text-xs">
                      <span className="text-foreground truncate max-w-xs">{uploadedFile.originalName}</span>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                        className="text-destructive hover:underline font-semibold"
                      >
                        Xóa
                      </button>
                    </div>
                  )}

                  {fileError && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle size={12} className="shrink-0" /> {fileError}
                    </p>
                  )}
                </div>

              </div>

              {/* Submit Error */}
              {serverError && (
                <div className="flex items-center gap-2.5 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang gửi yêu cầu...
                  </>
                ) : (
                  'Gửi yêu cầu khởi tạo trường học'
                )}
              </button>

            </form>

            <div className="text-center pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Đã có tài khoản quản trị trường?
                <Link to="/login" className="text-brand-500 font-bold hover:underline ml-1">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Right Side (Branding & Showcase Area) */}
      <section className="hidden lg:flex relative bg-muted/30 border-l border-border text-foreground flex-col justify-between p-16 overflow-hidden select-none transition-colors duration-300">
        
        {/* Engineering dot grid background */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
        
        {/* Glowing blurs */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Top Branding logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <Icon name="Cpu" className="text-brand-500 w-8 h-8 animate-pulse" />
          <span className="font-extrabold text-2xl tracking-tight text-foreground">
            Stem<span className="text-brand-500">Flow</span>
          </span>
        </div>

        {/* Tagline */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <h2 className="text-4xl font-extrabold text-foreground leading-tight">
            Khởi tạo không gian <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-emerald-500">
              giáo dục STEM của riêng bạn.
            </span>
          </h2>
          <p className="text-muted-foreground leading-relaxed text-sm font-medium">
            Học tập lập trình cảm biến, lắp ráp mạch điện IoT thực tế ảo an toàn, tiết kiệm trên trình duyệt mà không cần mua thiết bị vật lý đắt đỏ.
          </p>

          {/* Real Virtual Lab Screenshot */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-muted px-4 py-2.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">sketch.ino • ESP32 Lab</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                RUNNING
              </span>
            </div>
            <img 
              src="https://xvookhjvebxszqfdfuen.supabase.co/storage/v1/object/public/avatars/dashboard/1.jpg" 
              alt="StemFlow Virtual Lab Preview" 
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Footer info strip */}
        <div className="relative z-10 border-t border-border pt-6 max-w-lg flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span>Hỗ trợ vi điều khiển ESP32 & Cảm biến</span>
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Cloud Sandbox Online
          </span>
        </div>

      </section>

    </div>
  );
}
