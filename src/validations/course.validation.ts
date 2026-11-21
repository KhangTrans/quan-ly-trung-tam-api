import { z } from 'zod';

export const JAPANESE_LEVELS = [
  'N5',
  'N4',
  'N3',
  'N2',
  'N1',
  'Kaiwa',
  'Luyện thi JLPT',
  'Luyện thi NAT-TEST',
  'JLPT',
  'NAT-TEST',
] as const;

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string({ message: 'Tên khóa học là bắt buộc' }).min(3, 'Tên khóa học ít nhất 3 ký tự').trim(),
    code: z.string({ message: 'Mã khóa học là bắt buộc' }).min(2, 'Mã khóa học ít nhất 2 ký tự').trim().toUpperCase(),
    level: z.enum(JAPANESE_LEVELS, { message: 'Trình độ tiếng Nhật không hợp lệ' }),
    description: z.string().optional().default(''),
    textbook: z.string().optional().default('Minna no Nihongo I'),
    totalSessions: z.coerce
      .number({ message: 'Tổng số buổi học phải là số' })
      .min(1, 'Số buổi học tối thiểu là 1')
      .default(45),
    tuitionFee: z.coerce.number({ message: 'Học phí phải là số' }).min(0, 'Học phí không thể âm'),
    duration: z.string().optional().default('3 tháng'),
    schedule: z.string().optional().default(''),
    maxStudents: z.coerce.number().min(1).max(100).optional().default(20),
    startDate: z.string().optional().nullable(),
    status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional().default('upcoming'),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3).trim().optional(),
    code: z.string().min(2).trim().toUpperCase().optional(),
    level: z.enum(JAPANESE_LEVELS).optional(),
    description: z.string().optional(),
    textbook: z.string().optional(),
    totalSessions: z.coerce.number().min(1).optional(),
    tuitionFee: z.coerce.number().min(0).optional(),
    duration: z.string().optional(),
    schedule: z.string().optional(),
    maxStudents: z.coerce.number().min(1).max(100).optional(),
    startDate: z.string().optional().nullable(),
    status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
    isActive: z.boolean().optional(),
  }),
});
