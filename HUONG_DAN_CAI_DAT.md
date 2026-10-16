# Bản sửa website chủ nhiệm cô Thùy — 16/10/2026

Đây là bản mã đã sửa từ ZIP cô gửi, chưa được triển khai lên tài khoản Vercel của cô. Giữ lại ZIP gốc trên máy làm bản dự phòng.

## Những gì đã sửa

- Thêm API serverless và định tuyến để POST /api/auth/login không bị thiếu endpoint trên Vercel.
- Biên dịch/gộp mã backend trước khi triển khai để tránh lỗi import server không có phần mở rộng.
- Tách Vite và app.listen khỏi API production.
- Lưu trực tiếp trên hai bảng Supabase riêng: gvcn_private_state, gvcn_private_backups. Không đọc/ghi bảng app_data, không tự động nạp lớp 9A5 và không đồng bộ dữ liệu mẫu khi khởi động.
- Không đưa users.json (chứa thông tin xác thực cũ) vào bản sửa.
- Phiên đăng nhập được ký, sử dụng qua các instance; đổi mật khẩu vô hiệu hóa phiên cũ. Bỏ đường tắt chấp nhận mật khẩu mặc định.
- Kiểm tra phiên bản trước khi lưu, tránh thiết bị đang mở dữ liệu cũ ghi đè bản mới. Khi lỗi lưu sẽ báo thất bại và thử tải lại bản đã lưu.
- Sao lưu trước khi khôi phục/reset được lưu vào bảng riêng; giữ mật khẩu giáo viên khi phục hồi dữ liệu lớp.
- Giao diện báo rõ HTTP/API lỗi thay vì Unexpected token / lỗi JSON khó hiểu.

## 1. Chạy SQL thiết lập một lần

Mở Supabase → đúng dự án → SQL Editor → New query.
Mở file supabase_setup_private.sql trong bộ mã, sao chép toàn bộ và Run.
SQL này tạo hai bảng riêng có RLS và chỉ cấp quyền service_role. Không xóa hay sửa các bảng/lớp cũ.
Không chạy lại SQL cũ có USING (true) cho anon để sửa lỗi đăng nhập.

## 2. Đặt biến trên đúng dự án Vercel

Chọn dự án có domain web-chu-nhiem-co-thuy.vercel.app → Environment Variables. Đặt cho Production; nếu dùng Preview thì dùng APP_DATA_SCOPE khác cho Preview để không đụng dữ liệu thật.

| Tên | Giá trị |
|---|---|
| SUPABASE_URL | https://sohuavueougdlsqerwuk.supabase.co |
| SUPABASE_SECRET_KEY | Secret key lấy từ phần API Keys của Supabase. Chỉ dán vào Vercel, không gửi qua chat/GitHub. Có thể dùng SUPABASE_SERVICE_ROLE_KEY thay thế nếu dự án dùng khóa service_role cũ. |
| SESSION_SECRET | Chuỗi ngẫu nhiên riêng tư dài ít nhất 32 ký tự, giữ nguyên qua các lần triển khai |
| APP_DATA_SCOPE | co-thuy-9a2-2026-2027 — mã riêng, cố định cho ứng dụng này. Không dùng chung với app/lớp khác. |
| INITIAL_ADMIN_PASSWORD | Mật khẩu riêng cô tự chọn, ít nhất 12 ký tự; dùng lần đăng nhập khởi tạo đầu tiên |

Không thêm VITE_ trước tên secret key. Những biến VITE_SUPABASE_* cũ không được backend mới sử dụng; có thể giữ nguyên, không thay bằng secret key.
Mật khẩu giaovien123 không còn được chấp nhận mặc định.
Nếu đã từng tạo vùng với APP_DATA_SCOPE này, INITIAL_ADMIN_PASSWORD không thay thế mật khẩu hiện có; dùng mật khẩu đã lưu hoặc chức năng đổi mật khẩu trong ứng dụng.

## 3. Cập nhật GitHub

Giải nén ZIP, mở thư mục web-chu-nhiem-co-thuy-main.
Vào đúng kho GitHub kết nối với dự án mới → Add file → Upload files.
Kéo toàn bộ NỘI DUNG trong thư mục đó lên thư mục gốc của kho; không kéo cả thư mục cha tạo thêm một tầng.
Đảm bảo package.json, vercel.json, api/, backend/, scripts/, src/ nằm trực tiếp ở gốc.
Commit changes lên main.
Nếu kho còn bun.lock, hãy xóa file bun.lock cũ vì bản sửa dùng package-lock.json và npm. Xóa data/users.json cũ khỏi mã nguồn (tài khoản mới được tạo riêng; không xóa dữ liệu Supabase).
Đặt .env.example nếu cần, tuyệt đối không tải .env thật lên GitHub.

Trong Vercel, kiểm tra Build and Deployment:
- Framework: Vite
- Root Directory: thư mục gốc có package.json
- Install Command: npm ci (hoặc để tự động với package-lock.json)
- Build Command: npm run build
- Output Directory: dist
- Node.js: 22.x

Đợi bản triển khai mới nhất từ commit vừa cập nhật báo Ready. Nếu thêm biến sau khi build đã chạy, Redeploy chính bản commit mới đó để áp dụng biến.

## 4. Kiểm tra

1. Mở https://web-chu-nhiem-co-thuy.vercel.app/api/health
   Kỳ vọng: {"ok":true,"build":"gvcn-vercel-fix-v1"}. Đây chỉ kiểm tra routing, chưa kiểm tra Supabase.
2. Vào trang chủ, Ctrl+Shift+R.
3. Chọn Giáo viên, nhập INITIAL_ADMIN_PASSWORD đã đặt. Tên đăng nhập bên trong là gvcn.
4. Lần đầu chỉ tạo lớp trống từ cấu hình mẫu 9A2; không tự nạp học sinh/dữ liệu cũ. Kiểm tra và chỉnh trường, tên giáo viên, tên lớp, năm học trong Cài đặt trước khi nhập danh sách.
5. Chỉ phục hồi bản sao lưu của chính lớp hiện tại. Nếu file thuộc tên lớp khác, hệ thống từ chối; không đổi tên để lách kiểm tra.
6. Nhập một thông báo thử, kiểm tra trên điện thoại cùng domain. Đổi mật khẩu rồi kiểm tra mật khẩu cũ bị từ chối.

Nếu 404: kiểm tra đúng repo, commit và /api/health; không chạy thêm SQL để chữa routing.
Nếu 503: đọc thông báo lỗi; thường thiếu biến hoặc chưa chạy SQL hai bảng mới. Xem Logs trên Vercel.
Nếu 409 khi lưu: tải lại trang để lấy bản mới từ thiết bị khác rồi thao tác lại, không cố đẩy dữ liệu cũ.

## Giới hạn cần biết

- Đã kiểm tra TypeScript, build production và test API với Supabase giả lập, không truy cập hay thay đổi Supabase thật của cô. Chưa kiểm thử triển khai trên tài khoản Vercel thật.
- Bản này phục vụ một ứng dụng/một lớp/một tài khoản giáo viên; namespace cố định theo cấu hình. Muốn quản lý nhiều giáo viên độc lập trong cùng một app cần mô hình tài khoản/phân quyền riêng.
- Bảng cũ vẫn giữ nguyên quyền cũ. Nếu trước đây đã chạy SQL cho anon đọc/ghi toàn bộ app_data thì dữ liệu cũ có thể vẫn truy cập bằng khóa công khai. Cần kiểm tra quyền của bảng cũ riêng, sau khi xác định các app khác đang dùng; bản sửa này không tự thu hồi quyền vì có thể làm hỏng app lớp khác.
- Bộ ZIP không chứa bản dữ liệu lớp đã nhập trên môi trường AI Studio. Cần xuất sao lưu từ app cũ để phục hồi có kiểm soát; không có chức năng tự nhập dữ liệu lớp khác.
- Dữ liệu dạng toàn bộ JSON, giới hạn request 3 MB để phù hợp triển khai. Không dùng app làm nơi tải video/tệp lớn.
- Các bản sao lưu tự động có dữ liệu tài khoản băm và chỉ backend được truy cập; bản xuất cho giáo viên chỉ gồm dữ liệu lớp, không gồm mật khẩu.

## Lệnh kiểm tra cho người hỗ trợ kỹ thuật

npm ci
npm run lint
npm test
npm run build

npm test dùng HTTP Supabase giả lập, kiểm tra: không ghi khi khởi động, khởi tạo có mật khẩu, phiên qua hai instance, lưu/đọc liên thiết bị, từ chối ghi phiên bản cũ, học sinh không sửa dữ liệu, đổi mật khẩu/vô hiệu phiên cũ, từ chối mật khẩu mặc định, chặn khôi phục khác lớp, sao lưu bền vững trước khôi phục và không báo thành công khi Supabase lỗi.
