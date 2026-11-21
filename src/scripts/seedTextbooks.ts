import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { Textbook, Course } from '../models';

function generateSamplePdf(filePath: string, title: string, level: string, desc: string) {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 300 >>
stream
BT
/F1 22 Tf
50 780 Td
(${title}) Tj
/F1 14 Tf
0 -40 Td
(Cap Do: ${level}) Tj
0 -30 Td
(Trung Tam Nhat Ngu Minh Tu) Tj
0 -30 Td
(${desc}) Tj
0 -30 Td
(Giao Trinh Chuan Dao Tao Nhat Ngu Tai Minh Tu Center) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000227 00000 n 
0000000578 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
655
%%EOF`;

  fs.writeFileSync(filePath, content);
  console.log('Created PDF:', filePath);
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const uploadDir = path.join(process.cwd(), 'uploads', 'textbooks');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const sampleData = [
    {
      name: 'Minna no Nihongo I (Bài 1 - 25) + Bản dịch',
      code: 'TB-MINNA-01',
      level: 'N5',
      author: '3A Corporation',
      publisher: 'NXB Trẻ',
      totalLessons: 25,
      fileBase: 'minna-nihongo-1.pdf',
      fileSize: 12500000,
      fileSizeFormatted: '12.5 MB',
      description: 'Giáo trình chuẩn sơ cấp tiếng Nhật bài 1 đến 25, giải thích ngữ pháp và từ vựng.',
    },
    {
      name: 'Minna no Nihongo II (Bài 26 - 50)',
      code: 'TB-MINNA-02',
      level: 'N4',
      author: '3A Corporation',
      publisher: 'NXB Trẻ',
      totalLessons: 25,
      fileBase: 'minna-nihongo-2.pdf',
      fileSize: 14200000,
      fileSizeFormatted: '14.2 MB',
      description: 'Giáo trình chuẩn N4 tiếp nối bài 26 đến 50, chuẩn bị nền tảng lên Trung cấp.',
    },
    {
      name: 'Shinkanzen Master N3 - Tổng hợp 4 Kỹ năng',
      code: 'TB-SKZ-N3',
      level: 'N3',
      author: 'Etsuko Tomomatsu',
      publisher: '3A Corporation',
      totalLessons: 30,
      fileBase: 'shinkanzen-master-n3.pdf',
      fileSize: 18500000,
      fileSizeFormatted: '18.5 MB',
      description: 'Chuyên đề Ngữ pháp, Đọc hiểu và Từ vựng phục vụ thi đỗ JLPT N3.',
    },
    {
      name: 'Shadowing: Tiếng Nhật Giao Tiếp Đời Sống',
      code: 'TB-SHADOW-KW',
      level: 'Kaiwa',
      author: 'Hitoshi Saito',
      publisher: 'Kuroshio Publishers',
      totalLessons: 20,
      fileBase: 'kaiwa-shadowing.pdf',
      fileSize: 8400000,
      fileSizeFormatted: '8.4 MB',
      description: 'Luyện phản xạ giao tiếp tự nhiên và phát âm chuẩn giọng bản xứ.',
    },
    {
      name: 'Bộ Đề Thi Thử Chuẩn JLPT N3 - N2 Độc Quyền',
      code: 'TB-EXAM-JLPT',
      level: 'Luyện thi JLPT',
      author: 'Minh Tu Academic Team',
      publisher: 'Minh Tu Center Internal',
      totalLessons: 15,
      fileBase: 'de-thi-thu-jlpt.pdf',
      fileSize: 9800000,
      fileSizeFormatted: '9.8 MB',
      description: 'Bộ đề thi thử sát cấu trúc đề thi thật kèm đáp án và giải thích chi tiết.',
    },
  ];

  for (const item of sampleData) {
    const pdfPath = path.join(uploadDir, item.fileBase);
    generateSamplePdf(pdfPath, item.name, item.level, item.description);

    const fileUrl = `/uploads/textbooks/${item.fileBase}`;

    let textbook = await Textbook.findOne({ code: item.code });
    if (!textbook) {
      textbook = await Textbook.create({
        name: item.name,
        code: item.code,
        level: item.level,
        author: item.author,
        publisher: item.publisher,
        totalLessons: item.totalLessons,
        fileUrl,
        fileName: item.fileBase,
        fileSize: item.fileSize,
        fileSizeFormatted: item.fileSizeFormatted,
        description: item.description,
        isActive: true,
      });
      console.log('Seeded Textbook:', textbook.name);
    } else {
      textbook.fileUrl = fileUrl;
      textbook.fileName = item.fileBase;
      textbook.fileSize = item.fileSize;
      textbook.fileSizeFormatted = item.fileSizeFormatted;
      await textbook.save();
    }

    // Link textbook to matching Course if found
    const course: any = await Course.findOne({
      $or: [
        { level: item.level as any },
        { title: { $regex: item.level, $options: 'i' } }
      ]
    });
    if (course && !course.textbookId) {
      course.textbookId = textbook._id as any;
      course.textbook = textbook.name;
      await course.save();
      console.log(`Linked course "${course.title}" to textbook "${textbook.name}"`);
    }
  }

  console.log('Seed completed successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
