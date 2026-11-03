# Alibasa

Extension Chrome untuk menerjemahkan halaman web dan teks pilihan menggunakan Bing/Microsoft atau Google. Versi saat ini: **1.13.1**.

## Fitur

- Terjemahkan halaman atau kata, kalimat, dan paragraf yang dipilih.
- Tampilkan teks asli beserta terjemahan dengan highlight. Kontrol atau area sempit memakai tooltip untuk menjaga tata letak.
- Terjemahkan konten baru dan perubahan teks setelah terjemahan halaman diaktifkan.
- Mode bilingual dan terjemahan otomatis saling eksklusif.
- Gunakan Google sebagai cadangan jika Bing gagal.
- Overlay halaman yang dapat disembunyikan dan ditampilkan kembali.
- Tema System, Light, dan Dark dengan palet Classic Navy.

## Pasang dari source

1. Unduh repository melalui **Code → Download ZIP**, lalu ekstrak.
2. Buka chrome://extensions dan aktifkan **Developer mode**.
3. Pilih **Load unpacked**, lalu pilih folder **extension** di dalam hasil ekstrak.
4. Refresh halaman web, lalu buka popup Alibasa atau gunakan toolbar overlay.

Tidak ada dependensi yang harus diinstal atau proses build untuk menjalankan source.

## Membuat paket

Gunakan Python 3 dari folder repository:

```sh
python scripts/package.py
```

ZIP pemasangan lokal dan ZIP Chrome Web Store dibuat di folder **dist**. Paket Web Store tidak menyertakan key manifest untuk identitas pengembangan.

## Data dan izin

Teks yang diterjemahkan dikirim langsung melalui HTTPS ke Bing/Microsoft atau Google. Pengaturan disimpan lokal; cache terjemahan sementara berada di RAM. Source ini mempertahankan overlay otomatis di semua halaman HTTP/HTTPS, sehingga memerlukan akses content script pada situs tersebut. Tidak ada akun, API key, atau integrasi ChatGPT pada versi ini.

Baca [kebijakan privasi](PRIVACY.md). Dukungan: [dstdra@gmail.com](mailto:dstdra@gmail.com).

## Lisensi

[MIT](LICENSE). Pemberitahuan hak cipta dari source dipertahankan.
