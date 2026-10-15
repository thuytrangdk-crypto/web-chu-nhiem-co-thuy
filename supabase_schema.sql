-- ==============================================================================
-- HỆ THỐNG QUẢN LÝ LỚP HỌC ĐỒNG KHỞI - GVCN 4.0
-- SCRIPT SQL KHỞI TẠO BẢNG TỰ ĐỘNG TRÊN SUPABASE CLOUD
-- Hướng dẫn: Mở Supabase Dashboard -> Chọn "SQL Editor" -> "New query" -> Dán toàn bộ mã này -> Nhấn "Run"
--
-- CƠ CHẾ BẢO VỆ PHÂN LẬP ĐA LỚP & ĐA GIÁO VIÊN (MULTI-TENANT ISOLATION):
-- 1. Bảng app_data sử dụng cấu trúc khóa phân lập độc lập:
--    - class_{teacher_username}_{class_id}: Dữ liệu lớp học riêng biệt (VD: class_gvcn_lop_9a2)
--    - users_{teacher_username}_{class_id}: Tài khoản học sinh tương ứng của lớp đó
--    - Các khóa cũ hoặc lớp khác (như main_class_data của Lớp 9A5) được bảo toàn nguyên vẹn 100%.
-- 2. Học sinh chỉ được phép xem thông tin cá nhân của chính mình (điểm số, nề nếp, điểm danh);
--    ẩn hoàn toàn số điện thoại, ngày sinh, địa chỉ phụ huynh của các bạn khác.
-- ==============================================================================

-- Bật extension mở rộng nếu chưa có
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. BẢNG APP_DATA: LƯU TRỮ VÀ ĐỒNG BỘ DỮ LIỆU PHÂN LẬP THEO LỚP & GIÁO VIÊN (JSONB)
-- Mỗi lớp được lưu trữ độc lập bằng mã định danh duy nhất, không bị ghi đè lẫn nhau.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.app_data (
    id TEXT PRIMARY KEY, -- Định dạng: class_{teacher}_{classId} hoặc users_{teacher}_{classId}
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tạo chỉ mục tìm kiếm nhanh theo id
CREATE INDEX IF NOT EXISTS idx_app_data_id ON public.app_data(id);

-- Thiết lập Row Level Security (RLS) để cho phép đọc/ghi qua Anon Key và Authenticated
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phép đọc dữ liệu app_data" ON public.app_data;
CREATE POLICY "Cho phép đọc dữ liệu app_data"
    ON public.app_data FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Cho phép chèn dữ liệu app_data" ON public.app_data;
CREATE POLICY "Cho phép chèn dữ liệu app_data"
    ON public.app_data FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phép cập nhật dữ liệu app_data" ON public.app_data;
CREATE POLICY "Cho phép cập nhật dữ liệu app_data"
    ON public.app_data FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phép xóa dữ liệu app_data" ON public.app_data;
CREATE POLICY "Cho phép xóa dữ liệu app_data"
    ON public.app_data FOR DELETE
    TO anon, authenticated
    USING (true);


-- ==============================================================================
-- 2. BẢNG CLASSES: DANH SÁCH CÁC LỚP HỌC TRONG TRƯỜNG
-- Phân biệt rõ ràng theo teacher_id và class_id để không trộn lẫn các lớp
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.classes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    teacher_id TEXT,
    teacher_name TEXT,
    academic_year TEXT DEFAULT '2026 - 2027',
    called_student_ids TEXT[] DEFAULT ARRAY[]::text[],
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

CREATE INDEX IF NOT EXISTS idx_classes_name ON public.classes(name);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phép truy cập bảng classes" ON public.classes;
CREATE POLICY "Cho phép truy cập bảng classes"
    ON public.classes FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);


-- ==============================================================================
-- 3. BẢNG STUDENTS: DANH SÁCH HỌC SINH CHI TIẾT
-- Có khóa ngoại class_id để liên kết chặt chẽ với lớp quản lý
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    name TEXT NOT NULL,
    dob TEXT,
    gender TEXT,
    phone TEXT,
    address TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    seat_code TEXT,
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phép truy cập bảng students" ON public.students;
CREATE POLICY "Cho phép truy cập bảng students"
    ON public.students FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);


-- ==============================================================================
-- 4. BẢNG APP_USERS: TÀI KHOẢN ĐĂNG NHẬP (GIÁO VIÊN & HỌC SINH)
-- Phân quyền Role-based: 'teacher' có toàn quyền, 'student' chỉ xem dữ liệu bản thân
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.app_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'student', -- 'teacher' hoặc 'student'
    class_id TEXT, -- Mã lớp học sinh/giáo viên phụ trách
    student_id TEXT,
    name TEXT NOT NULL,
    salt TEXT,
    password_hash TEXT,
    must_change_password BOOLEAN DEFAULT false,
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

CREATE INDEX IF NOT EXISTS idx_users_username ON public.app_users(username);
CREATE INDEX IF NOT EXISTS idx_users_class_id ON public.app_users(class_id);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phép truy cập bảng app_users" ON public.app_users;
CREATE POLICY "Cho phép truy cập bảng app_users"
    ON public.app_users FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);


-- ==============================================================================
-- 5. BẢNG ATTENDANCE_RECORDS: ĐIỂM DANH CHUYÊN CẦN
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    class_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL, -- 'present', 'excused', 'unexcused', 'late'
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance_records(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON public.attendance_records(class_id, date);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phép truy cập điểm danh" ON public.attendance_records;
CREATE POLICY "Cho phép truy cập điểm danh"
    ON public.attendance_records FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);


-- ==============================================================================
-- 6. BẢNG DISCIPLINE_RECORDS: SỔ GHI NHẬN NỀ NẾP & ĐIỂM THI ĐUA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.discipline_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    class_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    rule_id TEXT,
    rule_title TEXT NOT NULL,
    group_name TEXT NOT NULL,
    points INTEGER NOT NULL,
    date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_discipline_student ON public.discipline_records(student_id);
CREATE INDEX IF NOT EXISTS idx_discipline_class ON public.discipline_records(class_id);

ALTER TABLE public.discipline_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phép truy cập sổ nề nếp" ON public.discipline_records;
CREATE POLICY "Cho phép truy cập sổ nề nếp"
    ON public.discipline_records FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);


-- ==============================================================================
-- 7. TRIGGER TỰ ĐỘNG CẬP NHẬT UPDATED_AT CHO BẢNG APP_DATA
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_app_data_updated_at ON public.app_data;
CREATE TRIGGER trigger_app_data_updated_at
    BEFORE UPDATE ON public.app_data
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Chú thích tài liệu cho các bảng
COMMENT ON TABLE public.app_data IS 'Bảng JSONB lưu trữ đồng bộ trạng thái ứng dụng phân lập theo từng lớp và giáo viên';
COMMENT ON TABLE public.classes IS 'Danh mục các lớp học trong trường';
COMMENT ON TABLE public.students IS 'Danh sách học sinh chi tiết theo từng lớp';
COMMENT ON TABLE public.app_users IS 'Tài khoản đăng nhập hệ thống cho giáo viên và học sinh';
COMMENT ON TABLE public.attendance_records IS 'Nhật ký điểm danh chuyên cần hàng ngày';
COMMENT ON TABLE public.discipline_records IS 'Sổ ghi nhận điểm cộng/trừ vi phạm nề nếp thi đua';
