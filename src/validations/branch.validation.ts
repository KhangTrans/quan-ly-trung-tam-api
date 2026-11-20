import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string({ error: 'Tên cơ sở/chi nhánh là bắt buộc' }).min(3, 'Tên cơ sở tối thiểu 3 ký tự').trim(),
  code: z.string({ error: 'Mã cơ sở là bắt buộc' }).min(2, 'Mã cơ sở tối thiểu 2 ký tự').trim().toUpperCase(),
  address: z.string({ error: 'Địa chỉ là bắt buộc' }).min(5, 'Địa chỉ tối thiểu 5 ký tự').trim(),
  phone: z.string({ error: 'Số điện thoại liên hệ là bắt buộc' }).min(8, 'Số điện thoại không hợp lệ').trim(),
  email: z.string().email('Email không đúng định dạng').optional().or(z.literal('')),
  isActive: z.boolean().optional().default(true),
});

export const updateBranchSchema = createBranchSchema.partial();
