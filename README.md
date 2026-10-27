# 🎸 Aplikasi Penjualan Merch & Kas Band (PWA iPhone & Google Sheets)

Aplikasi pencatatan penjualan merchandise dan arus kas band berbasis **Progressive Web App (PWA)** yang dapat diinstal langsung di layar utama iPhone (iOS) tanpa App Store, dan semua datanya otomatis tersimpan secara real-time ke **Google Spreadsheet**.

---

## 🚀 Fitur Aplikasi

### 1. 👕 Menu Penjualan (Menu Utama)
Pencatatan pemesanan & penjualan merchandise dengan kolom lengkap:
- **Nomor**: Urutan nomor pemesanan otomatis.
- **Nama**: Nama pemesan / pembeli.
- **Ukuran**: S, M, L, XL, XXL, XXXL, Custom.
- **Tipe**: Pilihan tombol **Pendek** atau **Panjang**.
- **Harga**: Total harga barang (Rp).
- **DP**: Uang muka yang sudah dibayar (Rp).
- **Lunas**: Status pelunasan (*Lunas* / *Belum Lunas*) & otomatis menghitung sisa tagihan.
- **Tabel & Filter**: Filter cepat Lunas, Belum Lunas, Pendek, Panjang, dan pencarian nama.

### 2. 💰 Menu Kas Band (Keuangan Masuk & Keluar)
Pencatatan arus kas operasional band:
- **Saldo Kas Live**: Menampilkan total saldo saat ini secara real-time.
- **Pemasukan (+)**: Pencatatan honor manggung, kas anggota, dll (badge hijau).
- **Pengeluaran (-)**: Pencatatan sewa studio, produksi merch, transport, konsumsi (badge merah).
- **Riwayat Arus Kas**: Filter pemasukan, pengeluaran, atau semua transaksi.

### 3. 📊 Menu Laporan
- Rekap total nilai pesanan, uang masuk, dan sisa piutang.
- Sebaran ukuran pesanan (berapa pcs S, M, L, XL, XXL).
- Perbandingan pemesanan tipe Pendek vs Panjang.
- Rekap total pemasukan, pengeluaran, dan saldo akhir Kas Band.

---

## 🛠️ Langkah Pasang / Update Google Apps Script

1. Buka spreadsheet Anda di [Google Sheets](https://sheets.google.com).
2. Buka menu **Ekstensi (Extensions) > Apps Script**.
3. Hapus kode lama, ganti dengan seluruh isi file [`google-apps-script.js`](./google-apps-script.js).
4. Tekan **Save** (`Ctrl + S`).
5. Klik **Deploy > Manage deployments**.
6. Klik ikon **Pensil (Edit)** ✏️.
7. Di bagian **Version**, pilih **New version** (Versi baru).
8. Pastikan **Who has access** tetap **"Anyone" (Siapa saja)**.
9. Klik **Deploy**.

---

## 📱 Pasang di iPhone (iOS Safari)

1. Buka link web di browser **Safari iPhone**.
2. Ketuk ikon **Bagikan (Share)** `⎋` di bagian bawah.
3. Pilih **"Tambahkan ke Layar Utama" (Add to Home Screen)** `➕`.
4. Ketuk **Tambah (Add)** di kanan atas.
