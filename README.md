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

# Firebase Configuration (Xác thực Email & Quản lý User)
# Cách 1: Sử dụng đường dẫn file serviceAccountKey.json
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# Cách 2: Nhập trực tiếp qua biến môi trường
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Web API Key (Project Settings -> General -> Web API Key)
FIREBASE_WEB_API_KEY=AIzaSy...

# Cấu hình OTP & Mail từ "Minh Tu"
OTP_EXPIRES_IN_MINUTES=5
MAIL_SENDER_NAME="Minh Tu"
MAIL_SENDER_EMAIL=no-reply@minhtucenter.com

# Cấu hình gửi mail thực tế (Ví dụ dùng Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_SECURE=false
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

## 📖 Swagger API Documentation
- **Giao diện trực quan Swagger UI**: `http://localhost:5000/api-docs`
- **Tệp OpenAPI JSON Spec**: `http://localhost:5000/api-docs.json` (Dùng để import vào Postman, Insomnia, Scalar)

---

## 📌 Danh sách Endpoints cơ bản

### 🔐 Xác thực & Đăng ký tài khoản (Xác thực OTP Email từ "Minh Tu")

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Đăng ký tài khoản mới & gửi mã OTP 6 số về email (hạn 5 phút) |
| `POST` | `/api/v1/auth/verify-otp` | Public | Xác thực OTP & kích hoạt tài khoản (nhận ngay JWT Token) |
| `POST` | `/api/v1/auth/resend-otp` | Public | Gửi lại mã OTP mới khi mã cũ hết hạn |
| `POST` | `/api/v1/auth/login` | Public | Đăng nhập hệ thống (trả về Access Token 15 phút & Refresh Token 7 ngày) |
| `POST` | `/api/v1/auth/refresh-token` | Public | Cấp Access Token mới bằng Refresh Token (Token Rotation) |
| `POST` | `/api/v1/auth/logout` | Authenticated | Đăng xuất & thu hồi Refresh Token hiện tại |
| `POST` | `/api/v1/auth/google` | Public | Đăng nhập / Đăng ký nhanh bằng Google ID Token (Google OAuth 2.0 / GIS) |
| `POST` | `/api/v1/auth/firebase-auth` | Public | Đăng nhập/Đồng bộ tài khoản bằng Firebase ID Token |
| `GET` | `/api/v1/auth/me` | Authenticated | Lấy thông tin tài khoản hiện tại |

### 📚 Quản lý Khóa học & Ghi danh

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Public | Kiểm tra trạng thái máy chủ (Health check) |
| `GET` | `/api/v1/courses` | Public | Lấy danh sách khóa học (tìm kiếm, lọc N5-N1, phân trang) |
| `GET` | `/api/v1/courses/:id` | Public | Xem chi tiết khóa học |
| `POST` | `/api/v1/courses` | Admin, Staff | Thêm khóa học mới |
| `PUT` | `/api/v1/courses/:id` | Admin, Staff | Cập nhật thông tin khóa học |
| `DELETE`| `/api/v1/courses/:id` | Admin | Xóa khóa học |
| `POST` | `/api/v1/enrollments` | Public | Đăng ký học / nhận tư vấn |
| `GET` | `/api/v1/enrollments` | Admin, Staff | Danh sách học viên đăng ký |
| `PATCH`| `/api/v1/enrollments/:id/status` | Admin, Staff | Cập nhật trạng thái duyệt học viên |

---

## 🛠️ Hướng dẫn Cấu hình Firebase cho Xác thực Email

1. **Tạo Firebase Project**: Truy cập [Firebase Console](https://console.firebase.google.com/) và tạo một dự án mới.
2. **Kích hoạt Authentication**:
   - Vào mục **Build** -> **Authentication** -> **Sign-in method**.
   - Bật provider **Email/Password**.
   - (Tùy chọn) Tùy chỉnh mẫu email tại tab **Templates** -> **Email address verification**.
3. **Lấy Service Account Key (Dành cho Backend)**:
   - Vào **Project settings** (biểu tượng bánh răng) -> tab **Service accounts**.
   - Bấm **Generate new private key** để tải file JSON về.
   - Đặt file JSON trong thư mục gốc dự án (ví dụ `serviceAccountKey.json`) và khai báo đường dẫn `FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json` trong `.env`.
4. **Lấy Web API Key (Để Firebase gửi email trực tiếp)**:
   - Tại **Project settings** -> tab **General** -> mục **Web API Key**.
   - Sao chép khóa này và gán vào `FIREBASE_WEB_API_KEY` trong file `.env`.
5. **Quy trình hoạt động**:
   - Người dùng gọi `POST /api/v1/auth/register` với thông tin cá nhân.
   - Server khởi tạo tài khoản trên Firebase Auth và kích hoạt gửi email xác thực.
   - Người dùng bấm vào link xác thực trong hòm thư email của họ.
   - Khi đăng nhập `POST /api/v1/auth/login`, hệ thống tự động kiểm tra trạng thái xác thực từ Firebase, kích hoạt tài khoản trong MongoDB và cấp JWT Token.
