# MIPA-Temu

**Sistem Informasi Lost & Found Fakultas MIPA Universitas Syiah Kuala**

## 1. Deskripsi Project

MIPA-Temu merupakan aplikasi berbasis web yang dirancang untuk membantu mahasiswa dan civitas akademika Fakultas MIPA Universitas Syiah Kuala dalam melaporkan, mencari, memverifikasi, dan mengembalikan barang hilang.

Sistem ini menyediakan mekanisme verifikasi kepemilikan agar barang tidak sembarangan diklaim oleh orang lain, serta pencatatan perpindahan barang untuk menjaga transparansi proses pengembalian.

## 2. Latar Belakang

Kehilangan barang di lingkungan kampus merupakan masalah yang cukup sering terjadi. Informasi mengenai barang yang ditemukan biasanya tersebar melalui grup percakapan atau media sosial sehingga sulit dicari dan tidak terorganisasi.

MIPA-Temu dikembangkan sebagai platform terpusat untuk mengelola informasi barang hilang dan ditemukan, sekaligus meningkatkan keamanan proses klaim dan pengembalian barang.

## 3. Tujuan

- Mempermudah pelaporan barang yang ditemukan.
- Memusatkan informasi barang temuan dalam satu platform.
- Memastikan proses klaim dilakukan oleh pemilik yang tepat.
- Mencegah klaim ganda terhadap barang yang sama.
- Mencatat riwayat perpindahan dan pengembalian barang.

## 4. Fitur Utama

1. **Report Found Item**  
   Fitur untuk melaporkan barang yang ditemukan dengan informasi dan foto barang.

2. **Lost & Found Catalog**  
   Katalog barang temuan yang dilengkapi pencarian dan filter kategori maupun lokasi.

3. **Blind Verification**  
   Mekanisme verifikasi kepemilikan menggunakan informasi rahasia yang hanya diketahui oleh pelapor dan calon pemilik.

4. **Chain of Custody**  
   Pencatatan riwayat perpindahan dan penyimpanan barang oleh petugas.

5. **Handover Confirmation**  
   Konfirmasi pengambilan barang menggunakan kode serah terima.

## 5. Pengguna Sistem

| Pengguna | Hak Akses |
|---|---|
| Mahasiswa | Melaporkan barang, mencari barang, mengajukan klaim, melihat aktivitas |
| Admin | Memverifikasi laporan dan klaim serta mengelola data sistem |
| Petugas | Mencatat perpindahan barang dan mengonfirmasi serah terima |

## 6. Teknologi yang Digunakan

| Bagian | Teknologi |
|---|---|
| Frontend | React.js, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | Oracle Database XE 21c |
| Database Driver | node-oracledb (Thin Mode) |
| API Testing | Postman |
| Version Control | Git dan GitHub |
| UI/UX Design | Figma |

## 7. Database

Sistem menggunakan Oracle Database dengan enam tabel utama:

1. Users
2. Categories
3. Items
4. Claims
5. Custody_Records
6. Handover_Records

Implementasi database mencakup relasi tabel, normalisasi, index, trigger, stored procedure, transaction, dan view.

## 8. Anggota Kelompok

| Nama | Tanggung Jawab |
|---|---|
| Kyan | Database dan Testing |
| Rahada | Frontend Development |
| Hakim | Backend Development |

## 9. Konteks Pengembangan

Project ini dikembangkan sebagai tugas akhir semester (UAS) pada Program Studi Informatika, Fakultas MIPA, Universitas Syiah Kuala.

---

**MIPA-Temu**  
*Mencari, Memverifikasi, Mengembalikan.*