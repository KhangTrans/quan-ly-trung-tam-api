import { z } from 'zod';

export const createClassroomSchema = z.object({
  branchId: z.string({ error: 'Chi nhánh/Cơ sở là bắt buộc' }).min(1, 'Chi nhánh là bắt buộc'),
  roomCode: z.string({ error: 'Mã phòng học là bắt buộc' }).min(1, 'Mã phòng học là bắt buộc').trim().toUpperCase(),
  capacity: z.number({ error: 'Sức chứa là bắt buộc' }).min(1, 'Sức chứa tối thiểu 1 học viên').max(200, 'Sức chứa tối đa 200'),
  facilities: z.array(z.string()).optional().default(['Bảng từ', 'Máy lạnh', 'Loa nghe']),
  isActive: z.boolean().optional().default(true),
});

export const updateClassroomSchema = createClassroomSchema.partial();
