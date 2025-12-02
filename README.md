# 🚀 ỨNG DỤNG QUẢN LÝ GIAO ĐỒ ĂN NHANH 
## Giới thiệu

Đây là ứng dụng Web Demo (Sử dụng **Node.js/Express** cho Backend và **MSSQL** cho cơ sở dữ liệu) nhằm mục đích quản lý dữ liệu và thực hiện các thao tác CRUD cơ bản.

## 📋 Yêu cầu Hệ thống

Để chạy dự án này, bạn cần cài đặt các công cụ sau trên máy tính:

1.  **Node.js & npm** (Node Package Manager)
2.  **SQL Server / SQL Server Express** (Đã cài đặt và khởi động)

## 🛠️ Cài đặt & Khởi động Dự án

Thực hiện các bước sau để thiết lập và chạy ứng dụng:

### 1. Cài đặt các Dependencies

Mở Terminal hoặc Command Prompt tại thư mục gốc của dự án và chạy lệnh sau để cài đặt các thư viện cần thiết:
npm install

2. Thiết lập Biến Môi trường (.env)
Dự án sử dụng file .env để quản lý các thông tin cấu hình nhạy cảm và kết nối cơ sở dữ liệu.

Tạo một file mới tên là .env tại thư mục gốc của dự án.

Sao chép và điền thông tin kết nối SQL Server của bạn vào file đó:

# Thông tin kết nối SQL Server
DB_USER=(tên user)
DB_PASSWORD=(password)
DB_SERVER=(tên server)
DB_DATABASE=(tên db)
DB_PORT=1433

# Cấu hình kết nối
# Đặt là 'false' cho môi trường phát triển cục bộ (local dev)
DB_ENCRYPT=false
⚠️ Lưu ý Bảo mật: File .env đã được thêm vào .gitignore để tránh bị đẩy lên các kho lưu trữ công khai như GitHub.

Khởi chạy Ứng dụng
Chạy lệnh sau để khởi động Server Express:
node server.js

Truy cập Ứng dụng
Sau khi Server khởi động thành công, bạn sẽ thấy thông báo trong Terminal:
🚀 Server running at http://localhost:3000
Mở trình duyệt và truy cập vào địa chỉ sau để sử dụng giao diện người dùng:
pull request
