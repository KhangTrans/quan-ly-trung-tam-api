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

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string({ message: 'Email không được bỏ trống' }).email('Email không đúng định dạng'),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email('Email không đúng định dạng').optional(),
    oobCode: z.string().optional(),
  }).refine((data) => data.email || data.oobCode, {
    message: 'Cần cung cấp ít nhất email hoặc oobCode',
    path: ['email'],
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string({ message: 'Email không được bỏ trống' }).email('Email không đúng định dạng'),
    otp: z.string({ message: 'Mã OTP không được bỏ trống' }).length(6, 'Mã OTP phải có đúng 6 chữ số'),
    otpToken: z.string({ message: 'otpToken không được bỏ trống' }).min(1, 'otpToken không được để trống'),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    email: z.string({ message: 'Email không được bỏ trống' }).email('Email không đúng định dạng'),
  }),
});

export const firebaseAuthSchema = z.object({
  body: z.object({
    idToken: z.string({ message: 'Firebase ID Token không được bỏ trống' }).min(1, 'ID Token không được rỗng'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({ message: 'Refresh token không được bỏ trống' }).min(1, 'Refresh token không được để trống'),
  }),
});

export const googleAuthSchema = z.object({
  body: z
    .object({
      idToken: z.string().optional(),
      credential: z.string().optional(),
    })
    .refine((data) => data.idToken || data.credential, {
      message: 'Cần cung cấp Google idToken hoặc credential',
      path: ['idToken'],
    }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string({ message: 'Email không được bỏ trống' }).email('Email không đúng định dạng'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string({ message: 'Email không được bỏ trống' }).email('Email không đúng định dạng'),
    otp: z.string({ message: 'Mã OTP không được bỏ trống' }).length(6, 'Mã OTP phải có đúng 6 chữ số'),
    otpToken: z.string({ message: 'otpToken không được bỏ trống' }).min(1, 'otpToken không được để trống'),
    newPassword: z.string({ message: 'Mật khẩu mới không được bỏ trống' }).min(6, 'Mật khẩu mới tối thiểu 6 ký tự'),
  }),
});

