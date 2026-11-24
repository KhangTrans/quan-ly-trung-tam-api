import { z } from 'zod';

const classBodySchema = z.object({
  courseId: z.string({ message: 'Khóa học là bắt buộc' }).min(1, 'Khóa học là bắt buộc'),
  branchId: z.string({ message: 'Chi nhánh/Cơ sở là bắt buộc' }).min(1, 'Chi nhánh là bắt buộc'),
  classCode: z
    .string({ message: 'Mã lớp học là bắt buộc' })
    .min(1, 'Mã lớp học là bắt buộc')
    .trim()
    .toUpperCase(),
  name: z.string({ message: 'Tên lớp học là bắt buộc' }).min(1, 'Tên lớp học là bắt buộc').trim(),
  primaryTeacherId: z
    .string({ message: 'Giáo viên phụ trách là bắt buộc' })
    .min(1, 'Giáo viên phụ trách là bắt buộc'),
  defaultClassroomId: z
    .string({ message: 'Phòng học mặc định là bắt buộc' })
    .min(1, 'Phòng học mặc định là bắt buộc'),
  daysOfWeek: z
    .array(z.coerce.number().min(2).max(8), { message: 'Lịch học trong tuần là bắt buộc' })
    .min(1, 'Phải chọn ít nhất 1 ngày học trong tuần'),
  shiftSlotId: z.string({ message: 'Ca học là bắt buộc' }).min(1, 'Ca học là bắt buộc'),
  startDate: z.string({ message: 'Ngày khai giảng là bắt buộc' }).min(1, 'Ngày khai giảng là bắt buộc'),
  endDateExpected: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== '' ? val : undefined)),
  maxStudents: z.coerce
    .number({ message: 'Sĩ số tối đa là bắt buộc' })
    .min(1, 'Sĩ số tối thiểu là 1')
    .max(100, 'Sĩ số tối đa là 100')
    .optional()
    .default(20),
  currentStudentCount: z.coerce.number().optional().default(0),
  status: z
    .enum(['upcoming', 'ongoing', 'completed', 'cancelled'], {
      message: 'Trạng thái lớp không hợp lệ',
    })
    .optional()
    .default('upcoming'),
  notes: z.string().optional().default(''),
});

export const createClassSchema = z.object({
  body: classBodySchema,
});

export const updateClassSchema = z.object({
  body: classBodySchema.partial(),
});
