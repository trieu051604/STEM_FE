import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';
import { Switch } from '@/components/ui/Switch';
import { useQuery } from '@tanstack/react-query';
import { studentsApi } from '@/services/schoolAdminApi';

// Password validation regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const passwordValidation = z.string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ hoa')
  .regex(/[a-z]/, 'Mật khẩu phải chứa ít nhất 1 chữ thường')
  .regex(/\d/, 'Mật khẩu phải chứa ít nhất 1 số')
  .regex(/[@$!%*?&]/, 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (@$!%*?&)');

// Form Schema for User
export const userFormSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Email không hợp lệ'),
  password: z.string().optional(),
  fullName: z.string().min(1, 'Họ tên không được để trống').min(2, 'Họ tên phải có ít nhất 2 ký tự'),
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
  email: z.string().min(1, 'Email không được để trống').email('Email không hợp lệ'),
  password: passwordValidation.optional(),
  fullName: z.string().min(1, 'Họ tên không được để trống').min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  phone: z.string()
    .min(1, 'Số điện thoại không được để trống')
    .regex(/^[0-9]{10}$/, 'Số điện thoại phải có đúng 10 chữ số'),
  gender: z.string().min(1, 'Vui lòng chọn giới tính'),
  dateOfBirth: z.string().min(1, 'Ngày sinh không được để trống'),
  address: z.string().min(1, 'Địa chỉ không được để trống'),
  isActive: z.boolean().optional(),
});

export type StudentFormData = z.infer<typeof studentFormSchema>;

// Form Schema for Course (Science Subject)
export const courseFormSchema = z.object({
  title: z.string()
    .min(1, 'Tên môn học không được để trống')
    .min(2, 'Tên môn học phải có ít nhất 2 ký tự')
    .max(200, 'Tên môn học không được quá 200 ký tự'),
  description: z.string().optional(),
  syllabusId: z.number().optional(),
  estimatedHours: z.number().min(1, 'Thời lượng phải lớn hơn 0').optional(),
  isRequired: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => {
  const invalidChars = /[<>{}\\]/;
  if (invalidChars.test(data.title)) {
    return false;
  }
  return true;
}, {
  message: 'Tên môn học không được chứa ký tự đặc biệt',
  path: ['title'],
});

export type CourseFormData = z.infer<typeof courseFormSchema>;

// Form Schema for Class
export const classFormSchema = z.object({
  classCode: z.string().min(1, 'Mã lớp không được để trống'),
  gradeLevelId: z.number().min(1, 'Vui lòng chọn khối lớp'),
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
  fullName: z.string().min(1, 'Họ tên không được để trống').min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().min(1, 'Email không được để trống').email('Email không hợp lệ'),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^[0-9]{10}$/.test(val), {
      message: 'Số điện thoại phải có đúng 10 chữ số',
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
            placeholder="Ít nhất 8 ký tự: 1 hoa, 1 thường, 1 số, 1 đặc biệt"
            error={!!errors.password}
            {...register('password')}
          />
        </FormField>
      )}

      <FormField label="Họ và tên" required error={errors.fullName?.message}>
        <Input
          placeholder="Nguyễn Văn A"
          error={!!errors.fullName}
          {...register('fullName')}
        />
      </FormField>

      <FormField label="Số điện thoại" required error={errors.phone?.message}>
        <Input
          type="tel"
          placeholder="0xxx xxx xxx (10 chữ số)"
          error={!!errors.phone}
          {...register('phone')}
        />
      </FormField>

      <FormField label="Giới tính" required error={errors.gender?.message}>
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

      <FormField label="Ngày sinh" required error={errors.dateOfBirth?.message}>
        <Input
          type="date"
          error={!!errors.dateOfBirth}
          {...register('dateOfBirth')}
        />
      </FormField>

      <FormField label="Địa chỉ" required error={errors.address?.message}>
        <Textarea
          placeholder="Địa chỉ"
          error={!!errors.address}
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
  error?: string | null;
  syllabi?: { id: number; title: string }[];
}

export function CourseForm({ onSubmit, onCancel, loading, defaultValues, error, syllabi }: CourseFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues,
  });

  const selectedSyllabusId = watch('syllabusId');

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

      {syllabi && syllabi.length > 0 && (
        <FormField label="Syllabus gốc" error={errors.syllabusId?.message}>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register('syllabusId', { valueAsNumber: true })}
          >
            <option value="">-- Chọn Syllabus --</option>
            {syllabi.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          {selectedSyllabusId && (
            <p className="text-xs text-muted-foreground mt-1">
              Khóa học sẽ được tạo từ syllabus đã chọn
            </p>
          )}
        </FormField>
      )}

      <FormField label="Thời lượng ước tính (giờ)" error={errors.estimatedHours?.message}>
        <Input
          type="number"
          min={1}
          placeholder="40"
          {...register('estimatedHours', { valueAsNumber: true })}
        />
      </FormField>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isRequired"
          {...register('isRequired')}
          className="w-4 h-4 rounded border-gray-300"
        />
        <label htmlFor="isRequired" className="text-sm">
          Bắt buộc
        </label>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isActive"
          defaultChecked={true}
          {...register('isActive')}
          className="w-4 h-4 rounded border-gray-300"
        />
        <label htmlFor="isActive" className="text-sm">
          Hoạt động
        </label>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

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
  gradeLevels: { id: number; name: string }[];
  courses: { id: number; title: string }[];
  teachers: { id: number; fullName: string }[];
  error?: string | null;
}

export function ClassForm({ onSubmit, onCancel, loading, defaultValues, gradeLevels, courses, teachers, error }: ClassFormProps) {
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
            placeholder="VD: E_10A1"
            error={!!errors.classCode}
            {...register('classCode')}
          />
        </FormField>

        <FormField label="Khối lớp" required error={errors.gradeLevelId?.message}>
          <Select
            error={!!errors.gradeLevelId}
            options={gradeLevels.map((g) => ({ value: g.id, label: g.name }))}
            placeholder="Chọn khối"
            {...register('gradeLevelId', { valueAsNumber: true })}
          />
        </FormField>

        <FormField label="Môn Science" required error={errors.courseId?.message}>
          <Select
            error={!!errors.courseId}
            options={courses.map((c) => ({ value: c.id, label: c.title }))}
            placeholder="Chọn môn học"
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

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

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
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <FormField label="Họ và tên" required error={errors.fullName?.message}>
        <Input
          placeholder="Nguyễn Văn A"
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
          placeholder="0xxx xxx xxx (10 chữ số)"
          error={!!errors.phone}
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
    </form>
  );
}

interface AssignStudentsFormProps {
  classId: number;
  classCode: string;
  onSubmit: (studentIds: number[]) => Promise<void>;
  onCancel: () => void;
}

export function AssignStudentsForm({ classId, classCode, onSubmit, onCancel }: AssignStudentsFormProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [query, setQuery] = useState('');
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students-for-assign', classId, query],
    queryFn: async () => {
      const res = await studentsApi.getAll({ pageNumber: 1, pageSize: 50, search: query });
      return res;
    },
  });

  const students = studentsData?.items || [];
  const availableStudents = students.filter((s) => !selectedIds.includes(s.id));

  const toggleStudent = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIds.length) return;
    await onSubmit(selectedIds);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Tìm kiếm học sinh</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên hoặc email..."
          className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Chọn học sinh cho lớp <span className="text-muted-foreground">{classCode}</span></label>
        <div className="max-h-72 overflow-y-auto rounded-lg border border-border divide-y divide-border">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Đang tải danh sách học sinh...</div>
          ) : availableStudents.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">Không có học sinh phù hợp.</div>
          ) : (
            availableStudents.map((student) => (
              <label key={student.id} className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(student.id)}
                  onChange={() => toggleStudent(student.id)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{student.fullName}</p>
                  <p className="text-xs text-muted-foreground">{student.email}</p>
                </div>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={!selectedIds.length}>
          Thêm {selectedIds.length ? `(${selectedIds.length})` : ''}
        </Button>
      </div>
    </form>
  );
}
