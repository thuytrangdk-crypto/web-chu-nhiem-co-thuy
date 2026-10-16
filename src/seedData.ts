import { ClassData, SeatAssignment, Student, Subject, DisciplineRule, Announcement, Honor, AttendanceRecord, GradeRecord, DisciplineRecord } from './types';

// Helper to generate empty 56 seats (4 columns x 7 rows x 2 seats)
export function generateInitialSeats(): SeatAssignment[] {
  const seats: SeatAssignment[] = [];
  for (let col = 1; col <= 4; col++) {
    for (let row = 1; row <= 7; row++) {
      seats.push({
        seatCode: `D${col}-B${row}-T`,
        column: col,
        row: row,
        position: 'T',
        studentId: null,
      });
      seats.push({
        seatCode: `D${col}-B${row}-P`,
        column: col,
        row: row,
        position: 'P',
        studentId: null,
      });
    }
  }
  return seats;
}

// 36 students for Class 9A2, THCS Đồng Khởi (born 2011 - 2010)
export const initialStudents: Student[] = [
  { id: 'HS9201', fullName: 'Nguyễn Minh Anh', gender: 'Nữ', dob: '14/03/2011', phone: '0912345101', parentPhone: '0988776101', address: '45 Đồng Khởi, Bến Nghé, Q.1' },
  { id: 'HS9202', fullName: 'Trần Đức Bảo', gender: 'Nam', dob: '22/05/2011', phone: '0912345102', parentPhone: '0988776102', address: '12 Nguyễn Huệ, P. Bến Nghé, Q.1' },
  { id: 'HS9203', fullName: 'Lê Thị Cẩm Tú', gender: 'Nữ', dob: '08/01/2011', phone: '0912345103', parentPhone: '0988776103', address: '89 Lê Lợi, Q.1' },
  { id: 'HS9204', fullName: 'Phạm Gia Huy', gender: 'Nam', dob: '30/09/2011', phone: '0912345104', parentPhone: '0988776104', address: '120 Pasteur, P. Bến Nghé, Q.1' },
  { id: 'HS9205', fullName: 'Hoàng Mai Linh', gender: 'Nữ', dob: '11/11/2011', phone: '0912345105', parentPhone: '0988776105', address: '23 Hai Bà Trưng, Q.1' },
  { id: 'HS9206', fullName: 'Vũ Quốc Tuấn', gender: 'Nam', dob: '05/04/2011', phone: '0912345106', parentPhone: '0988776106', address: '78 Lý Tự Trọng, Q.1' },
  { id: 'HS9207', fullName: 'Đặng Thảo Vy', gender: 'Nữ', dob: '19/07/2011', phone: '0912345107', parentPhone: '0988776107', address: '56 Lê Thánh Tôn, Q.1' },
  { id: 'HS9208', fullName: 'Bùi Hoàng Long', gender: 'Nam', dob: '12/02/2011', phone: '0912345108', parentPhone: '0988776108', address: '34 Mạc Thị Bưởi, Q.1' },
  { id: 'HS9209', fullName: 'Đỗ Hải Yến', gender: 'Nữ', dob: '25/08/2011', phone: '0912345109', parentPhone: '0988776109', address: '67 Ngô Đức Kế, Q.1' },
  { id: 'HS9210', fullName: 'Ngô Trọng Khang', gender: 'Nam', dob: '17/06/2011', phone: '0912345110', parentPhone: '0988776110', address: '90 Tôn Đức Thắng, Q.1' },
  { id: 'HS9211', fullName: 'Phan Thị Diễm Hương', gender: 'Nữ', dob: '03/12/2011', phone: '0912345111', parentPhone: '0988776111', address: '11 Lê Duẩn, Q.1' },
  { id: 'HS9212', fullName: 'Dương Thành Đạt', gender: 'Nam', dob: '28/10/2011', phone: '0912345112', parentPhone: '0988776112', address: '24 Nam Kỳ Khởi Nghĩa, Q.1' },
  { id: 'HS9213', fullName: 'Trương Mỹ Duyên', gender: 'Nữ', dob: '15/02/2011', phone: '0912345113', parentPhone: '0988776113', address: '42 Hàm Nghi, Q.1' },
  { id: 'HS9214', fullName: 'Lý Kiến Quốc', gender: 'Nam', dob: '09/05/2011', phone: '0912345114', parentPhone: '0988776114', address: '15 Nguyễn Thị Minh Khai, Q.1' },
  { id: 'HS9215', fullName: 'Hồ Quỳnh Nga', gender: 'Nữ', dob: '21/04/2011', phone: '0912345115', parentPhone: '0988776115', address: '66 Cách Mạng Tháng 8, Q.3' },
  { id: 'HS9216', fullName: 'Lâm Tuấn Kiệt', gender: 'Nam', dob: '14/09/2011', phone: '0912345116', parentPhone: '0988776116', address: '88 Nguyễn Trãi, Q.1' },
  { id: 'HS9217', fullName: 'Võ Ngọc Hân', gender: 'Nữ', dob: '31/03/2011', phone: '0912345117', parentPhone: '0988776117', address: '19 Nguyễn Huệ, Q.1' },
  { id: 'HS9218', fullName: 'Đinh Nhật Nam', gender: 'Nam', dob: '07/11/2011', phone: '0912345118', parentPhone: '0988776118', address: '73 Trương Định, Q.3' },
  { id: 'HS9219', fullName: 'Mai Bảo Trâm', gender: 'Nữ', dob: '18/10/2011', phone: '0912345119', parentPhone: '0988776119', address: '50 Nguyễn Đình Chiểu, Q.3' },
  { id: 'HS9220', fullName: 'Cao Minh Triết', gender: 'Nam', dob: '23/07/2011', phone: '0912345120', parentPhone: '0988776120', address: '101 Phan Đăng Lưu, Phú Nhuận' },
  { id: 'HS9221', fullName: 'Tô Ánh Nguyệt', gender: 'Nữ', dob: '02/06/2011', phone: '0912345121', parentPhone: '0988776121', address: '33 Đinh Tiên Hoàng, Bình Thạnh' },
  { id: 'HS9222', fullName: 'Thái Hữu Phước', gender: 'Nam', dob: '16/12/2011', phone: '0912345122', parentPhone: '0988776122', address: '81 Ngô Tất Tố, Bình Thạnh' },
  { id: 'HS9223', fullName: 'Phùng Kim Chi', gender: 'Nữ', dob: '27/04/2011', phone: '0912345123', parentPhone: '0988776123', address: '95 Xô Viết Nghệ Tĩnh, Bình Thạnh' },
  { id: 'HS9224', fullName: 'Quách Tấn Tài', gender: 'Nam', dob: '10/01/2011', phone: '0912345124', parentPhone: '0988776124', address: '14 Bùi Viện, Q.1' },
  { id: 'HS9225', fullName: 'Chu Thu Hà', gender: 'Nữ', dob: '04/09/2011', phone: '0912345125', parentPhone: '0988776125', address: '39 Cống Quỳnh, Q.1' },
  { id: 'HS9226', fullName: 'Tạ Minh Khôi', gender: 'Nam', dob: '13/05/2011', phone: '0912345126', parentPhone: '0988776126', address: '62 Trần Quang Khải, Q.1' },
  { id: 'HS9227', fullName: 'Hà Thùy Dương', gender: 'Nữ', dob: '29/03/2011', phone: '0912345127', parentPhone: '0988776127', address: '48 Hai Bà Trưng, Q.1' },
  { id: 'HS9228', fullName: 'Lưu Quang Vinh', gender: 'Nam', dob: '20/11/2011', phone: '0912345128', parentPhone: '0988776128', address: '18 Nguyễn Thông, Q.3' },
  { id: 'HS9229', fullName: 'Nghiêm Tuyết Mai', gender: 'Nữ', dob: '06/08/2011', phone: '0912345129', parentPhone: '0988776129', address: '27 Kỳ Đồng, Q.3' },
  { id: 'HS9230', fullName: 'Trịnh Đăng Khoa', gender: 'Nam', dob: '15/07/2011', phone: '0912345130', parentPhone: '0988776130', address: '70 Lê Văn Sỹ, Q.3' },
  { id: 'HS9231', fullName: 'Huỳnh Khánh Linh', gender: 'Nữ', dob: '24/12/2011', phone: '0912345131', parentPhone: '0988776131', address: '55 Hoàng Sa, Q.1' },
  { id: 'HS9232', fullName: 'Trần Gia Bảo', gender: 'Nam', dob: '08/02/2011', phone: '0912345132', parentPhone: '0988776132', address: '31 Trường Sa, Bình Thạnh' },
  { id: 'HS9233', fullName: 'Văn Thị Thanh Nhàn', gender: 'Nữ', dob: '17/10/2011', phone: '0912345133', parentPhone: '0988776133', address: '64 Nơ Trang Long, Bình Thạnh' },
  { id: 'HS9234', fullName: 'Nguyễn Tấn Đạt', gender: 'Nam', dob: '11/04/2011', phone: '0912345134', parentPhone: '0988776134', address: '82 Phan Văn Hân, Bình Thạnh' },
  { id: 'HS9235', fullName: 'Lê Diệu Linh', gender: 'Nữ', dob: '26/09/2011', phone: '0912345135', parentPhone: '0988776135', address: '40 Chu Văn An, Bình Thạnh' },
  { id: 'HS9236', fullName: 'Phạm Hồng Phúc', gender: 'Nam', dob: '03/03/2011', phone: '0912345136', parentPhone: '0988776136', address: '52 Bạch Đằng, Bình Thạnh' }
];

export const initialSubjects: Subject[] = [
  { id: 'toan', code: 'TOAN', name: 'Toán học', periodsPerWeek: 4, evalType: 'score', isActive: true, order: 1 },
  { id: 'van', code: 'VAN', name: 'Ngữ văn', periodsPerWeek: 4, evalType: 'score', isActive: true, order: 2 },
  { id: 'anh', code: 'ANH', name: 'Tiếng Anh', periodsPerWeek: 3, evalType: 'score', isActive: true, order: 3 },
  { id: 'khtn', code: 'KHTN', name: 'Khoa học tự nhiên', periodsPerWeek: 4, evalType: 'score', isActive: true, order: 4 },
  { id: 'lsdl', code: 'LSDL', name: 'Lịch sử và Địa lí', periodsPerWeek: 3, evalType: 'score', isActive: true, order: 5 },
  { id: 'gdcd', code: 'GDCD', name: 'Giáo dục công dân', periodsPerWeek: 1, evalType: 'score', isActive: true, order: 6 },
  { id: 'tin', code: 'TIN', name: 'Tin học', periodsPerWeek: 2, evalType: 'score', isActive: true, order: 7 },
  { id: 'cn', code: 'CN', name: 'Công nghệ', periodsPerWeek: 1, evalType: 'score', isActive: true, order: 8 },
  { id: 'gdtc', code: 'GDTC', name: 'Giáo dục thể chất', periodsPerWeek: 2, evalType: 'comment', isActive: true, order: 9 },
  { id: 'hdtn', code: 'HDTN', name: 'Hoạt động trải nghiệm, HN', periodsPerWeek: 3, evalType: 'comment', isActive: true, order: 10 },
];

export const initialRules: DisciplineRule[] = [
  { id: 'r1', code: 'KT-01', title: 'Điểm 9, 10 trong tiết học', group: 'Học tập', points: 5, linkAttendance: 'none', description: 'Đạt điểm tốt trong kiểm tra bài cũ hoặc làm bài xuất sắc' },
  { id: 'r2', code: 'KT-02', title: 'Phát biểu bài tích cực', group: 'Học tập', points: 2, linkAttendance: 'none', description: 'Đóng góp ý kiến sôi nổi trong tiết học' },
  { id: 'r3', code: 'VP-01', title: 'Không thuộc bài / Quên vở bài tập', group: 'Học tập', points: -3, linkAttendance: 'none', description: 'Chưa chuẩn bị bài trước khi đến lớp' },
  { id: 'r4', code: 'CC-01', title: 'Đi học muộn', group: 'Chuyên cần', points: -2, linkAttendance: 'late', description: 'Đến trường sau khi tiếng trống báo vào lớp' },
  { id: 'r5', code: 'CC-02', title: 'Nghỉ học không phép', group: 'Chuyên cần', points: -5, linkAttendance: 'unexcused', description: 'Vắng mặt không có giấy phép từ phụ huynh' },
  { id: 'r6', code: 'CC-03', title: 'Nghỉ học có phép', group: 'Chuyên cần', points: 0, linkAttendance: 'excused', description: 'Có đơn xin nghỉ học của phụ huynh đầy đủ' },
  { id: 'r7', code: 'NN-01', title: 'Mặc sai đồng phục / Không đeo khăn quàng', group: 'Nề nếp', points: -2, linkAttendance: 'none', description: 'Không tuân thủ trang phục học sinh THCS' },
  { id: 'r8', code: 'NN-02', title: 'Nói chuyện riêng / Làm việc riêng trong giờ', group: 'Nề nếp', points: -3, linkAttendance: 'none', description: 'Ảnh hưởng đến trật tự chung của lớp' },
  { id: 'r9', code: 'PT-01', title: 'Tham gia phong trào, văn nghệ, thể thao', group: 'Phong trào', points: 5, linkAttendance: 'none', description: 'Tích cực tham gia các hoạt động Đội và trường' },
  { id: 'r10', code: 'PT-02', title: 'Hành động đẹp, nhặt được của rơi trả người đánh mất', group: 'Phong trào', points: 10, linkAttendance: 'none', description: 'Hành động gương mẫu, trung thực' },
  { id: 'r11', code: 'PT-03', title: 'Đạt giải kỳ thi học sinh giỏi các cấp', group: 'Học tập', points: 15, linkAttendance: 'none', description: 'Khen thưởng thành tích học tập xuất sắc' },
];

export const initialAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Kế hoạch ôn tập chuẩn bị kỳ thi tuyển sinh vào lớp 10 năm học 2025 - 2026',
    content: 'Thứ Hai tuần tới, lớp 9A2 sẽ triển khai buổi tư vấn hướng nghiệp và chia sẻ phương pháp ôn thi 3 môn Toán, Văn, Anh vào các trường THPT công lập. Đề nghị các em chuẩn bị sẵn các câu hỏi thắc mắc.',
    createdAt: '2026-10-14T08:00:00.000Z',
    author: 'Cô Trần Thị Thu Trang (GVCN)',
    isPinned: true,
    isPublished: true,
    tag: 'Học tập',
  },
  {
    id: 'ann-2',
    title: 'Lịch kiểm tra định kỳ giữa học kỳ 1 lớp 9',
    content: 'Thời gian thi giữa kỳ 1 bắt đầu từ ngày 02/11 đến 07/11/2026. Lớp trưởng và các tổ trưởng đôn đốc thành viên học bài nghiêm túc, không mang tài liệu vào phòng kiểm tra.',
    createdAt: '2026-10-12T14:30:00.000Z',
    author: 'Cô Trần Thị Thu Trang (GVCN)',
    isPinned: true,
    isPublished: true,
    tag: 'Thông báo chung',
  },
  {
    id: 'ann-3',
    title: 'Phát động tuần lễ "Hoa điểm 10 dâng thầy cô" chào mừng 20/11',
    content: 'Liên đội phát động đợt thi đua cao điểm giành nhiều hoa điểm 10. Mỗi tiết học tốt của lớp 9A2 sẽ được cộng điểm thi đua vào bảng tổng kết tuần.',
    createdAt: '2026-10-10T09:00:00.000Z',
    author: 'Chi đội trưởng 9A2',
    isPinned: false,
    isPublished: true,
    tag: 'Thi đua',
  },
];

export const initialHonors: Honor[] = [
  {
    id: 'hon-1',
    studentId: 'HS9201',
    studentName: 'Nguyễn Minh Anh',
    title: 'Thủ khoa đợt thi khảo sát Toán lớp 9 cấp trường',
    description: 'Đạt điểm tuyệt đối 10.0 môn Toán trong kỳ khảo sát đầu năm, dẫn đầu khối 9 trường THCS Đồng Khởi.',
    date: '2026-10-08',
    badge: 'gold_cup',
    isPublished: true,
  },
  {
    id: 'hon-2',
    studentId: 'HS9208',
    studentName: 'Bùi Hoàng Long',
    title: 'Giải Nhất giải Cầu lông Hội khỏe Phù Đổng cấp Quận',
    description: 'Vận động viên xuất sắc đại diện trường THCS Đồng Khởi đạt huy chương vàng môn cầu lông nam.',
    date: '2026-10-05',
    badge: 'silver_medal',
    isPublished: true,
  },
  {
    id: 'hon-3',
    studentId: 'HS9205',
    studentName: 'Hoàng Mai Linh',
    title: 'Ngôi sao Chăm ngoan tuần 6',
    description: 'Gương mẫu trong mọi tiết học, giúp đỡ bạn cùng bàn tiến bộ vượt bậc môn Tiếng Anh.',
    date: '2026-10-12',
    badge: 'star',
    isPublished: true,
  },
];

export function createInitialClassData(): ClassData {
  const seats = generateInitialSeats();

  // Assign 36 students into seats initially
  initialStudents.forEach((student, index) => {
    if (index < seats.length) {
      seats[index].studentId = student.id;
      student.seatCode = seats[index].seatCode;
    }
  });

  const todayStr = '2026-10-15';
  const yesterdayStr = '2026-10-14';

  const attendance: AttendanceRecord[] = [];
  const disciplineRecords: DisciplineRecord[] = [];
  const grades: GradeRecord[] = [];

  // Generate realistic attendance
  initialStudents.forEach((student, idx) => {
    // Yesterday
    let statusYesterday: AttendanceRecord['status'] = 'present';
    if (idx === 3) statusYesterday = 'late';
    if (idx === 9) statusYesterday = 'excused';

    attendance.push({
      id: `att-y-${student.id}`,
      studentId: student.id,
      date: yesterdayStr,
      status: statusYesterday,
      note: idx === 3 ? 'Đến muộn 10 phút' : idx === 9 ? 'Nghỉ ốm có đơn phụ huynh' : undefined,
    });

    // Today
    let statusToday: AttendanceRecord['status'] = 'present';
    if (idx === 7) statusToday = 'late';
    if (idx === 15) statusToday = 'unexcused';

    attendance.push({
      id: `att-t-${student.id}`,
      studentId: student.id,
      date: todayStr,
      status: statusToday,
      note: idx === 7 ? 'Hỏng xe trên đường đến trường' : idx === 15 ? 'Chưa rõ lý do vắng' : undefined,
    });
  });

  // Seed discipline events
  disciplineRecords.push(
    {
      id: 'disc-1',
      studentId: 'HS9201',
      ruleId: 'r1',
      ruleTitle: 'Điểm 9, 10 trong tiết học',
      group: 'Học tập',
      points: 5,
      date: '2026-10-14',
      note: 'Điểm 10 kiểm tra miệng môn Toán',
      createdAt: '2026-10-14T08:30:00.000Z',
    },
    {
      id: 'disc-2',
      studentId: 'HS9204',
      ruleId: 'r4',
      ruleTitle: 'Đi học muộn',
      group: 'Chuyên cần',
      points: -2,
      date: yesterdayStr,
      note: 'Đến trường lúc 7h15',
      createdAt: '2026-10-14T07:20:00.000Z',
    },
    {
      id: 'disc-3',
      studentId: 'HS9205',
      ruleId: 'r2',
      ruleTitle: 'Phát biểu bài tích cực',
      group: 'Học tập',
      points: 2,
      date: todayStr,
      note: 'Xung phong phát biểu môn Ngữ văn',
      createdAt: '2026-10-15T09:10:00.000Z',
    },
    {
      id: 'disc-4',
      studentId: 'HS9208',
      ruleId: 'r4',
      ruleTitle: 'Đi học muộn',
      group: 'Chuyên cần',
      points: -2,
      date: todayStr,
      note: 'Hỏng xe trên đường đến trường',
      createdAt: '2026-10-15T07:25:00.000Z',
    },
    {
      id: 'disc-5',
      studentId: 'HS9216',
      ruleId: 'r5',
      ruleTitle: 'Nghỉ học không phép',
      group: 'Chuyên cần',
      points: -5,
      date: todayStr,
      note: 'Vắng tiết 1-5 chưa có phép',
      createdAt: '2026-10-15T07:45:00.000Z',
    },
    {
      id: 'disc-6',
      studentId: 'HS9202',
      ruleId: 'r10',
      ruleTitle: 'Hành động đẹp, nhặt được của rơi trả người đánh mất',
      group: 'Phong trào',
      points: 10,
      date: '2026-10-12',
      note: 'Nhặt được cặp sách ở sân trường trả lại phòng Đội',
      createdAt: '2026-10-12T16:00:00.000Z',
    }
  );

  // Seed sample grades for core subjects
  const sampleGrades = [
    { sid: 'HS9201', math: 9.5, van: 8.5, eng: 9.0 },
    { sid: 'HS9202', math: 8.0, van: 7.5, eng: 8.0 },
    { sid: 'HS9203', math: 9.0, van: 9.0, eng: 8.5 },
    { sid: 'HS9204', math: 7.0, van: 6.5, eng: 7.0 },
    { sid: 'HS9205', math: 8.5, van: 9.5, eng: 8.0 },
    { sid: 'HS9206', math: 7.5, van: 7.0, eng: 7.5 },
    { sid: 'HS9207', math: 8.0, van: 8.5, eng: 9.0 },
    { sid: 'HS9208', math: 6.5, van: 7.0, eng: 6.5 },
  ];

  sampleGrades.forEach(g => {
    grades.push(
      { id: `gr-m-${g.sid}`, studentId: g.sid, subjectId: 'toan', semester: 'HK1', type: 'tx', date: '2026-10-05', score: g.math, note: 'Kiểm tra miệng' },
      { id: `gr-v-${g.sid}`, studentId: g.sid, subjectId: 'van', semester: 'HK1', type: 'tx', date: '2026-10-06', score: g.van, note: 'Kiểm tra 15 phút' },
      { id: `gr-e-${g.sid}`, studentId: g.sid, subjectId: 'anh', semester: 'HK1', type: 'tx', date: '2026-10-08', score: g.eng, note: 'Kiểm tra từ vựng' },
      { id: `gr-gdtc-${g.sid}`, studentId: g.sid, subjectId: 'gdtc', semester: 'HK1', type: 'tx', date: '2026-10-09', evaluation: 'Đạt', note: 'Chạy cự ly ngắn' }
    );
  });

  return {
    settings: {
      appName: 'GVCN – Quản trị lớp chủ nhiệm',
      schoolName: 'Trường THCS Đồng Khởi',
      className: 'Lớp 9A2',
      schoolYear: '2025 - 2026',
      teacherName: 'Cô Nguyễn Thị Thu Thủy',
      teacherPhone: '0912 345 678',
      teacherEmail: 'thuytrangdk@gmail.com',
      startingScore: 100,
      evaluationTiers: {
        excellent: 90,
        good: 75,
        average: 50,
      },
    },
    students: initialStudents,
    seats: seats,
    announcements: initialAnnouncements,
    honors: initialHonors,
    attendance: attendance,
    subjects: initialSubjects,
    grades: grades,
    rules: initialRules,
    disciplineRecords: disciplineRecords,
  };
}
