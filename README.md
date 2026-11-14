# Minh Tu Center Backend API

Hệ thống Backend RESTful API cho Trung tâm Nhật ngữ Minh Tú (MTCenter), xây dựng với **Node.js**, **Express**, **TypeScript** và **MongoDB (Mongoose)** theo mô hình kiến trúc phân lớp (3-tier architecture).

---

## 📁 Cấu trúc thư mục

```text
minhtucenter-api/
├── src/
│   ├── config/             # Cấu hình Database MongoDB, biến môi trường (env)
│   ├── constants/          # Hằng số HTTP status, thông điệp hệ thống
│   ├── controllers/        # Điều phối request / response (Auth, Course, Enrollment)
│   ├── middlewares/        # Middlewares xác thực JWT, phân quyền, validate Zod, bắt lỗi tập trung
│   ├── models/             # Mongoose Models & Schemas (User, Course, Enrollment)
│   ├── routes/             # Định tuyến API theo từng resource (/auth, /courses, /enrollments)
│   ├── services/           # Nghiệp vụ xử lý logic chính (Business Logic)
│   ├── types/              # Khai báo TypeScript types, interfaces
│   ├── utils/              # Helper hàm tiện ích (ApiResponse, AppError)
│   ├── validations/        # Schema kiểm tra tính hợp lệ dữ liệu đầu vào (Zod)
│   ├── app.ts              # Thiết lập Express Application & Middlewares
│   └── server.ts           # Điểm khởi chạy ứng dụng (Entry Point)
├── .env.example            # Mẫu biến môi trường
├── .env                    # Biến môi trường cục bộ
├── .gitignore              # Bỏ qua node_modules, dist, .env
├── package.json            # Quản lý dependencies & scripts
├── tsconfig.json           # Cấu hình TypeScript compiler
└── README.md
```

---

## 🚀 Hướng dẫn khởi chạy

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Thiết lập biến môi trường
Kiểm tra file `.env` (được sao chép từ `.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/minhtucenter
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### 3. Chạy chế độ phát triển (Development)
```bash
npm run dev
```

### 4. Build & Chạy Production
```bash
npm run build
npm start
```

---

## 📌 Danh sách Endpoints cơ bản

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Public | Kiểm tra trạng thái máy chủ (Health check) |
| `POST` | `/api/v1/auth/register` | Public | Đăng ký tài khoản |
| `POST` | `/api/v1/auth/login` | Public | Đăng nhập hệ thống (nhận JWT Token) |
| `GET` | `/api/v1/auth/me` | Authenticated | Lấy thông tin user hiện tại |
| `GET` | `/api/v1/courses` | Public | Lấy danh sách khóa học (tìm kiếm, lọc N5-N1, phân trang) |
| `GET` | `/api/v1/courses/:id` | Public | Xem chi tiết khóa học |
| `POST` | `/api/v1/courses` | Admin, Staff | Thêm khóa học mới |
| `PUT` | `/api/v1/courses/:id` | Admin, Staff | Cập nhật thông tin khóa học |
| `DELETE`| `/api/v1/courses/:id` | Admin | Xóa khóa học |
| `POST` | `/api/v1/enrollments` | Public | Đăng ký học / nhận tư vấn |
| `GET` | `/api/v1/enrollments` | Admin, Staff | Danh sách học viên đăng ký |
| `PATCH`| `/api/v1/enrollments/:id/status` | Admin, Staff | Cập nhật trạng thái duyệt học viên |
