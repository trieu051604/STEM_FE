import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';
import { Switch } from '@/components/ui/Switch';

// Form Schema for User
export const userFormSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').optional(),
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  role: z.enum(['Teacher', 'Student', 'SchoolAdmin']),
  phone: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UserFormData = z.infer<typeof userFormSchema>;

// Form Schema for Student
export const studentFormSchema = z.object({
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').optional(),
  fullName: z.string().refine((value) => value.trim().length === 0 || value.trim().length >= 2, {
    message: 'Họ tên phải có ít nhất 2 ký tự nếu nhập',
  }),
  phone: z.string().refine((value) => value.trim().length === 0 || /^[0-9]{10}$/.test(value), {
    message: 'Số điện thoại phải có đúng 10 chữ số nếu nhập',
  }),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type StudentFormData = z.infer<typeof studentFormSchema>;

// Form Schema for Course
export const courseFormSchema = z.object({
  title: z.string().min(2, 'Tên khóa học phải có ít nhất 2 ký tự'),
  description: z.string().optional(),
});

export type CourseFormData = z.infer<typeof courseFormSchema>;

// Form Schema for Class
export const classFormSchema = z.object({
  classCode: z.string().min(1, 'Mã lớp không được để trống'),
  courseId: z.number().min(1, 'Vui lòng chọn khóa học'),
  teacherId: z.number().optional(),
  startDate: z.string().min(1, 'Ngày bắt đầu không được để trống'),
  endDate: z.string().min(1, 'Ngày kết thúc không được để trống'),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: 'Ngày kết thúc phải sau ngày bắt đầu',
  path: ['endDate'],
});

export type ClassFormData = z.infer<typeof classFormSchema>;

// Form Schema for Teacher
export const teacherFormSchema = z.object({
  fullName: z.string().refine((value) => value.trim().length === 0 || value.trim().length >= 2, {
    message: 'Họ tên phải có ít nhất 2 ký tự nếu nhập',
  }),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().refine((value) => value.trim().length === 0 || /^[0-9]{10}$/.test(value), {
    message: 'Số điện thoại phải có đúng 10 chữ số nếu nhập',
  }),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type TeacherFormData = z.infer<typeof teacherFormSchema>;

// Generic Form Field Component
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, error, required, children, className = '' }: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Generic Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error, className = '', ...props }: InputProps) {
  return (
    <input
      className={`flex h-10 w-full rounded-lg border ${error ? 'border-destructive' : 'border-border'
        } bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

// Generic Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ error, className = '', ...props }: TextareaProps) {
  return (
    <textarea
      className={`flex min-h-[80px] w-full rounded-lg border ${error ? 'border-destructive' : 'border-border'
        } bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none ${className}`}
      {...props}
    />
  );
}

// Generic Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export function Select({ error, options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <select
      className={`flex h-10 w-full rounded-lg border ${error ? 'border-destructive' : 'border-border'
        } bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// Form Actions Component
interface FormActionsProps {
  onCancel: () => void;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
}

export function FormActions({ onCancel, loading, submitText = 'Lưu', cancelText = 'Hủy' }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-border">
      <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
        {cancelText}
      </Button>
      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Icon name="Loader2" className="w-4 h-4 animate-spin" />
            Đang lưu...
          </>
        ) : (
          submitText
        )}
      </Button>
    </div>
  );
}

// User Form Component
interface UserFormProps {
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  defaultValues?: Partial<UserFormData>;
  error?: string | null;
}

export function UserForm({ onSubmit, onCancel, loading, defaultValues, error }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Email" required error={errors.email?.message}>
        <Input
          type="email"
          placeholder="email@example.com"
          error={!!errors.email}
          {...register('email')}
        />
      </FormField>

      <FormField label="Mật khẩu" error={errors.password?.message}>
        <Input
          type="password"
          placeholder="Nhập mật khẩu"
          error={!!errors.password}
          {...register('password')}
        />
      </FormField>

      <FormField label="Họ và tên" required error={errors.fullName?.message}>
        <Input
          placeholder="Nguyễn Văn A"
          error={!!errors.fullName}
          {...register('fullName')}
        />
      </FormField>

      <FormField label="Vai trò" required error={errors.role?.message}>
        <Select
          error={!!errors.role}
          options={[
            { value: 'Teacher', label: 'Giáo viên' },
            { value: 'Student', label: 'Học sinh' },
            { value: 'SchoolAdmin', label: 'Quản trị trường' },
          ]}
          placeholder="Chọn vai trò"
          {...register('role')}
        />
      </FormField>

      <FormField label="Số điện thoại" error={errors.phone?.message}>
        <Input
          type="tel"
          placeholder="0xxx xxx xxx"
          {...register('phone')}
        />
      </FormField>

      <FormField label="Giới tính" error={errors.gender?.message}>
        <Select
          error={!!errors.gender}
          options={[
            { value: 'Male', label: 'Nam' },
            { value: 'Female', label: 'Nữ' },
            { value: 'Other', label: 'Khác' },
          ]}
          placeholder="Chọn giới tính"
          {...register('gender')}
        />
      </FormField>

      <FormField label="Ngày sinh" error={errors.dateOfBirth?.message}>
        <Input
          type="date"
          {...register('dateOfBirth')}
        />
      </FormField>

      <FormField label="Địa chỉ" error={errors.address?.message}>
        <Textarea
          placeholder="Địa chỉ"
          {...register('address')}
        />
      </FormField>

      <FormField label="Trạng thái" error={errors.isActive?.message}>
        <Select
          error={!!errors.isActive}
          options={[
            { value: 'true', label: 'Hoạt động' },
            { value: 'false', label: 'Không hoạt động' },
          ]}
          {...register('isActive')}
        />
      </FormField>

      <FormActions onCancel={onCancel} loading={loading} />
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </form>
  );
}

// Student Form Component
interface StudentFormProps {
  onSubmit: (data: StudentFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  defaultValues?: Partial<StudentFormData>;
  hidePassword?: boolean;
  error?: string | null;
}

export function StudentForm({ onSubmit, onCancel, loading, defaultValues, hidePassword, error }: StudentFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Email" required error={errors.email?.message}>
        <Input
          type="email"
          placeholder="email@example.com"
          error={!!errors.email}
          {...register('email')}
        />
      </FormField>

      {!hidePassword && (
        <FormField label="Mật khẩu" error={errors.password?.message}>
          <Input
            type="password"
            placeholder="Nhập mật khẩu (tùy chọn)"
            error={!!errors.password}
            {...register('password')}
          />
        </FormField>
      )}

      <FormField label="Họ và tên" error={errors.fullName?.message}>
        <Input
          placeholder="Nguyễn Văn A (tùy chọn)"
          error={!!errors.fullName}
          {...register('fullName')}
        />
      </FormField>

      <FormField label="Số điện thoại" error={errors.phone?.message}>
        <Input
          type="tel"
          placeholder="0xxx xxx xxx"
          {...register('phone')}
        />
      </FormField>

      <FormField label="Giới tính" error={errors.gender?.message}>
        <Select
          error={!!errors.gender}
          options={[
            { value: '', label: 'Chọn giới tính' },
            { value: 'Male', label: 'Nam' },
            { value: 'Female', label: 'Nữ' },
            { value: 'Other', label: 'Khác' },
          ]}
          {...register('gender')}
        />
      </FormField>

      <FormField label="Ngày sinh" error={errors.dateOfBirth?.message}>
        <Input
          type="date"
          {...register('dateOfBirth')}
        />
      </FormField>

      <FormField label="Địa chỉ" error={errors.address?.message}>
        <Textarea
          placeholder="Địa chỉ"
          {...register('address')}
        />
      </FormField>

      <div className="flex items-center gap-3">
        <Controller
          name="isActive"
          control={control}
          defaultValue={true}
          render={({ field: { value = true, onChange } }) => (
            <Switch
              checked={value}
              onCheckedChange={(checked) => onChange(checked)}
            />
          )}
        />
        <span className="text-sm">Hoạt động</span>
      </div>

      <FormActions onCancel={onCancel} loading={loading} />
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </form>
  );
}

// Course Form Component
interface CourseFormProps {
  onSubmit: (data: CourseFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  defaultValues?: Partial<CourseFormData>;
}

export function CourseForm({ onSubmit, onCancel, loading, defaultValues }: CourseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Tên khóa học" required error={errors.title?.message}>
        <Input
          placeholder="Arduino Cơ bản"
          error={!!errors.title}
          {...register('title')}
        />
      </FormField>

      <FormField label="Mô tả" error={errors.description?.message}>
        <Textarea
          placeholder="Mô tả khóa học..."
          {...register('description')}
        />
      </FormField>

      <FormActions onCancel={onCancel} loading={loading} />
    </form>
  );
}

// Class Form Component
interface ClassFormProps {
  onSubmit: (data: ClassFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  defaultValues?: Partial<ClassFormData>;
  courses: { id: number; title: string }[];
  teachers: { id: number; fullName: string }[];
}

export function ClassForm({ onSubmit, onCancel, loading, defaultValues, courses, teachers }: ClassFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classFormSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Mã lớp" required error={errors.classCode?.message} className="col-span-2">
          <Input
            placeholder="VD: IOT101"
            error={!!errors.classCode}
            {...register('classCode')}
          />
        </FormField>

        <FormField label="Khóa học" required error={errors.courseId?.message}>
          <Select
            error={!!errors.courseId}
            options={courses.map((c) => ({ value: c.id, label: c.title }))}
            placeholder="Chọn khóa học"
            {...register('courseId', { valueAsNumber: true })}
          />
        </FormField>

        <FormField label="Giáo viên phụ trách" error={errors.teacherId?.message}>
          <Select
            error={!!errors.teacherId}
            options={[
              { value: '', label: 'Chưa chọn' },
              ...teachers.map((t) => ({ value: t.id, label: t.fullName })),
            ]}
            placeholder="Chọn giáo viên"
            {...register('teacherId', { valueAsNumber: true })}
          />
        </FormField>

        <FormField label="Ngày bắt đầu" required error={errors.startDate?.message}>
          <Input
            type="date"
            error={!!errors.startDate}
            {...register('startDate')}
          />
        </FormField>

        <FormField label="Ngày kết thúc" required error={errors.endDate?.message}>
          <Input
            type="date"
            error={!!errors.endDate}
            {...register('endDate')}
          />
        </FormField>
      </div>

      <FormActions onCancel={onCancel} loading={loading} />
    </form>
  );
}

// Teacher Form Component
interface TeacherFormProps {
  onSubmit: (data: TeacherFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  defaultValues?: Partial<TeacherFormData>;
  hidePassword?: boolean;
  error?: string | null;
}

export function TeacherForm({ onSubmit, onCancel, loading, defaultValues, hidePassword, error }: TeacherFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Họ và tên" error={errors.fullName?.message}>
        <Input
          placeholder="Nguyễn Văn A (tùy chọn)"
          error={!!errors.fullName}
          {...register('fullName')}
        />
      </FormField>

      <FormField label="Email" required error={errors.email?.message}>
        <Input
          type="email"
          placeholder="email@example.com"
          error={!!errors.email}
          {...register('email')}
        />
      </FormField>

      <FormField label="Số điện thoại" error={errors.phone?.message}>
        <Input
          type="tel"
          placeholder="0xxx xxx xxx"
          {...register('phone')}
        />
      </FormField>

      <FormField label="Giới tính" error={errors.gender?.message}>
        <Select
          error={!!errors.gender}
          options={[
            { value: '', label: 'Chọn giới tính' },
            { value: 'Male', label: 'Nam' },
            { value: 'Female', label: 'Nữ' },
            { value: 'Other', label: 'Khác' },
          ]}
          {...register('gender')}
        />
      </FormField>

      <FormField label="Ngày sinh" error={errors.dateOfBirth?.message}>
        <Input
          type="date"
          {...register('dateOfBirth')}
        />
      </FormField>

      <FormField label="Địa chỉ" error={errors.address?.message}>
        <Textarea
          placeholder="Địa chỉ"
          {...register('address')}
        />
      </FormField>

      <div className="flex items-center gap-3">
        <Controller
          name="isActive"
          control={control}
          render={({ field: { value = true, onChange } }) => (
            <Switch
              checked={value}
              onCheckedChange={(checked) => onChange(checked)}
            />
          )}
        />
        <label className="text-sm font-medium">Hoạt động</label>
      </div>

      <FormActions onCancel={onCancel} loading={loading} />
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </form>
  );
}
