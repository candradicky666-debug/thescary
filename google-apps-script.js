/**
 * GOOGLE APPS SCRIPT - API BACKEND PENJUALAN & KAS BAND
 * (Mendukung Multi-Sesi/Batch Penjualan, Riwayat, Simpan, Edit, Hapus)
 */

const SHEET_PENJUALAN = "Penjualan";
const SHEET_KAS_BAND = "Kas Band";

const HEADERS_PENJUALAN = [
  "No",
  "Waktu",
  "Nama",
  "Ukuran",
  "Tipe",
  "Harga",
  "DP",
  "Sisa",
  "Status Lunas",
  "Catatan",
  "Sesi"
];

const HEADERS_KAS_BAND = [
  "ID",
  "Waktu",
  "Jenis",
  "Keterangan",
  "Kategori",
  "Jumlah",
  "Catatan"
];

function getOrCreateSheet(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#2563EB")
      .setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  } else if (sheet.getLastColumn() < headers.length) {
    // Otomatis tambahkan kolom baru (misal: Sesi) jika belum ada
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function parseSheetRows(sheet) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  
  const headers = rows[0];
  const list = [];
  
  // Baca berurutan dari atas ke bawah (No 1, 2, 3...)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Abaikan baris dummy kosong (nama '-' dan harga 0)
    const namaCol = String(row[2] || "").trim();
    const hargaCol = Number(row[5] || 0);
    if ((namaCol === "-" || namaCol === "") && hargaCol === 0 && row.length > 5) {
      continue;
    }

    const item = {};
    headers.forEach((header, index) => {
      if (row[index] instanceof Date) {
        item[header] = Utilities.formatDate(row[index], Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      } else {
        item[header] = row[index];
      }
    });
    // Default sesi jika data lama belum memiliki kolom Sesi
    if (!item['Sesi']) {
      item['Sesi'] = "Penjualan 1";
    }
    list.push(item);
  }
  return list;
}

// Endpoint GET: Mengambil data Penjualan & Kas Band
function doGet(e) {
  try {
    const sheetPenjualan = getOrCreateSheet(SHEET_PENJUALAN, HEADERS_PENJUALAN);
    const sheetKasBand = getOrCreateSheet(SHEET_KAS_BAND, HEADERS_KAS_BAND);
    
    const dataPenjualan = parseSheetRows(sheetPenjualan);
    const dataKasBand = parseSheetRows(sheetKasBand);
    
    return createJsonResponse({
      status: "success",
      version: "2.1",
      penjualan: dataPenjualan,
      kasBand: dataKasBand,
      data: dataPenjualan
    });
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

// Endpoint POST: Simpan Baru, Edit & Hapus (Mendukung Multi-User 3 Orang Bersamaan)
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Tunggu antrean sampai 30 detik jika ada anggota lain yang input di detik yang sama
    lock.waitLock(30000);

    let body;
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      body = e.parameter;
    } else {
      throw new Error("Data transaksi kosong");
    }
    
    const action = body.action || "penjualan";
    const waktu = body.waktu || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

    // ==========================================
    // 1. TAMBAH KAS BAND
    // ==========================================
    if (action === "kas_band") {
      const sheetKas = getOrCreateSheet(SHEET_KAS_BAND, HEADERS_KAS_BAND);
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const idKas = body.id || ("KAS-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss") + "-" + randSuffix);
      const jenis = body.jenis || "Pemasukan";
      const keterangan = body.keterangan || "-";
      const kategori = body.kategori || "Umum";
      const jumlah = Number(body.jumlah) || 0;
      const catatan = body.catatan || "-";

      sheetKas.appendRow([
        idKas,
        waktu,
        jenis,
        keterangan,
        kategori,
        jumlah,
        catatan
      ]);

      return createJsonResponse({
        status: "success",
        message: "Catatan Kas Band berhasil disimpan!",
        data: { id: idKas, jenis: jenis, jumlah: jumlah }
      });
    }

    // ==========================================
    // 2. EDIT KAS BAND
    // ==========================================
    if (action === "edit_kas_band") {
      const sheetKas = getOrCreateSheet(SHEET_KAS_BAND, HEADERS_KAS_BAND);
      const rows = sheetKas.getDataRange().getValues();
      const targetId = String(body.id);
      let foundRow = -1;

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === targetId) {
          foundRow = i + 1;
          break;
        }
      }

      if (foundRow === -1 && body.index !== undefined) {
        foundRow = Number(body.index) + 2;
      }

      if (foundRow === -1 || foundRow > rows.length) {
        throw new Error("Data kas band tidak ditemukan");
      }

      const jenis = body.jenis || "Pemasukan";
      const keterangan = body.keterangan || "-";
      const kategori = body.kategori || "Umum";
      const jumlah = Number(body.jumlah) || 0;
      const catatan = body.catatan || "-";

      sheetKas.getRange(foundRow, 3, 1, 5).setValues([[
        jenis,
        keterangan,
        kategori,
        jumlah,
        catatan
      ]]);

      return createJsonResponse({
        status: "success",
        message: "Catatan Kas Band berhasil diperbarui!"
      });
    }

    // ==========================================
    // 3. HAPUS KAS BAND
    // ==========================================
    if (action === "hapus_kas_band") {
      const sheetKas = getOrCreateSheet(SHEET_KAS_BAND, HEADERS_KAS_BAND);
      const rows = sheetKas.getDataRange().getValues();
      const targetId = String(body.id);
      let foundRow = -1;

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === targetId) {
          foundRow = i + 1;
          break;
        }
      }

      if (foundRow === -1 && body.index !== undefined) {
        foundRow = Number(body.index) + 2;
      }

      if (foundRow === -1 || foundRow > rows.length) {
        throw new Error("Data kas band tidak ditemukan");
      }

      sheetKas.deleteRow(foundRow);

      return createJsonResponse({
        status: "success",
        message: "Catatan Kas Band berhasil dihapus!"
      });
    }

    // ==========================================
    // 4. EDIT DATA PENJUALAN
    // ==========================================
    if (action === "edit_penjualan") {
      const sheetPenjualan = getOrCreateSheet(SHEET_PENJUALAN, HEADERS_PENJUALAN);
      const rows = sheetPenjualan.getDataRange().getValues();
      const targetNo = Number(body.nomor);
      const targetSesi = String(body.sesi || "");
      let foundRow = -1;

      for (let i = 1; i < rows.length; i++) {
        const rowNo = Number(rows[i][0]);
        const rowSesi = String(rows[i][10] || "Penjualan 1");
        if (rowNo === targetNo && (!targetSesi || rowSesi === targetSesi)) {
          foundRow = i + 1;
          break;
        }
      }

      if (foundRow === -1) {
        throw new Error("Nomor pesanan " + targetNo + " tidak ditemukan");
      }

      const nama = body.nama || "-";
      const ukuran = body.ukuran || "L";
      const tipe = body.tipe || "Pendek";
      const harga = Number(body.harga) || 0;
      const dp = Number(body.dp) || 0;
      const sisa = Math.max(0, harga - dp);
      const statusLunas = body.statusLunas || (dp >= harga ? "Lunas" : "Belum Lunas");
      const catatan = body.catatan || "-";

      sheetPenjualan.getRange(foundRow, 3, 1, 8).setValues([[
        nama,
        ukuran,
        tipe,
        harga,
        dp,
        sisa,
        statusLunas,
        catatan
      ]]);

      return createJsonResponse({
        status: "success",
        message: "Pesanan No. " + targetNo + " berhasil diperbarui!"
      });
    }

    // ==========================================
    // 5. HAPUS DATA PENJUALAN
    // ==========================================
    if (action === "hapus_penjualan") {
      const sheetPenjualan = getOrCreateSheet(SHEET_PENJUALAN, HEADERS_PENJUALAN);
      const rows = sheetPenjualan.getDataRange().getValues();
      const targetNo = Number(body.nomor);
      const targetNama = String(body.nama || "").trim().toLowerCase();
      const targetSesi = String(body.sesi || "");
      let foundRow = -1;

      // Prioritas 1: Cocokkan nomor, nama, dan sesi
      for (let i = 1; i < rows.length; i++) {
        const rowNo = Number(rows[i][0]);
        const rowNama = String(rows[i][2] || "").trim().toLowerCase();
        const rowSesi = String(rows[i][10] || "Penjualan 1");

        const matchNo = (rowNo === targetNo);
        const matchNama = (!targetNama || rowNama === targetNama);
        const matchSesi = (!targetSesi || rowSesi === targetSesi);

        if (matchNo && matchNama && matchSesi) {
          foundRow = i + 1;
          break;
        }
      }

      // Prioritas 2: Cocokkan nama dan sesi jika nomor sudah bergeser
      if (foundRow === -1 && targetNama && targetNama !== "-") {
        for (let i = 1; i < rows.length; i++) {
          const rowNama = String(rows[i][2] || "").trim().toLowerCase();
          const rowSesi = String(rows[i][10] || "Penjualan 1");
          if (rowNama === targetNama && (!targetSesi || rowSesi === targetSesi)) {
            foundRow = i + 1;
            break;
          }
        }
      }

      // Prioritas 3: Hanya nomor dan sesi
      if (foundRow === -1) {
        for (let i = 1; i < rows.length; i++) {
          const rowNo = Number(rows[i][0]);
          const rowSesi = String(rows[i][10] || "Penjualan 1");
          if (rowNo === targetNo && (!targetSesi || rowSesi === targetSesi)) {
            foundRow = i + 1;
            break;
          }
        }
      }

      if (foundRow === -1) {
        throw new Error("Pesanan No. " + targetNo + " tidak ditemukan di Google Sheets");
      }

      sheetPenjualan.deleteRow(foundRow);

      // Bersihkan baris-baris dummy kosong (nama '-' dan harga 0) dari bawah ke atas
      const afterDeleteRows = sheetPenjualan.getDataRange().getValues();
      for (let i = afterDeleteRows.length - 1; i >= 1; i--) {
        const n = String(afterDeleteRows[i][2] || "").trim();
        const h = Number(afterDeleteRows[i][5] || 0);
        if ((n === "-" || n === "") && h === 0) {
          sheetPenjualan.deleteRow(i + 1);
        }
      }

      // Re-numbering kolom A khusus sesi ini agar selalu urut 1, 2, 3...
      const cleanRows = sheetPenjualan.getDataRange().getValues();
      let orderNum = 1;
      for (let i = 1; i < cleanRows.length; i++) {
        const rowSesi = String(cleanRows[i][10] || "Penjualan 1");
        if (!targetSesi || rowSesi === targetSesi) {
          sheetPenjualan.getRange(i + 1, 1).setValue(orderNum);
          orderNum++;
        }
      }

      return createJsonResponse({
        status: "success",
        message: "Pesanan No. " + targetNo + " berhasil dihapus dan nomor diurutkan ulang!"
      });
    }

    // ==========================================
    // 6. BERSIHKAN DATA DUMMY KOSONG
    // ==========================================
    if (action === "bersihkan_data_dummy") {
      const sheetPenjualan = getOrCreateSheet(SHEET_PENJUALAN, HEADERS_PENJUALAN);
      const rows = sheetPenjualan.getDataRange().getValues();
      let countDeleted = 0;
      for (let i = rows.length - 1; i >= 1; i--) {
        const n = String(rows[i][2] || "").trim();
        const h = Number(rows[i][5] || 0);
        if ((n === "-" || n === "") && h === 0) {
          sheetPenjualan.deleteRow(i + 1);
          countDeleted++;
        }
      }
      return createJsonResponse({
        status: "success",
        message: countDeleted + " baris dummy kosong berhasil dibersihkan!"
      });
    }

    // ==========================================
    // 7. TAMBAH PENJUALAN BARU (DENGAN SESI / BATCH)
    // ==========================================
    if (action === "penjualan") {
      const sheetPenjualan = getOrCreateSheet(SHEET_PENJUALAN, HEADERS_PENJUALAN);
      const sesi = body.sesi || "Penjualan 1";
      
      // Hitung nomor urut langsung di dalam Lock dari baris nyata di Google Sheets
      // Menjamin jika 3 orang klik Simpan bersamaan, nomor urut selalu berderet rapi tanpa tabrakan!
      const rows = sheetPenjualan.getDataRange().getValues();
      let countSesi = 0;
      for (let i = 1; i < rows.length; i++) {
        const rowSesi = String(rows[i][10] || "Penjualan 1");
        const namaRow = String(rows[i][2] || "").trim();
        const hargaRow = Number(rows[i][5] || 0);
        if (rowSesi === sesi && namaRow !== "-" && namaRow !== "" && hargaRow > 0) {
          countSesi++;
        }
      }
      const nomor = countSesi + 1;

      const nama = body.nama || "-";
      const ukuran = body.ukuran || "L";
      const tipe = body.tipe || "Pendek";
      const harga = Number(body.harga) || 0;
      const dp = Number(body.dp) || 0;
      const sisa = Math.max(0, harga - dp);
      const statusLunas = body.statusLunas || (dp >= harga ? "Lunas" : "Belum Lunas");
      const catatan = body.catatan || "-";

      sheetPenjualan.appendRow([
        nomor,
        waktu,
        nama,
        ukuran,
        tipe,
        harga,
        dp,
        sisa,
        statusLunas,
        catatan,
        sesi
      ]);

      return createJsonResponse({
        status: "success",
        message: "Data Penjualan berhasil disimpan!",
        data: {
          nomor: nomor,
          nama: nama,
          ukuran: ukuran,
          tipe: tipe,
          harga: harga,
          dp: dp,
          statusLunas: statusLunas,
          sesi: sesi
        }
      });
    }

    throw new Error("Action tidak valid atau tidak dikenali: " + action);

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
