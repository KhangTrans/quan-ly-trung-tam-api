import { z } from 'zod';

export const createShiftSlotSchema = z.object({
  name: z.string({ error: 'Tên ca học là bắt buộc' }).min(2, 'Tên ca học tối thiểu 2 ký tự').trim(),
  startTime: z.string({ error: 'Giờ bắt đầu là bắt buộc' }).regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng giờ không hợp lệ (HH:mm)'),
  endTime: z.string({ error: 'Giờ kết thúc là bắt buộc' }).regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng giờ không hợp lệ (HH:mm)'),
  period: z.enum(['morning', 'afternoon', 'evening'], { error: 'Buổi học không hợp lệ (morning, afternoon, evening)' }),
  isActive: z.boolean().optional().default(true),
});

export const updateShiftSlotSchema = createShiftSlotSchema.partial();
