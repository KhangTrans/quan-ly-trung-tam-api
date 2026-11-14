import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string({ message: 'Tên không được bỏ trống' }).min(2, 'Tên ít nhất 2 ký tự'),
    email: z.string({ message: 'Email không được bỏ trống' }).email('Email không đúng định dạng'),
    password: z.string({ message: 'Mật khẩu không được bỏ trống' }).min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    phone: z.string().optional(),
    role: z.enum(['admin', 'staff', 'teacher', 'student']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ message: 'Email không được bỏ trống' }).email('Email không đúng định dạng'),
    password: z.string({ message: 'Mật khẩu không được bỏ trống' }),
  }),
});
