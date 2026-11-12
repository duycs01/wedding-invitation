# Thiệp cưới Văn Minh & Thị Thảo

Bản HTML/CSS/JavaScript tĩnh dựa trên mẫu:
https://thiepdep.online/thiep/nguyen-van-minh-tran-thi-thao-102721

## Chạy
Giải nén và mở index.html bằng trình duyệt. Không cần npm hoặc build.
Có thể chạy qua VS Code Live Server hoặc: python -m http.server 8080
Sau đó truy cập http://localhost:8080

## Cấu trúc
- index.html: nội dung, tên, ngày cưới, thông tin gia đình, địa chỉ, biểu mẫu.
- style.css: giao diện responsive và hiệu ứng của mẫu.
- script.js: mở thiệp, nhạc, đếm ngược, hộp xác nhận và sổ lưu bút.
- assets/: hình minh họa, font chữ, nhạc đã tải về.

## Chỉnh sửa
Đổi thông tin trực tiếp trong index.html. Khi đổi ngày cưới, cập nhật thêm biến wedding trong script.js, lịch tháng, đường dẫn Google Calendar và ngày hiển thị trong HTML.
Đổi địa điểm ở phần địa chỉ, liên kết chỉ đường và iframe bản đồ.

## Phạm vi
Lời chúc và xác nhận tham dự chỉ lưu bằng localStorage trên thiết bị đang dùng; không gửi đến chủ thiệp và không đồng bộ giữa các thiết bị. Cần nối API hoặc dịch vụ lưu trữ nếu muốn nhận thông tin thực tế.
Bản đồ và liên kết Google cần Internet. Nhạc bắt đầu sau thao tác mở thiệp, tùy chính sách tự phát của trình duyệt.
Ảnh, font, nhạc và thiết kế được lấy từ trang tham chiếu; kiểm tra quyền sử dụng trước khi tái phân phối hoặc dùng thương mại.
JavaScript được viết lại, không bao gồm backend hay mã nguồn Next.js của dịch vụ gốc.
Đã kiểm tra cú pháp JavaScript và đường dẫn tài nguyên cục bộ. Chưa xác minh giao diện bằng trình duyệt trong môi trường này do Chromium không được phép khởi chạy.

Bản sửa: đóng đúng lớp cover để phần paper là phần tử cùng cấp; khi ẩn bìa không còn ẩn nội dung thiệp.
