import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ENV } from '../config/env';
import {
  Branch,
  Classroom,
  ShiftSlot,
  User,
  Course,
  Class,
  Student,
  Enrollment,
} from '../models';

const seedDatabase = async () => {
  console.log('🌱 Bắt đầu quá trình Seed dữ liệu mẫu cho Minh Tu Center...');
  console.log(`📡 Đang kết nối tới MongoDB: ${ENV.MONGODB_URI.split('@')[1] || ENV.MONGODB_URI}`);

  try {
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('✅ Đã kết nối cơ sở dữ liệu thành công!');

    // 1. Dọn dẹp dữ liệu cũ (chỉ các collections khởi tạo)
    console.log('🧹 Đang làm sạch dữ liệu cũ...');
    await Promise.all([
      Branch.deleteMany({}),
      Classroom.deleteMany({}),
      ShiftSlot.deleteMany({}),
      User.deleteMany({}),
      Course.deleteMany({}),
      Class.deleteMany({}),
      Student.deleteMany({}),
      Enrollment.deleteMany({}),
    ]);

    // 2. Tạo Chi nhánh (Branches)
    console.log('🏢 Đang tạo danh sách Chi nhánh...');
    const branches = await Branch.create([
      {
        name: 'Cơ sở Nguyễn Văn Cừ - Ninh Kiều',
        code: 'CT-NVC',
        address: 'Số 256, Đường Nguyễn Văn Cừ, P. An Hòa, Q. Ninh Kiều, TP. Cần Thơ',
        phone: '0292.3838.888',
        email: 'trungtamnhatnguminhtu@gmail.com',
        isActive: true,
      },
      {
        name: 'Văn phòng Đại diện Khu 3 ĐH Cần Thơ',
        code: 'CT-DHCT',
        address: 'Số 01 Lý Tự Trọng, P. An Phú, Q. Ninh Kiều, TP. Cần Thơ',
        phone: '0292.3838.999',
        email: 'ctu.minhtu@gmail.com',
        isActive: true,
      },
    ]);
    const branch1 = branches[0];
    const branch2 = branches[1];

    // 3. Tạo Phòng học (Classrooms)
    console.log('🏫 Đang tạo danh sách Phòng học...');
    const classrooms = await Classroom.create([
      {
        branchId: branch1._id,
        roomCode: 'P101',
        capacity: 25,
        facilities: ['Bảng từ chống lóa', 'Máy lạnh Daikin', 'Loa trợ giảng', 'Máy chiếu'],
        isActive: true,
      },
      {
        branchId: branch1._id,
        roomCode: 'P102',
        capacity: 20,
        facilities: ['Bảng từ', 'Máy lạnh', 'Tivi 65 inch'],
        isActive: true,
      },
      {
        branchId: branch2._id,
        roomCode: 'LAB-01',
        capacity: 35,
        facilities: ['Tai nghe luyện thi JLPT', 'Máy lạnh', 'Hệ thống âm thanh vòm'],
        isActive: true,
      },
    ]);
    const room101 = classrooms[0];

    // 4. Tạo Ca học chuẩn (ShiftSlots)
    console.log('⏰ Đang tạo danh sách Ca học chuẩn...');
    const shiftSlots = await ShiftSlot.create([
      {
        name: 'Ca Sáng (08:00 - 09:30)',
        startTime: '08:00',
        endTime: '09:30',
        period: 'morning',
        isActive: true,
      },
      {
        name: 'Ca Chiều (14:00 - 15:30)',
        startTime: '14:00',
        endTime: '15:30',
        period: 'afternoon',
        isActive: true,
      },
      {
        name: 'Ca Tối 1 (17:45 - 19:15)',
        startTime: '17:45',
        endTime: '19:15',
        period: 'evening',
        isActive: true,
      },
      {
        name: 'Ca Tối 2 (19:30 - 21:00)',
        startTime: '19:30',
        endTime: '21:00',
        period: 'evening',
        isActive: true,
      },
    ]);
    const shiftEvening1 = shiftSlots[2];

    // 5. Tạo Tài khoản Nhân sự & Giáo viên
    console.log('👤 Đang tạo tài khoản Nhân sự & Giảng viên...');
    const defaultPassword = 'Password@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const users = await User.create([
      {
        name: 'Ban Giám Đốc Minh Tú',
        email: 'admin@minhtucenter.com',
        password: hashedPassword,
        phone: '0909123456',
        role: 'admin',
        branchId: branch1._id,
        isActive: true,
        isEmailVerified: true,
      },
      {
        name: 'Nguyễn Thị Thu (Giáo vụ)',
        email: 'giaovu@minhtucenter.com',
        password: hashedPassword,
        phone: '0909234567',
        role: 'staff',
        branchId: branch1._id,
        isActive: true,
        isEmailVerified: true,
      },
      {
        name: 'Sensei Yamada Kenji',
        email: 'yamada.kenji@minhtucenter.com',
        password: hashedPassword,
        phone: '0909345678',
        role: 'teacher',
        branchId: branch1._id,
        salaryRatePerHour: 250000,
        isActive: true,
        isEmailVerified: true,
      },
      {
        name: 'Sensei Trần Thị Mai (N2)',
        email: 'tranmai@minhtucenter.com',
        password: hashedPassword,
        phone: '0909456789',
        role: 'teacher',
        branchId: branch1._id,
        salaryRatePerHour: 180000,
        isActive: true,
        isEmailVerified: true,
      },
    ]);
    const teacherMai = users[3];

    // 6. Tạo Chương trình Khóa học (Courses)
    console.log('📚 Đang tạo danh sách Khóa học chuẩn...');
    const courses = await Course.create([
      {
        title: 'Tiếng Nhật Sơ Cấp N5 (Minna no Nihongo)',
        code: 'JP-N5-BASIC',
        level: 'N5',
        description: 'Chương trình nền tảng từ Bảng chữ cái đến bài 25 sách Minna no Nihongo. Đạt chuẩn đầu ra JLPT N5.',
        textbook: 'Minna no Nihongo I (Bài 1 - 25) + Flashcard Kanji',
        totalSessions: 45,
        tuitionFee: 3500000,
        duration: '3 tháng',
        schedule: 'Tối Thứ 2-4-6 (17:45 - 19:15)',
        maxStudents: 20,
        status: 'upcoming',
        isActive: true,
      },
      {
        title: 'Tiếng Nhật Sơ Cấp N4 (Minna no Nihongo II)',
        code: 'JP-N4-ADV',
        level: 'N4',
        description: 'Tiếp nối N5, học từ bài 26 đến 50. Đáp ứng điều kiện ứng tuyển Kỹ sư và Du học Nhật Bản.',
        textbook: 'Minna no Nihongo II (Bài 26 - 50)',
        totalSessions: 45,
        tuitionFee: 4000000,
        duration: '3 tháng',
        schedule: 'Tối Thứ 3-5-7 (19:30 - 21:00)',
        maxStudents: 20,
        status: 'upcoming',
        isActive: true,
      },
      {
        title: 'Luyện thi JLPT N3 Cấp Tốc',
        code: 'JP-N3-SPEED',
        level: 'N3',
        description: 'Chuyên đề Ngữ pháp, Từ vựng, Đọc hiểu và Luyện đề thi thử JLPT N3 sát đề thực tế.',
        textbook: 'Shinkanzen Master N3 + Soumatome',
        totalSessions: 60,
        tuitionFee: 5500000,
        duration: '4 tháng',
        maxStudents: 25,
        status: 'upcoming',
        isActive: true,
      },
      {
        title: 'Kaiwa Tiếng Nhật Giao Tiếp & Phỏng Vấn Doanh Nghiệp',
        code: 'JP-KAIWA-PRO',
        level: 'Kaiwa',
        description: 'Rèn luyện phản xạ giao tiếp tự nhiên với giáo viên bản xứ, luyện trả lời phỏng vấn xin việc/COE.',
        textbook: 'Nameraka Nihongo Kaiwa',
        totalSessions: 30,
        tuitionFee: 3200000,
        duration: '2 tháng',
        maxStudents: 15,
        status: 'upcoming',
        isActive: true,
      },
    ]);
    const courseN5 = courses[0];

    // 7. Mở Lớp học mẫu (Class)
    console.log('🎓 Đang tạo Lớp học mẫu N5...');
    const sampleClass = await Class.create({
      courseId: courseN5._id,
      branchId: branch1._id,
      classCode: 'N5-2601-CT',
      name: 'Lớp N5 Khóa 2601 (Tối 2-4-6)',
      primaryTeacherId: teacherMai._id,
      defaultClassroomId: room101._id,
      daysOfWeek: [2, 4, 6], // Thứ 2, Thứ 4, Thứ 6
      shiftSlotId: shiftEvening1._id,
      startDate: new Date('2026-12-01'),
      endDateExpected: new Date('2027-02-28'),
      maxStudents: 20,
      currentStudentCount: 2,
      status: 'upcoming',
      notes: 'Lớp học tại phòng P101, chuẩn bị sách Minna bài 1-25 cho học viên ngày khai giảng',
    });

    // 8. Tạo Học viên mẫu (Students) & Ghi danh (Enrollment)
    console.log('👨‍🎓 Đang tạo Học viên & Ghi danh mẫu...');
    const students = await Student.create([
      {
        studentCode: 'MT-HV-26001',
        fullName: 'Nguyễn Văn Hoàng',
        gender: 'male',
        dob: new Date('2002-05-15'),
        phone: '0939111222',
        email: 'hoang.nguyen@gmail.com',
        address: 'Ninh Kiều, Cần Thơ',
        parentContact: {
          name: 'Nguyễn Văn Ba',
          relationship: 'Bố',
          phone: '0903111333',
        },
        inputLevel: 'Chưa biết gì',
        learningObjective: 'Kỹ sư CNTT Nhật Bản',
        status: 'active',
      },
      {
        studentCode: 'MT-HV-26002',
        fullName: 'Lê Thị Mỹ Linh',
        gender: 'female',
        dob: new Date('2004-11-20'),
        phone: '0939333444',
        email: 'mylinh.le@gmail.com',
        address: 'Bình Thủy, Cần Thơ',
        parentContact: {
          name: 'Trần Thị Mười',
          relationship: 'Mẹ',
          phone: '0903555777',
        },
        inputLevel: 'Đã thuộc bảng chữ cái',
        learningObjective: 'Du học Nhật Bản kỳ tháng 04',
        status: 'active',
      },
    ]);

    // Ghi danh vào lớp N5
    await Enrollment.create([
      {
        studentId: students[0]._id,
        classId: sampleClass._id,
        enrollmentDate: new Date(),
        remainingSessions: 45,
        tuitionStatus: 'paid',
        notes: 'Đã đóng đủ học phí qua VietQR',
      },
      {
        studentId: students[1]._id,
        classId: sampleClass._id,
        enrollmentDate: new Date(),
        remainingSessions: 45,
        tuitionStatus: 'partially_paid',
        notes: 'Đã cọc 1,000,000đ giữ chỗ, hẹn ngày khai giảng đóng phần còn lại',
      },
    ]);

    console.log('========================================================');
    console.log('🎉 SEED DỮ LIỆU THÀNH CÔNG LÊN MONGODB ATLAS!');
    console.log('--------------------------------------------------------');
    console.log('📌 Thông tin tài khoản quản trị thử nghiệm:');
    console.log('   - Ban Giám Đốc: admin@minhtucenter.com | Password@123');
    console.log('   - Giáo vụ:      giaovu@minhtucenter.com | Password@123');
    console.log('   - Sensei Mai:   tranmai@minhtucenter.com | Password@123');
    console.log('   - Sensei Yamada:yamada.kenji@minhtucenter.com | Password@123');
    console.log('📌 Dữ liệu đã tạo:');
    console.log(`   - 2 Chi nhánh Cần Thơ (${branch1.code}, ${branch2.code})`);
    console.log(`   - 3 Phòng học (P101, P102, LAB-01)`);
    console.log(`   - 4 Ca học chuẩn (Sáng, Chiều, Tối 1, Tối 2)`);
    console.log(`   - 4 Khóa học (N5, N4, N3, Kaiwa)`);
    console.log(`   - 1 Lớp N5 Khóa 2601 (${sampleClass.classCode})`);
    console.log(`   - 2 Học viên ghi danh (${students[0].fullName}, ${students[1].fullName})`);
    console.log('========================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi trong quá trình seed dữ liệu:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedDatabase();
