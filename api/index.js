// backend/app.ts
import express from "express";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// src/seedData.ts
function generateInitialSeats() {
  const seats = [];
  for (let col = 1; col <= 4; col++) {
    for (let row = 1; row <= 7; row++) {
      seats.push({
        seatCode: `D${col}-B${row}-T`,
        column: col,
        row,
        position: "T",
        studentId: null
      });
      seats.push({
        seatCode: `D${col}-B${row}-P`,
        column: col,
        row,
        position: "P",
        studentId: null
      });
    }
  }
  return seats;
}
var initialStudents = [
  { id: "HS9201", fullName: "Nguy\u1EC5n Minh Anh", gender: "N\u1EEF", dob: "14/03/2011", phone: "0912345101", parentPhone: "0988776101", address: "45 \u0110\u1ED3ng Kh\u1EDFi, B\u1EBFn Ngh\xE9, Q.1" },
  { id: "HS9202", fullName: "Tr\u1EA7n \u0110\u1EE9c B\u1EA3o", gender: "Nam", dob: "22/05/2011", phone: "0912345102", parentPhone: "0988776102", address: "12 Nguy\u1EC5n Hu\u1EC7, P. B\u1EBFn Ngh\xE9, Q.1" },
  { id: "HS9203", fullName: "L\xEA Th\u1ECB C\u1EA9m T\xFA", gender: "N\u1EEF", dob: "08/01/2011", phone: "0912345103", parentPhone: "0988776103", address: "89 L\xEA L\u1EE3i, Q.1" },
  { id: "HS9204", fullName: "Ph\u1EA1m Gia Huy", gender: "Nam", dob: "30/09/2011", phone: "0912345104", parentPhone: "0988776104", address: "120 Pasteur, P. B\u1EBFn Ngh\xE9, Q.1" },
  { id: "HS9205", fullName: "Ho\xE0ng Mai Linh", gender: "N\u1EEF", dob: "11/11/2011", phone: "0912345105", parentPhone: "0988776105", address: "23 Hai B\xE0 Tr\u01B0ng, Q.1" },
  { id: "HS9206", fullName: "V\u0169 Qu\u1ED1c Tu\u1EA5n", gender: "Nam", dob: "05/04/2011", phone: "0912345106", parentPhone: "0988776106", address: "78 L\xFD T\u1EF1 Tr\u1ECDng, Q.1" },
  { id: "HS9207", fullName: "\u0110\u1EB7ng Th\u1EA3o Vy", gender: "N\u1EEF", dob: "19/07/2011", phone: "0912345107", parentPhone: "0988776107", address: "56 L\xEA Th\xE1nh T\xF4n, Q.1" },
  { id: "HS9208", fullName: "B\xF9i Ho\xE0ng Long", gender: "Nam", dob: "12/02/2011", phone: "0912345108", parentPhone: "0988776108", address: "34 M\u1EA1c Th\u1ECB B\u01B0\u1EDFi, Q.1" },
  { id: "HS9209", fullName: "\u0110\u1ED7 H\u1EA3i Y\u1EBFn", gender: "N\u1EEF", dob: "25/08/2011", phone: "0912345109", parentPhone: "0988776109", address: "67 Ng\xF4 \u0110\u1EE9c K\u1EBF, Q.1" },
  { id: "HS9210", fullName: "Ng\xF4 Tr\u1ECDng Khang", gender: "Nam", dob: "17/06/2011", phone: "0912345110", parentPhone: "0988776110", address: "90 T\xF4n \u0110\u1EE9c Th\u1EAFng, Q.1" },
  { id: "HS9211", fullName: "Phan Th\u1ECB Di\u1EC5m H\u01B0\u01A1ng", gender: "N\u1EEF", dob: "03/12/2011", phone: "0912345111", parentPhone: "0988776111", address: "11 L\xEA Du\u1EA9n, Q.1" },
  { id: "HS9212", fullName: "D\u01B0\u01A1ng Th\xE0nh \u0110\u1EA1t", gender: "Nam", dob: "28/10/2011", phone: "0912345112", parentPhone: "0988776112", address: "24 Nam K\u1EF3 Kh\u1EDFi Ngh\u0129a, Q.1" },
  { id: "HS9213", fullName: "Tr\u01B0\u01A1ng M\u1EF9 Duy\xEAn", gender: "N\u1EEF", dob: "15/02/2011", phone: "0912345113", parentPhone: "0988776113", address: "42 H\xE0m Nghi, Q.1" },
  { id: "HS9214", fullName: "L\xFD Ki\u1EBFn Qu\u1ED1c", gender: "Nam", dob: "09/05/2011", phone: "0912345114", parentPhone: "0988776114", address: "15 Nguy\u1EC5n Th\u1ECB Minh Khai, Q.1" },
  { id: "HS9215", fullName: "H\u1ED3 Qu\u1EF3nh Nga", gender: "N\u1EEF", dob: "21/04/2011", phone: "0912345115", parentPhone: "0988776115", address: "66 C\xE1ch M\u1EA1ng Th\xE1ng 8, Q.3" },
  { id: "HS9216", fullName: "L\xE2m Tu\u1EA5n Ki\u1EC7t", gender: "Nam", dob: "14/09/2011", phone: "0912345116", parentPhone: "0988776116", address: "88 Nguy\u1EC5n Tr\xE3i, Q.1" },
  { id: "HS9217", fullName: "V\xF5 Ng\u1ECDc H\xE2n", gender: "N\u1EEF", dob: "31/03/2011", phone: "0912345117", parentPhone: "0988776117", address: "19 Nguy\u1EC5n Hu\u1EC7, Q.1" },
  { id: "HS9218", fullName: "\u0110inh Nh\u1EADt Nam", gender: "Nam", dob: "07/11/2011", phone: "0912345118", parentPhone: "0988776118", address: "73 Tr\u01B0\u01A1ng \u0110\u1ECBnh, Q.3" },
  { id: "HS9219", fullName: "Mai B\u1EA3o Tr\xE2m", gender: "N\u1EEF", dob: "18/10/2011", phone: "0912345119", parentPhone: "0988776119", address: "50 Nguy\u1EC5n \u0110\xECnh Chi\u1EC3u, Q.3" },
  { id: "HS9220", fullName: "Cao Minh Tri\u1EBFt", gender: "Nam", dob: "23/07/2011", phone: "0912345120", parentPhone: "0988776120", address: "101 Phan \u0110\u0103ng L\u01B0u, Ph\xFA Nhu\u1EADn" },
  { id: "HS9221", fullName: "T\xF4 \xC1nh Nguy\u1EC7t", gender: "N\u1EEF", dob: "02/06/2011", phone: "0912345121", parentPhone: "0988776121", address: "33 \u0110inh Ti\xEAn Ho\xE0ng, B\xECnh Th\u1EA1nh" },
  { id: "HS9222", fullName: "Th\xE1i H\u1EEFu Ph\u01B0\u1EDBc", gender: "Nam", dob: "16/12/2011", phone: "0912345122", parentPhone: "0988776122", address: "81 Ng\xF4 T\u1EA5t T\u1ED1, B\xECnh Th\u1EA1nh" },
  { id: "HS9223", fullName: "Ph\xF9ng Kim Chi", gender: "N\u1EEF", dob: "27/04/2011", phone: "0912345123", parentPhone: "0988776123", address: "95 X\xF4 Vi\u1EBFt Ngh\u1EC7 T\u0129nh, B\xECnh Th\u1EA1nh" },
  { id: "HS9224", fullName: "Qu\xE1ch T\u1EA5n T\xE0i", gender: "Nam", dob: "10/01/2011", phone: "0912345124", parentPhone: "0988776124", address: "14 B\xF9i Vi\u1EC7n, Q.1" },
  { id: "HS9225", fullName: "Chu Thu H\xE0", gender: "N\u1EEF", dob: "04/09/2011", phone: "0912345125", parentPhone: "0988776125", address: "39 C\u1ED1ng Qu\u1EF3nh, Q.1" },
  { id: "HS9226", fullName: "T\u1EA1 Minh Kh\xF4i", gender: "Nam", dob: "13/05/2011", phone: "0912345126", parentPhone: "0988776126", address: "62 Tr\u1EA7n Quang Kh\u1EA3i, Q.1" },
  { id: "HS9227", fullName: "H\xE0 Th\xF9y D\u01B0\u01A1ng", gender: "N\u1EEF", dob: "29/03/2011", phone: "0912345127", parentPhone: "0988776127", address: "48 Hai B\xE0 Tr\u01B0ng, Q.1" },
  { id: "HS9228", fullName: "L\u01B0u Quang Vinh", gender: "Nam", dob: "20/11/2011", phone: "0912345128", parentPhone: "0988776128", address: "18 Nguy\u1EC5n Th\xF4ng, Q.3" },
  { id: "HS9229", fullName: "Nghi\xEAm Tuy\u1EBFt Mai", gender: "N\u1EEF", dob: "06/08/2011", phone: "0912345129", parentPhone: "0988776129", address: "27 K\u1EF3 \u0110\u1ED3ng, Q.3" },
  { id: "HS9230", fullName: "Tr\u1ECBnh \u0110\u0103ng Khoa", gender: "Nam", dob: "15/07/2011", phone: "0912345130", parentPhone: "0988776130", address: "70 L\xEA V\u0103n S\u1EF9, Q.3" },
  { id: "HS9231", fullName: "Hu\u1EF3nh Kh\xE1nh Linh", gender: "N\u1EEF", dob: "24/12/2011", phone: "0912345131", parentPhone: "0988776131", address: "55 Ho\xE0ng Sa, Q.1" },
  { id: "HS9232", fullName: "Tr\u1EA7n Gia B\u1EA3o", gender: "Nam", dob: "08/02/2011", phone: "0912345132", parentPhone: "0988776132", address: "31 Tr\u01B0\u1EDDng Sa, B\xECnh Th\u1EA1nh" },
  { id: "HS9233", fullName: "V\u0103n Th\u1ECB Thanh Nh\xE0n", gender: "N\u1EEF", dob: "17/10/2011", phone: "0912345133", parentPhone: "0988776133", address: "64 N\u01A1 Trang Long, B\xECnh Th\u1EA1nh" },
  { id: "HS9234", fullName: "Nguy\u1EC5n T\u1EA5n \u0110\u1EA1t", gender: "Nam", dob: "11/04/2011", phone: "0912345134", parentPhone: "0988776134", address: "82 Phan V\u0103n H\xE2n, B\xECnh Th\u1EA1nh" },
  { id: "HS9235", fullName: "L\xEA Di\u1EC7u Linh", gender: "N\u1EEF", dob: "26/09/2011", phone: "0912345135", parentPhone: "0988776135", address: "40 Chu V\u0103n An, B\xECnh Th\u1EA1nh" },
  { id: "HS9236", fullName: "Ph\u1EA1m H\u1ED3ng Ph\xFAc", gender: "Nam", dob: "03/03/2011", phone: "0912345136", parentPhone: "0988776136", address: "52 B\u1EA1ch \u0110\u1EB1ng, B\xECnh Th\u1EA1nh" }
];
var initialSubjects = [
  { id: "toan", code: "TOAN", name: "To\xE1n h\u1ECDc", periodsPerWeek: 4, evalType: "score", isActive: true, order: 1 },
  { id: "van", code: "VAN", name: "Ng\u1EEF v\u0103n", periodsPerWeek: 4, evalType: "score", isActive: true, order: 2 },
  { id: "anh", code: "ANH", name: "Ti\u1EBFng Anh", periodsPerWeek: 3, evalType: "score", isActive: true, order: 3 },
  { id: "khtn", code: "KHTN", name: "Khoa h\u1ECDc t\u1EF1 nhi\xEAn", periodsPerWeek: 4, evalType: "score", isActive: true, order: 4 },
  { id: "lsdl", code: "LSDL", name: "L\u1ECBch s\u1EED v\xE0 \u0110\u1ECBa l\xED", periodsPerWeek: 3, evalType: "score", isActive: true, order: 5 },
  { id: "gdcd", code: "GDCD", name: "Gi\xE1o d\u1EE5c c\xF4ng d\xE2n", periodsPerWeek: 1, evalType: "score", isActive: true, order: 6 },
  { id: "tin", code: "TIN", name: "Tin h\u1ECDc", periodsPerWeek: 2, evalType: "score", isActive: true, order: 7 },
  { id: "cn", code: "CN", name: "C\xF4ng ngh\u1EC7", periodsPerWeek: 1, evalType: "score", isActive: true, order: 8 },
  { id: "gdtc", code: "GDTC", name: "Gi\xE1o d\u1EE5c th\u1EC3 ch\u1EA5t", periodsPerWeek: 2, evalType: "comment", isActive: true, order: 9 },
  { id: "hdtn", code: "HDTN", name: "Ho\u1EA1t \u0111\u1ED9ng tr\u1EA3i nghi\u1EC7m, HN", periodsPerWeek: 3, evalType: "comment", isActive: true, order: 10 }
];
var initialRules = [
  { id: "r1", code: "KT-01", title: "\u0110i\u1EC3m 9, 10 trong ti\u1EBFt h\u1ECDc", group: "H\u1ECDc t\u1EADp", points: 5, linkAttendance: "none", description: "\u0110\u1EA1t \u0111i\u1EC3m t\u1ED1t trong ki\u1EC3m tra b\xE0i c\u0169 ho\u1EB7c l\xE0m b\xE0i xu\u1EA5t s\u1EAFc" },
  { id: "r2", code: "KT-02", title: "Ph\xE1t bi\u1EC3u b\xE0i t\xEDch c\u1EF1c", group: "H\u1ECDc t\u1EADp", points: 2, linkAttendance: "none", description: "\u0110\xF3ng g\xF3p \xFD ki\u1EBFn s\xF4i n\u1ED5i trong ti\u1EBFt h\u1ECDc" },
  { id: "r3", code: "VP-01", title: "Kh\xF4ng thu\u1ED9c b\xE0i / Qu\xEAn v\u1EDF b\xE0i t\u1EADp", group: "H\u1ECDc t\u1EADp", points: -3, linkAttendance: "none", description: "Ch\u01B0a chu\u1EA9n b\u1ECB b\xE0i tr\u01B0\u1EDBc khi \u0111\u1EBFn l\u1EDBp" },
  { id: "r4", code: "CC-01", title: "\u0110i h\u1ECDc mu\u1ED9n", group: "Chuy\xEAn c\u1EA7n", points: -2, linkAttendance: "late", description: "\u0110\u1EBFn tr\u01B0\u1EDDng sau khi ti\u1EBFng tr\u1ED1ng b\xE1o v\xE0o l\u1EDBp" },
  { id: "r5", code: "CC-02", title: "Ngh\u1EC9 h\u1ECDc kh\xF4ng ph\xE9p", group: "Chuy\xEAn c\u1EA7n", points: -5, linkAttendance: "unexcused", description: "V\u1EAFng m\u1EB7t kh\xF4ng c\xF3 gi\u1EA5y ph\xE9p t\u1EEB ph\u1EE5 huynh" },
  { id: "r6", code: "CC-03", title: "Ngh\u1EC9 h\u1ECDc c\xF3 ph\xE9p", group: "Chuy\xEAn c\u1EA7n", points: 0, linkAttendance: "excused", description: "C\xF3 \u0111\u01A1n xin ngh\u1EC9 h\u1ECDc c\u1EE7a ph\u1EE5 huynh \u0111\u1EA7y \u0111\u1EE7" },
  { id: "r7", code: "NN-01", title: "M\u1EB7c sai \u0111\u1ED3ng ph\u1EE5c / Kh\xF4ng \u0111eo kh\u0103n qu\xE0ng", group: "N\u1EC1 n\u1EBFp", points: -2, linkAttendance: "none", description: "Kh\xF4ng tu\xE2n th\u1EE7 trang ph\u1EE5c h\u1ECDc sinh THCS" },
  { id: "r8", code: "NN-02", title: "N\xF3i chuy\u1EC7n ri\xEAng / L\xE0m vi\u1EC7c ri\xEAng trong gi\u1EDD", group: "N\u1EC1 n\u1EBFp", points: -3, linkAttendance: "none", description: "\u1EA2nh h\u01B0\u1EDFng \u0111\u1EBFn tr\u1EADt t\u1EF1 chung c\u1EE7a l\u1EDBp" },
  { id: "r9", code: "PT-01", title: "Tham gia phong tr\xE0o, v\u0103n ngh\u1EC7, th\u1EC3 thao", group: "Phong tr\xE0o", points: 5, linkAttendance: "none", description: "T\xEDch c\u1EF1c tham gia c\xE1c ho\u1EA1t \u0111\u1ED9ng \u0110\u1ED9i v\xE0 tr\u01B0\u1EDDng" },
  { id: "r10", code: "PT-02", title: "H\xE0nh \u0111\u1ED9ng \u0111\u1EB9p, nh\u1EB7t \u0111\u01B0\u1EE3c c\u1EE7a r\u01A1i tr\u1EA3 ng\u01B0\u1EDDi \u0111\xE1nh m\u1EA5t", group: "Phong tr\xE0o", points: 10, linkAttendance: "none", description: "H\xE0nh \u0111\u1ED9ng g\u01B0\u01A1ng m\u1EABu, trung th\u1EF1c" },
  { id: "r11", code: "PT-03", title: "\u0110\u1EA1t gi\u1EA3i k\u1EF3 thi h\u1ECDc sinh gi\u1ECFi c\xE1c c\u1EA5p", group: "H\u1ECDc t\u1EADp", points: 15, linkAttendance: "none", description: "Khen th\u01B0\u1EDFng th\xE0nh t\xEDch h\u1ECDc t\u1EADp xu\u1EA5t s\u1EAFc" }
];
var initialAnnouncements = [
  {
    id: "ann-1",
    title: "K\u1EBF ho\u1EA1ch \xF4n t\u1EADp chu\u1EA9n b\u1ECB k\u1EF3 thi tuy\u1EC3n sinh v\xE0o l\u1EDBp 10 n\u0103m h\u1ECDc 2025 - 2026",
    content: "Th\u1EE9 Hai tu\u1EA7n t\u1EDBi, l\u1EDBp 9A2 s\u1EBD tri\u1EC3n khai bu\u1ED5i t\u01B0 v\u1EA5n h\u01B0\u1EDBng nghi\u1EC7p v\xE0 chia s\u1EBB ph\u01B0\u01A1ng ph\xE1p \xF4n thi 3 m\xF4n To\xE1n, V\u0103n, Anh v\xE0o c\xE1c tr\u01B0\u1EDDng THPT c\xF4ng l\u1EADp. \u0110\u1EC1 ngh\u1ECB c\xE1c em chu\u1EA9n b\u1ECB s\u1EB5n c\xE1c c\xE2u h\u1ECFi th\u1EAFc m\u1EAFc.",
    createdAt: "2026-10-14T08:00:00.000Z",
    author: "C\xF4 Tr\u1EA7n Th\u1ECB Thu Trang (GVCN)",
    isPinned: true,
    isPublished: true,
    tag: "H\u1ECDc t\u1EADp"
  },
  {
    id: "ann-2",
    title: "L\u1ECBch ki\u1EC3m tra \u0111\u1ECBnh k\u1EF3 gi\u1EEFa h\u1ECDc k\u1EF3 1 l\u1EDBp 9",
    content: "Th\u1EDDi gian thi gi\u1EEFa k\u1EF3 1 b\u1EAFt \u0111\u1EA7u t\u1EEB ng\xE0y 02/11 \u0111\u1EBFn 07/11/2026. L\u1EDBp tr\u01B0\u1EDFng v\xE0 c\xE1c t\u1ED5 tr\u01B0\u1EDFng \u0111\xF4n \u0111\u1ED1c th\xE0nh vi\xEAn h\u1ECDc b\xE0i nghi\xEAm t\xFAc, kh\xF4ng mang t\xE0i li\u1EC7u v\xE0o ph\xF2ng ki\u1EC3m tra.",
    createdAt: "2026-10-12T14:30:00.000Z",
    author: "C\xF4 Tr\u1EA7n Th\u1ECB Thu Trang (GVCN)",
    isPinned: true,
    isPublished: true,
    tag: "Th\xF4ng b\xE1o chung"
  },
  {
    id: "ann-3",
    title: 'Ph\xE1t \u0111\u1ED9ng tu\u1EA7n l\u1EC5 "Hoa \u0111i\u1EC3m 10 d\xE2ng th\u1EA7y c\xF4" ch\xE0o m\u1EEBng 20/11',
    content: "Li\xEAn \u0111\u1ED9i ph\xE1t \u0111\u1ED9ng \u0111\u1EE3t thi \u0111ua cao \u0111i\u1EC3m gi\xE0nh nhi\u1EC1u hoa \u0111i\u1EC3m 10. M\u1ED7i ti\u1EBFt h\u1ECDc t\u1ED1t c\u1EE7a l\u1EDBp 9A2 s\u1EBD \u0111\u01B0\u1EE3c c\u1ED9ng \u0111i\u1EC3m thi \u0111ua v\xE0o b\u1EA3ng t\u1ED5ng k\u1EBFt tu\u1EA7n.",
    createdAt: "2026-10-10T09:00:00.000Z",
    author: "Chi \u0111\u1ED9i tr\u01B0\u1EDFng 9A2",
    isPinned: false,
    isPublished: true,
    tag: "Thi \u0111ua"
  }
];
var initialHonors = [
  {
    id: "hon-1",
    studentId: "HS9201",
    studentName: "Nguy\u1EC5n Minh Anh",
    title: "Th\u1EE7 khoa \u0111\u1EE3t thi kh\u1EA3o s\xE1t To\xE1n l\u1EDBp 9 c\u1EA5p tr\u01B0\u1EDDng",
    description: "\u0110\u1EA1t \u0111i\u1EC3m tuy\u1EC7t \u0111\u1ED1i 10.0 m\xF4n To\xE1n trong k\u1EF3 kh\u1EA3o s\xE1t \u0111\u1EA7u n\u0103m, d\u1EABn \u0111\u1EA7u kh\u1ED1i 9 tr\u01B0\u1EDDng THCS \u0110\u1ED3ng Kh\u1EDFi.",
    date: "2026-10-08",
    badge: "gold_cup",
    isPublished: true
  },
  {
    id: "hon-2",
    studentId: "HS9208",
    studentName: "B\xF9i Ho\xE0ng Long",
    title: "Gi\u1EA3i Nh\u1EA5t gi\u1EA3i C\u1EA7u l\xF4ng H\u1ED9i kh\u1ECFe Ph\xF9 \u0110\u1ED5ng c\u1EA5p Qu\u1EADn",
    description: "V\u1EADn \u0111\u1ED9ng vi\xEAn xu\u1EA5t s\u1EAFc \u0111\u1EA1i di\u1EC7n tr\u01B0\u1EDDng THCS \u0110\u1ED3ng Kh\u1EDFi \u0111\u1EA1t huy ch\u01B0\u01A1ng v\xE0ng m\xF4n c\u1EA7u l\xF4ng nam.",
    date: "2026-10-05",
    badge: "silver_medal",
    isPublished: true
  },
  {
    id: "hon-3",
    studentId: "HS9205",
    studentName: "Ho\xE0ng Mai Linh",
    title: "Ng\xF4i sao Ch\u0103m ngoan tu\u1EA7n 6",
    description: "G\u01B0\u01A1ng m\u1EABu trong m\u1ECDi ti\u1EBFt h\u1ECDc, gi\xFAp \u0111\u1EE1 b\u1EA1n c\xF9ng b\xE0n ti\u1EBFn b\u1ED9 v\u01B0\u1EE3t b\u1EADc m\xF4n Ti\u1EBFng Anh.",
    date: "2026-10-12",
    badge: "star",
    isPublished: true
  }
];
function createInitialClassData() {
  const seats = generateInitialSeats();
  initialStudents.forEach((student, index) => {
    if (index < seats.length) {
      seats[index].studentId = student.id;
      student.seatCode = seats[index].seatCode;
    }
  });
  const todayStr = "2026-10-15";
  const yesterdayStr = "2026-10-14";
  const attendance = [];
  const disciplineRecords = [];
  const grades = [];
  initialStudents.forEach((student, idx) => {
    let statusYesterday = "present";
    if (idx === 3) statusYesterday = "late";
    if (idx === 9) statusYesterday = "excused";
    attendance.push({
      id: `att-y-${student.id}`,
      studentId: student.id,
      date: yesterdayStr,
      status: statusYesterday,
      note: idx === 3 ? "\u0110\u1EBFn mu\u1ED9n 10 ph\xFAt" : idx === 9 ? "Ngh\u1EC9 \u1ED1m c\xF3 \u0111\u01A1n ph\u1EE5 huynh" : void 0
    });
    let statusToday = "present";
    if (idx === 7) statusToday = "late";
    if (idx === 15) statusToday = "unexcused";
    attendance.push({
      id: `att-t-${student.id}`,
      studentId: student.id,
      date: todayStr,
      status: statusToday,
      note: idx === 7 ? "H\u1ECFng xe tr\xEAn \u0111\u01B0\u1EDDng \u0111\u1EBFn tr\u01B0\u1EDDng" : idx === 15 ? "Ch\u01B0a r\xF5 l\xFD do v\u1EAFng" : void 0
    });
  });
  disciplineRecords.push(
    {
      id: "disc-1",
      studentId: "HS9201",
      ruleId: "r1",
      ruleTitle: "\u0110i\u1EC3m 9, 10 trong ti\u1EBFt h\u1ECDc",
      group: "H\u1ECDc t\u1EADp",
      points: 5,
      date: "2026-10-14",
      note: "\u0110i\u1EC3m 10 ki\u1EC3m tra mi\u1EC7ng m\xF4n To\xE1n",
      createdAt: "2026-10-14T08:30:00.000Z"
    },
    {
      id: "disc-2",
      studentId: "HS9204",
      ruleId: "r4",
      ruleTitle: "\u0110i h\u1ECDc mu\u1ED9n",
      group: "Chuy\xEAn c\u1EA7n",
      points: -2,
      date: yesterdayStr,
      note: "\u0110\u1EBFn tr\u01B0\u1EDDng l\xFAc 7h15",
      createdAt: "2026-10-14T07:20:00.000Z"
    },
    {
      id: "disc-3",
      studentId: "HS9205",
      ruleId: "r2",
      ruleTitle: "Ph\xE1t bi\u1EC3u b\xE0i t\xEDch c\u1EF1c",
      group: "H\u1ECDc t\u1EADp",
      points: 2,
      date: todayStr,
      note: "Xung phong ph\xE1t bi\u1EC3u m\xF4n Ng\u1EEF v\u0103n",
      createdAt: "2026-10-15T09:10:00.000Z"
    },
    {
      id: "disc-4",
      studentId: "HS9208",
      ruleId: "r4",
      ruleTitle: "\u0110i h\u1ECDc mu\u1ED9n",
      group: "Chuy\xEAn c\u1EA7n",
      points: -2,
      date: todayStr,
      note: "H\u1ECFng xe tr\xEAn \u0111\u01B0\u1EDDng \u0111\u1EBFn tr\u01B0\u1EDDng",
      createdAt: "2026-10-15T07:25:00.000Z"
    },
    {
      id: "disc-5",
      studentId: "HS9216",
      ruleId: "r5",
      ruleTitle: "Ngh\u1EC9 h\u1ECDc kh\xF4ng ph\xE9p",
      group: "Chuy\xEAn c\u1EA7n",
      points: -5,
      date: todayStr,
      note: "V\u1EAFng ti\u1EBFt 1-5 ch\u01B0a c\xF3 ph\xE9p",
      createdAt: "2026-10-15T07:45:00.000Z"
    },
    {
      id: "disc-6",
      studentId: "HS9202",
      ruleId: "r10",
      ruleTitle: "H\xE0nh \u0111\u1ED9ng \u0111\u1EB9p, nh\u1EB7t \u0111\u01B0\u1EE3c c\u1EE7a r\u01A1i tr\u1EA3 ng\u01B0\u1EDDi \u0111\xE1nh m\u1EA5t",
      group: "Phong tr\xE0o",
      points: 10,
      date: "2026-10-12",
      note: "Nh\u1EB7t \u0111\u01B0\u1EE3c c\u1EB7p s\xE1ch \u1EDF s\xE2n tr\u01B0\u1EDDng tr\u1EA3 l\u1EA1i ph\xF2ng \u0110\u1ED9i",
      createdAt: "2026-10-12T16:00:00.000Z"
    }
  );
  const sampleGrades = [
    { sid: "HS9201", math: 9.5, van: 8.5, eng: 9 },
    { sid: "HS9202", math: 8, van: 7.5, eng: 8 },
    { sid: "HS9203", math: 9, van: 9, eng: 8.5 },
    { sid: "HS9204", math: 7, van: 6.5, eng: 7 },
    { sid: "HS9205", math: 8.5, van: 9.5, eng: 8 },
    { sid: "HS9206", math: 7.5, van: 7, eng: 7.5 },
    { sid: "HS9207", math: 8, van: 8.5, eng: 9 },
    { sid: "HS9208", math: 6.5, van: 7, eng: 6.5 }
  ];
  sampleGrades.forEach((g) => {
    grades.push(
      { id: `gr-m-${g.sid}`, studentId: g.sid, subjectId: "toan", semester: "HK1", type: "tx", date: "2026-10-05", score: g.math, note: "Ki\u1EC3m tra mi\u1EC7ng" },
      { id: `gr-v-${g.sid}`, studentId: g.sid, subjectId: "van", semester: "HK1", type: "tx", date: "2026-10-06", score: g.van, note: "Ki\u1EC3m tra 15 ph\xFAt" },
      { id: `gr-e-${g.sid}`, studentId: g.sid, subjectId: "anh", semester: "HK1", type: "tx", date: "2026-10-08", score: g.eng, note: "Ki\u1EC3m tra t\u1EEB v\u1EF1ng" },
      { id: `gr-gdtc-${g.sid}`, studentId: g.sid, subjectId: "gdtc", semester: "HK1", type: "tx", date: "2026-10-09", evaluation: "\u0110\u1EA1t", note: "Ch\u1EA1y c\u1EF1 ly ng\u1EAFn" }
    );
  });
  return {
    settings: {
      appName: "GVCN \u2013 Qu\u1EA3n tr\u1ECB l\u1EDBp ch\u1EE7 nhi\u1EC7m",
      schoolName: "Tr\u01B0\u1EDDng THCS \u0110\u1ED3ng Kh\u1EDFi",
      className: "L\u1EDBp 9A2",
      schoolYear: "2025 - 2026",
      teacherName: "C\xF4 Tr\u1EA7n Th\u1ECB Thu Trang",
      teacherPhone: "0912 345 678",
      teacherEmail: "thuytrangdk@gmail.com",
      startingScore: 100,
      evaluationTiers: {
        excellent: 90,
        good: 75,
        average: 50
      }
    },
    students: initialStudents,
    seats,
    announcements: initialAnnouncements,
    honors: initialHonors,
    attendance,
    subjects: initialSubjects,
    grades,
    rules: initialRules,
    disciplineRecords
  };
}

// backend/app.ts
var app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "3mb" }));
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.get("/api/health", (_req, res) => res.json({ ok: true, build: "gvcn-vercel-fix-v1" }));
var classData;
var users = [];
var version = 0;
var dirty = false;
var exists = false;
var lastSavedAt = null;
var pendingBackups = [];
function scopeId() {
  const id = process.env.APP_DATA_SCOPE;
  if (!id || !/^[a-zA-Z0-9_-]{8,120}$/.test(id)) throw new Error("C\u1EA7n \u0111\u1EB7t APP_DATA_SCOPE ri\xEAng, \xEDt nh\u1EA5t 8 k\xFD t\u1EF1 ch\u1EEF/s\u1ED1/g\u1EA1ch n\u1ED1i.");
  return id;
}
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("C\u1EA7n \u0111\u1EB7t SESSION_SECRET d\xE0i \xEDt nh\u1EA5t 32 k\xFD t\u1EF1.");
  return value;
}
function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Thi\u1EBFu SUPABASE_URL ho\u1EB7c SUPABASE_SECRET_KEY (ch\u1EC9 \u0111\u1EB7t \u1EDF backend Vercel).");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1e4, 64, "sha256").toString("hex");
}
function safeEqual(a, b) {
  return a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
function signSession(user) {
  const payload = Buffer.from(JSON.stringify({
    uid: user.id,
    scope: scopeId(),
    pv: crypto.createHash("sha256").update(user.passwordHash).digest("hex"),
    exp: Date.now() + 7 * 864e5
  })).toString("base64url");
  return payload + "." + crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}
function verifySession(token) {
  try {
    const [payload, signature, extra] = token.split(".");
    if (extra || !signature || !safeEqual(signature, crypto.createHmac("sha256", secret()).update(payload).digest("base64url"))) return null;
    const value = JSON.parse(Buffer.from(payload, "base64url").toString());
    const user = users.find((u) => u.id === value.uid);
    if (!user || value.scope !== scopeId() || !Number.isFinite(value.exp) || value.exp < Date.now() || value.pv !== crypto.createHash("sha256").update(user.passwordHash).digest("hex")) return null;
    return { userId: user.id, username: user.username, role: user.role, studentId: user.studentId };
  } catch {
    return null;
  }
}
function emptyClass() {
  const initial = createInitialClassData();
  return {
    ...initial,
    settings: { ...initial.settings, schoolYear: "2026 - 2027", teacherPhone: "", teacherEmail: "" },
    students: [],
    seats: generateInitialSeats().map((s) => ({ ...s, studentId: null })),
    attendance: [],
    grades: [],
    disciplineRecords: [],
    announcements: [],
    honors: [],
    conductAdjustments: {}
  };
}
function initUsersFromClassData() {
  const teachers = users.filter((u) => u.role === "teacher");
  users = [...teachers, ...classData.students.map((student) => {
    const old = users.find((u) => u.role === "student" && u.studentId === student.id);
    if (old) return { ...old, name: student.fullName };
    const salt = crypto.randomBytes(16).toString("hex");
    return {
      id: `user-${student.id}`,
      username: student.id.toLowerCase(),
      role: "student",
      studentId: student.id,
      name: student.fullName,
      salt,
      passwordHash: hashPassword(student.dob.replace(/[^0-9]/g, ""), salt),
      mustChangePassword: false
    };
  })];
  saveUsers();
}
function getClassScope() {
  return {
    classKey: scopeId(),
    usersKey: scopeId(),
    className: classData.settings.className,
    teacherName: classData.settings.teacherName,
    teacherUsername: users.find((u) => u.role === "teacher")?.username || "gvcn",
    classId: scopeId(),
    schoolName: classData.settings.schoolName,
    schoolYear: classData.settings.schoolYear
  };
}
function saveDatabase(_cloudSync = true) {
  dirty = true;
}
function saveUsers(_cloudSync = true) {
  dirty = true;
}
function createAutoBackup(reason) {
  const id = crypto.randomUUID();
  pendingBackups.push({ id, scope: scopeId(), reason, data: structuredClone({ classData, users }) });
  return id;
}
var arrayKeys = ["students", "seats", "announcements", "honors", "attendance", "subjects", "grades", "rules", "disciplineRecords"];
function validatePatch(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("D\u1EEF li\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7"), { status: 400 });
  for (const key of arrayKeys) if (value[key] !== void 0 && !Array.isArray(value[key])) throw Object.assign(new Error(`M\u1EE5c ${key} ph\u1EA3i l\xE0 danh s\xE1ch`), { status: 400 });
  if (value.settings !== void 0 && (!value.settings || typeof value.settings !== "object" || Array.isArray(value.settings))) throw Object.assign(new Error("C\xE0i \u0111\u1EB7t kh\xF4ng h\u1EE3p l\u1EC7"), { status: 400 });
  if (value.students) {
    const ids = /* @__PURE__ */ new Set();
    for (const s of value.students) {
      if (!s || typeof s.id !== "string" || !s.id.trim() || typeof s.fullName !== "string" || typeof s.dob !== "string" || !s.dob.replace(/[^0-9]/g, "") || s.id.toLowerCase() === "gvcn" || ids.has(s.id.toLowerCase()))
        throw Object.assign(new Error("M\xE3 h\u1ECDc sinh/ng\xE0y sinh kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c m\xE3 b\u1ECB tr\xF9ng."), { status: 400 });
      ids.add(s.id.toLowerCase());
    }
  }
}
function validateClass(value) {
  validatePatch(value);
  if (!value.settings || typeof value.settings.className !== "string" || !value.settings.className.trim() || arrayKeys.some((k) => !Array.isArray(value[k]))) throw Object.assign(new Error("B\u1EA3n sao l\u01B0u thi\u1EBFu d\u1EEF li\u1EC7u l\u1EDBp b\u1EAFt bu\u1ED9c."), { status: 400 });
}
async function load(req) {
  secret();
  dirty = false;
  pendingBackups = [];
  const { data, error } = await db().from("gvcn_private_state").select("*").eq("id", scopeId()).maybeSingle();
  if (error) throw new Error(`Kh\xF4ng \u0111\u1ECDc \u0111\u01B0\u1EE3c v\xF9ng d\u1EEF li\u1EC7u ri\xEAng: ${error.message}. Ki\u1EC3m tra SQL thi\u1EBFt l\u1EADp v\xE0 kh\xF3a backend.`);
  exists = !!data;
  version = data?.version || 0;
  lastSavedAt = data?.updated_at || null;
  if (data) {
    validateClass(data.data.classData);
    classData = data.data.classData;
    users = data.data.users;
  } else {
    const password = process.env.INITIAL_ADMIN_PASSWORD;
    if (req.originalUrl.split("?")[0] !== "/api/auth/login" || req.method !== "POST" || !password || password.length < 12 || req.body?.username !== "gvcn" || typeof req.body?.password !== "string" || !safeEqual(req.body.password, password))
      throw Object.assign(new Error("Ch\u01B0a kh\u1EDFi t\u1EA1o v\xF9ng d\u1EEF li\u1EC7u. \u0110\u0103ng nh\u1EADp gvcn b\u1EB1ng INITIAL_ADMIN_PASSWORD \u0111\xE3 \u0111\u1EB7t tr\xEAn Vercel (\xEDt nh\u1EA5t 12 k\xFD t\u1EF1)."), { status: 401 });
    classData = emptyClass();
    const salt = crypto.randomBytes(16).toString("hex");
    users = [{
      id: "teacher",
      username: "gvcn",
      role: "teacher",
      name: classData.settings.teacherName,
      salt,
      passwordHash: hashPassword(password, salt),
      mustChangePassword: false
    }];
    dirty = true;
  }
}
async function persist() {
  const client = db();
  if (pendingBackups.length) {
    const { error } = await client.from("gvcn_private_backups").insert(pendingBackups);
    if (error) throw new Error(`Kh\xF4ng t\u1EA1o \u0111\u01B0\u1EE3c sao l\u01B0u: ${error.message}`);
  }
  validateClass(classData);
  const updated_at = (/* @__PURE__ */ new Date()).toISOString();
  const row = { id: scopeId(), data: { classData, users }, version: version + 1, updated_at };
  const result = exists ? await client.from("gvcn_private_state").update(row).eq("id", scopeId()).eq("version", version).select("id") : await client.from("gvcn_private_state").insert(row).select("id");
  if (result.error || !result.data?.length) {
    if (!result.error || result.error.code === "23505") throw Object.assign(new Error("D\u1EEF li\u1EC7u v\u1EEBa thay \u0111\u1ED5i \u1EDF thi\u1EBFt b\u1ECB kh\xE1c. T\u1EA3i l\u1EA1i trang tr\u01B0\u1EDBc khi l\u01B0u."), { status: 409 });
    throw new Error(`L\u01B0u Supabase th\u1EA5t b\u1EA1i: ${result.error.message}`);
  }
  version++;
  lastSavedAt = updated_at;
}
var queue = Promise.resolve();
app.use("/api", (req, res, next) => {
  const run = async () => {
    const send = res.json.bind(res);
    const textSend = res.send.bind(res);
    await new Promise((resolve) => {
      res.once("finish", resolve);
      res.once("close", resolve);
      let responding = false;
      res.json = ((body) => {
        if (responding) return res;
        responding = true;
        void (async () => {
          try {
            if (res.statusCode < 400 && dirty) await persist();
            res.setHeader("X-Data-Version", String(version));
            send(body);
          } catch (err) {
            console.error("[GVCN save]", err.message);
            res.status(err.status || 503);
            send({ error: err.message });
          }
        })();
        return res;
      });
      void load(req).then(() => {
        if (res.destroyed) return;
        if (req.method === "POST" && ["/api/data/update", "/api/data/restore", "/api/data/reset-demo"].includes(req.originalUrl.split("?")[0])) {
          if (req.headers["if-match"] !== String(version)) return res.status(409).json({ error: "D\u1EEF li\u1EC7u \u0111\xE3 thay \u0111\u1ED5i ho\u1EB7c ch\u01B0a t\u1EA3i xong. T\u1EA3i l\u1EA1i trang r\u1ED3i th\u1EF1c hi\u1EC7n l\u1EA1i." });
        }
        next();
      }).catch((err) => {
        console.error("[GVCN load]", err.message);
        res.status(err.status || 503).json({ error: err.message });
      });
    });
    res.send = textSend;
  };
  queue = queue.then(run, run).catch((err) => {
    console.error(err);
    if (!res.headersSent) res.status(500).end();
  });
});
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Y\xEAu c\u1EA7u \u0111\u0103ng nh\u1EADp (Thi\u1EBFu token x\xE1c th\u1EF1c)" });
  }
  const token = authHeader.split(" ")[1];
  const session = verifySession(token);
  if (!session) return res.status(401).json({ error: "Phi\xEAn l\xE0m vi\u1EC7c \u0111\xE3 h\u1EBFt h\u1EA1n. Vui l\xF2ng \u0111\u0103ng nh\u1EADp l\u1EA1i." });
  req.user = session;
  next();
}
function requireTeacher(req, res, next) {
  const user = req.user;
  if (!user || user.role !== "teacher") {
    return res.status(403).json({ error: "Quy\u1EC1n truy c\u1EADp b\u1ECB t\u1EEB ch\u1ED1i: Ch\u1EC9 gi\xE1o vi\xEAn c\xF3 quy\u1EC1n n\xE0y" });
  }
  next();
}
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
    return res.status(400).json({ error: "Vui l\xF2ng nh\u1EADp t\xEAn \u0111\u0103ng nh\u1EADp v\xE0 m\u1EADt kh\u1EA9u" });
  }
  const targetUser = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!targetUser) {
    return res.status(401).json({ error: "T\xEAn \u0111\u0103ng nh\u1EADp ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng ch\xEDnh x\xE1c" });
  }
  const computedHash = hashPassword(password, targetUser.salt);
  if (!safeEqual(computedHash, targetUser.passwordHash)) {
    return res.status(401).json({ error: "T\xEAn \u0111\u0103ng nh\u1EADp ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng ch\xEDnh x\xE1c" });
  }
  const token = signSession(targetUser);
  res.json({
    token,
    user: {
      id: targetUser.id,
      username: targetUser.username,
      role: targetUser.role,
      name: targetUser.name,
      studentId: targetUser.studentId,
      mustChangePassword: targetUser.mustChangePassword
    }
  });
});
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const session = req.user;
  const user = users.find((u) => u.id === session.userId);
  if (!user) {
    return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y th\xF4ng tin t\xE0i kho\u1EA3n" });
  }
  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    studentId: user.studentId,
    mustChangePassword: user.mustChangePassword
  });
});
app.post("/api/auth/change-password", authMiddleware, (req, res) => {
  const session = req.user;
  const { currentPassword, newPassword } = req.body;
  if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword || !newPassword) {
    return res.status(400).json({ error: "Vui l\xF2ng nh\u1EADp m\u1EADt kh\u1EA9u hi\u1EC7n t\u1EA1i v\xE0 m\u1EADt kh\u1EA9u m\u1EDBi" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "M\u1EADt kh\u1EA9u m\u1EDBi ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 6 k\xFD t\u1EF1" });
  }
  const user = users.find((u) => u.id === session.userId);
  if (!user) {
    return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y t\xE0i kho\u1EA3n" });
  }
  const currentHash = hashPassword(currentPassword, user.salt);
  if (!safeEqual(currentHash, user.passwordHash)) {
    return res.status(400).json({ error: "M\u1EADt kh\u1EA9u hi\u1EC7n t\u1EA1i kh\xF4ng \u0111\xFAng" });
  }
  const newSalt = crypto.randomBytes(16).toString("hex");
  user.salt = newSalt;
  user.passwordHash = hashPassword(newPassword, newSalt);
  user.mustChangePassword = false;
  saveUsers();
  res.json({ success: true, message: "\u0110\u1ED5i m\u1EADt kh\u1EA9u th\xE0nh c\xF4ng!", token: signSession(user) });
});
app.post("/api/auth/reset-student-password", authMiddleware, requireTeacher, (req, res) => {
  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: "Thi\u1EBFu m\xE3 h\u1ECDc sinh" });
  }
  const student = classData.students.find((s) => s.id === studentId);
  const user = users.find((u) => u.studentId === studentId);
  if (!student || !user) {
    return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y h\u1ECDc sinh ho\u1EB7c t\xE0i kho\u1EA3n t\u01B0\u01A1ng \u1EE9ng" });
  }
  const cleanDob = student.dob.replace(/[^0-9]/g, "");
  const newSalt = crypto.randomBytes(16).toString("hex");
  user.salt = newSalt;
  user.passwordHash = hashPassword(cleanDob, newSalt);
  user.mustChangePassword = false;
  saveUsers();
  res.json({
    success: true,
    message: `\u0110\xE3 \u0111\u1EB7t l\u1EA1i m\u1EADt kh\u1EA9u cho h\u1ECDc sinh ${student.fullName} v\u1EC1 ng\xE0y sinh (\u0111\u1ECBnh d\u1EA1ng DDMMYYYY: ${cleanDob})`
  });
});
app.get("/api/data", authMiddleware, (req, res) => {
  const session = req.user;
  if (session.role === "teacher") {
    return res.json(classData);
  }
  const myStudentId = session.studentId;
  const myStudentRecord = classData.students.find((s) => s.id === myStudentId);
  const sanitizedStudents = classData.students.map((s) => {
    if (s.id === myStudentId) {
      return s;
    }
    return {
      id: s.id,
      fullName: s.fullName,
      gender: s.gender,
      dob: "***",
      phone: "***",
      seatCode: s.seatCode
    };
  });
  const publishedAnnouncements = classData.announcements.filter((a) => a.isPublished);
  const publishedHonors = classData.honors.filter((h) => h.isPublished);
  const myAttendance = classData.attendance.filter((a) => a.studentId === myStudentId);
  const myGrades = classData.grades.filter((g) => g.studentId === myStudentId);
  const myDisciplineRecords = classData.disciplineRecords.filter((d) => d.studentId === myStudentId);
  const sanitizedData = {
    settings: {
      appName: classData.settings.appName,
      schoolName: classData.settings.schoolName,
      className: classData.settings.className,
      schoolYear: classData.settings.schoolYear,
      teacherName: classData.settings.teacherName,
      teacherPhone: classData.settings.teacherPhone,
      teacherEmail: classData.settings.teacherEmail,
      startingScore: classData.settings.startingScore,
      evaluationTiers: classData.settings.evaluationTiers
    },
    students: sanitizedStudents,
    seats: classData.seats,
    // Seats only contain studentId and position, safe for viewing layout
    announcements: publishedAnnouncements,
    honors: publishedHonors,
    attendance: myAttendance,
    subjects: classData.subjects.filter((s) => s.isActive),
    grades: myGrades,
    rules: classData.rules,
    disciplineRecords: myDisciplineRecords,
    conductAdjustments: classData.conductAdjustments ? {
      [`${myStudentId}_total`]: classData.conductAdjustments[`${myStudentId}_total`] || void 0
    } : {}
  };
  res.json(sanitizedData);
});
app.post("/api/data/update", authMiddleware, requireTeacher, (req, res) => {
  const updatedData = req.body;
  validatePatch(updatedData);
  if (updatedData.settings) classData.settings = { ...classData.settings, ...updatedData.settings };
  if (updatedData.students) {
    classData.students = updatedData.students;
    classData.students.forEach((student) => {
      const existingUser = users.find((u) => u.studentId === student.id);
      if (!existingUser) {
        const cleanDob = student.dob.replace(/[^0-9]/g, "") || "01012008";
        const salt = crypto.randomBytes(16).toString("hex");
        users.push({
          id: `user-${student.id}`,
          username: student.id.toLowerCase(),
          role: "student",
          studentId: student.id,
          name: student.fullName,
          salt,
          passwordHash: hashPassword(cleanDob, salt),
          mustChangePassword: false
        });
      } else {
        existingUser.name = student.fullName;
      }
    });
    initUsersFromClassData();
  }
  if (updatedData.seats) classData.seats = updatedData.seats;
  if (updatedData.announcements) classData.announcements = updatedData.announcements;
  if (updatedData.honors) classData.honors = updatedData.honors;
  if (updatedData.attendance) classData.attendance = updatedData.attendance;
  if (updatedData.subjects) classData.subjects = updatedData.subjects;
  if (updatedData.grades) classData.grades = updatedData.grades;
  if (updatedData.rules) classData.rules = updatedData.rules;
  if (updatedData.disciplineRecords) classData.disciplineRecords = updatedData.disciplineRecords;
  if (updatedData.conductAdjustments) classData.conductAdjustments = updatedData.conductAdjustments;
  saveDatabase();
  res.json({ success: true, message: "D\u1EEF li\u1EC7u \u0111\xE3 \u0111\u01B0\u1EE3c l\u01B0u th\xE0nh c\xF4ng tr\xEAn m\xE1y ch\u1EE7!" });
});
app.get("/api/data/backup", authMiddleware, requireTeacher, (_req, res) => {
  const scope = getClassScope();
  const filename = `backup_${scope.classId}_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "application/json");
  const payload = {
    metadata: {
      format: "gvcn_class_backup_v2",
      appScope: scopeId(),
      classId: scope.classId,
      className: scope.className,
      teacherUsername: scope.teacherUsername,
      teacherName: scope.teacherName,
      schoolYear: scope.schoolYear,
      schoolName: scope.schoolName,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      studentsCount: classData.students.length
    },
    classData
  };
  res.send(JSON.stringify(payload, null, 2));
});
app.post("/api/data/restore", authMiddleware, requireTeacher, (req, res) => {
  const { backup, confirmDifferentClass } = req.body;
  const backupData = backup || req.body;
  if (!backupData || !backupData.classData && !backupData.students) {
    return res.status(400).json({ error: "T\u1EC7p sao l\u01B0u kh\xF4ng \u0111\xFAng \u0111\u1ECBnh d\u1EA1ng chu\u1EA9n c\u1EE7a h\u1EC7 th\u1ED1ng GVCN" });
  }
  if (backupData.metadata?.appScope && backupData.metadata.appScope !== scopeId()) return res.status(409).json({ error: "B\u1EA3n sao l\u01B0u thu\u1ED9c v\xF9ng d\u1EEF li\u1EC7u kh\xE1c." });
  const restoredData = backupData.classData || backupData;
  validateClass(restoredData);
  const incomingClassName = backupData.metadata?.className || restoredData.settings?.className;
  const currentClassName = classData.settings.className;
  if (incomingClassName && incomingClassName !== currentClassName) {
    return res.status(409).json({
      error: "Ph\xE1t hi\u1EC7n t\u1EC7p sao l\u01B0u thu\u1ED9c l\u1EDBp kh\xE1c",
      requiresConfirmation: false,
      sourceClass: incomingClassName,
      currentClass: currentClassName,
      sourceTeacher: backupData.metadata?.teacherName || restoredData.settings?.teacherName || "Ch\u01B0a r\xF5",
      message: `T\u1EC7p sao l\u01B0u n\xE0y ghi nh\u1EADn thu\u1ED9c "${incomingClassName}" (Gi\xE1o vi\xEAn: ${backupData.metadata?.teacherName || restoredData.settings?.teacherName || "Ch\u01B0a r\xF5"}), kh\xE1c v\u1EDBi l\u1EDBp \u0111ang qu\u1EA3n l\xFD "${currentClassName}". Kh\xF4ng n\u1EA1p v\xE0o l\u1EDBp hi\u1EC7n t\u1EA1i.`
    });
  }
  const safetyBackupName = createAutoBackup("pre_restore_file");
  classData = {
    settings: restoredData.settings || classData.settings,
    students: restoredData.students || [],
    seats: restoredData.seats || generateInitialSeats(),
    announcements: restoredData.announcements || [],
    honors: restoredData.honors || [],
    attendance: restoredData.attendance || [],
    subjects: restoredData.subjects || classData.subjects,
    grades: restoredData.grades || [],
    rules: restoredData.rules || classData.rules,
    disciplineRecords: restoredData.disciplineRecords || [],
    conductAdjustments: restoredData.conductAdjustments || {}
  };
  saveDatabase();
  initUsersFromClassData();
  res.json({
    success: true,
    message: `Kh\xF4i ph\u1EE5c d\u1EEF li\u1EC7u th\xE0nh c\xF4ng cho ${classData.settings.className}! (\u0110\xE3 t\u1EF1 \u0111\u1ED9ng t\u1EA1o b\u1EA3n sao l\u01B0u an to\xE0n c\u1EE7a l\u1EDBp tr\u01B0\u1EDBc \u0111\xF3: ${safetyBackupName})`,
    backupCreated: safetyBackupName,
    classData
  });
});
app.post("/api/data/reset-demo", authMiddleware, requireTeacher, (_req, res) => {
  const safetyBackupName = createAutoBackup("pre_reset_demo");
  classData = emptyClass();
  saveDatabase();
  initUsersFromClassData();
  res.json({
    success: true,
    message: `\u0110\xE3 thi\u1EBFt l\u1EADp l\u1EA1i d\u1EEF li\u1EC7u m\u1EABu cho ${classData.settings.className}! (\u0110\xE3 t\u1EA1o sao l\u01B0u tr\u01B0\u1EDBc \u0111\xF3: ${safetyBackupName})`
  });
});
app.get("/api/supabase/status", authMiddleware, requireTeacher, (_req, res) => {
  const scope = getClassScope();
  res.json({
    connected: true,
    url: process.env.SUPABASE_URL,
    table: "gvcn_private_state",
    classKey: scope.classKey,
    usersKey: scope.usersKey,
    className: scope.className,
    teacherUsername: scope.teacherUsername,
    teacherName: scope.teacherName,
    lastSync: lastSavedAt,
    error: null,
    hasRemoteData: true,
    hasMainClassData: false,
    notice: "D\u1EEF li\u1EC7u \u0111\u01B0\u1EE3c l\u01B0u tr\u1EF1c ti\u1EBFp tr\xEAn Supabase trong v\xF9ng ri\xEAng c\u1EE7a \u1EE9ng d\u1EE5ng. Kh\xF4ng truy c\u1EADp l\u1EDBp kh\xE1c."
  });
});
app.post("/api/supabase/sync-now", authMiddleware, requireTeacher, (_req, res) => {
  res.json({
    success: true,
    message: "D\u1EEF li\u1EC7u \u0111\xE3 \u0111\u01B0\u1EE3c l\u01B0u tr\u1EF1c ti\u1EBFp tr\xEAn Supabase.",
    lastSync: lastSavedAt,
    classKey: scopeId(),
    usersKey: scopeId()
  });
});
app.post("/api/supabase/pull", authMiddleware, requireTeacher, (_req, res) => {
  res.json({ success: true, message: "\u0110\xE3 \u0111\u1ECDc b\u1EA3n m\u1EDBi nh\u1EA5t c\u1EE7a \u0111\xFAng \u1EE9ng d\u1EE5ng t\u1EEB Supabase.", classData });
});
app.get("/api/supabase/available-datasets", authMiddleware, requireTeacher, (_req, res) => {
  res.json({ currentClass: classData.settings.className, currentClassKey: scopeId(), datasets: [{
    id: scopeId(),
    updatedAt: lastSavedAt,
    className: classData.settings.className,
    teacherName: classData.settings.teacherName,
    studentsCount: classData.students.length,
    isCurrentClass: true,
    isExternal: false,
    is9A5: false,
    statusLabel: "L\u1EDBp \u0111ang qu\u1EA3n l\xFD"
  }] });
});
app.post("/api/supabase/migrate-dataset", authMiddleware, requireTeacher, (_req, res) => {
  res.status(403).json({ error: "Kh\xF4ng cho ph\xE9p n\u1EA1p d\u1EEF li\u1EC7u l\u1EDBp kh\xE1c. H\xE3y d\xF9ng b\u1EA3n sao l\u01B0u c\u1EE7a ch\xEDnh l\u1EDBp n\xE0y." });
});
app.get("/api/supabase/sql-schema", authMiddleware, requireTeacher, (_req, res) => {
  res.type("text/plain").send("Xem file supabase_setup_private.sql trong b\u1ED9 m\xE3 \u0111\xE3 s\u1EEDa.");
});
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API endpoint kh\xF4ng t\u1ED3n t\u1EA1i: ${req.method} ${req.path}` });
});
app.use((err, _req, res, _next) => {
  console.error("[GVCN Server Error Handler]:", err);
  res.status(err.status || 500).json({ error: err.message || "L\u1ED7i x\u1EED l\xFD n\u1ED9i b\u1ED9 tr\xEAn m\xE1y ch\u1EE7" });
});
var app_default = app;
export {
  app_default as default
};
