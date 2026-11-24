import swaggerJSDoc from 'swagger-jsdoc';
import { ENV } from './env';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Minh Tu Japanese Language Center API (MTCenter)',
    version: '1.0.0',
    description: `### Tài liệu API Hệ Thống Quản Lý Trung Tâm Nhật Ngữ Minh Tu
- **Xác thực**: Stateless OTP qua Email & JWT Bearer Token, tích hợp Firebase Auth.
- **Phân quyền**: Admin, Staff, Teacher, Student.
- **Quản lý**: Khóa học (N5 - N1, Kaiwa), Học viên, Ghi danh, Ca học, Phòng học.`,
    contact: {
      name: 'Minh Tu Center Technical Team',
      email: ENV.MAIL_SENDER_EMAIL,
    },
  },
  servers: [
    {
      url: `http://localhost:${ENV.PORT}/api/v1`,
      description: 'Development Server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Đăng ký, Đăng nhập, Stateless OTP & Firebase Auth' },
    { name: 'Courses', description: 'Quản lý danh sách khóa học tiếng Nhật' },
    { name: 'Enrollments', description: 'Đăng ký học & Tiếp nhận tư vấn' },
    { name: 'Health', description: 'Kiểm tra trạng thái máy chủ' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Nhập JWT Token theo định dạng: Bearer <token>',
      },
    },
    schemas: {
      ApiResponseSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Thao tác thành công' },
          data: { type: 'object' },
        },
      },
      ApiResponseError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Mô tả thông báo lỗi' },
          errors: { type: 'object' },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6735c05c58a5e0d297a7e112' },
          name: { type: 'string', example: 'Nguyễn Văn A' },
          email: { type: 'string', example: 'nguyenvana@gmail.com' },
          phone: { type: 'string', example: '0901234567' },
          role: {
            type: 'string',
            enum: ['admin', 'staff', 'teacher', 'student'],
            example: 'student',
          },
          isEmailVerified: { type: 'boolean', example: true },
          isActive: { type: 'boolean', example: true },
          avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Course: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6735c05c58a5e0d297a7e334' },
          title: { type: 'string', example: 'Khóa học Tiếng Nhật Sơ Cấp N5' },
          code: { type: 'string', example: 'JPN-N5-2026' },
          level: {
            type: 'string',
            enum: ['N5', 'N4', 'N3', 'N2', 'N1', 'Kaiwa'],
            example: 'N5',
          },
          description: { type: 'string', example: 'Khóa học cho người mới bắt đầu' },
          textbook: { type: 'string', example: 'Minna no Nihongo I' },
          totalSessions: { type: 'number', example: 48 },
          tuitionFee: { type: 'number', example: 3500000 },
          maxStudents: { type: 'number', example: 20 },
          status: {
            type: 'string',
            enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
            example: 'upcoming',
          },
          isActive: { type: 'boolean', example: true },
        },
      },
    },
  },
};

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/routes/*.js',
    './dist/routes/*.js',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
