# Alibasa

Chrome extension for translating web pages and selected text with Bing/Microsoft or Google.  
Extension Chrome untuk menerjemahkan halaman web dan teks pilihan menggunakan Bing/Microsoft atau Google.

**Version / Versi: 1.13.1**

[English](#english) · [Bahasa Indonesia](#bahasa-indonesia)

## English

### Features

- Translate a whole page or a selected word, sentence, or paragraph.
- Read the original text alongside highlighted translations. Compact controls and constrained areas use hover tooltips to preserve their layout.
- Automatically translate new and changed text after starting page translation.
- Choose bilingual display or automatic translation; these modes cannot be enabled together.
- Use Google as a fallback when Bing fails.
- Show or hide the on-page translation toolbar.
- Choose System, Light, or Dark appearance with a Classic Navy palette.

### Install in Chrome

1. [Download Alibasa 1.13.1 for Chrome](downloads/Alibasa-1.13.1-chrome.zip?raw=true).
2. Extract the ZIP into a folder you intend to keep.
3. Open `chrome://extensions` in Chrome.
4. Turn on **Developer mode**.
5. Click **Load unpacked**.
6. Select the extracted folder containing `manifest.json`.
7. Refresh your web page, then open Alibasa from Chrome's Extensions menu or use its on-page toolbar.

Chrome loads the extracted folder, so keep it in place while using the extension. The ZIP is installed through Developer mode; it is not a one-click Chrome Web Store installation.

**Installing from source instead?** Select **Code → Download ZIP** on this repository, extract it, and choose its **extension** subfolder at step 6. No dependency installation or build step is required to run the source.

### Update an existing installation

Replace the files in your existing extension folder with the new version. Open `chrome://extensions`, click **Reload** on Alibasa, and refresh your web pages.

### Data and permissions

Text requested for translation is sent directly over HTTPS to Bing/Microsoft or Google. Preferences are stored locally, and the temporary translation cache stays in extension memory. Content scripts run on HTTP/HTTPS pages to display the toolbar automatically; translation starts when you request it.

This version does not require an account or API key and does not include ChatGPT integration.

[Privacy policy](PRIVACY.md) · Support: [dstdra@gmail.com](mailto:dstdra@gmail.com)

## Bahasa Indonesia

### Fitur

- Terjemahkan seluruh halaman atau kata, kalimat, dan paragraf yang dipilih.
- Baca teks asli beserta terjemahan yang diberi highlight. Kontrol dan area sempit memakai tooltip saat kursor diarahkan agar tata letaknya tetap terjaga.
- Terjemahkan teks baru dan perubahan secara otomatis setelah memulai terjemahan halaman.
- Pilih mode bilingual atau terjemahan otomatis; kedua mode tidak bisa diaktifkan bersamaan.
- Gunakan Google sebagai cadangan jika Bing gagal.
- Tampilkan atau sembunyikan toolbar terjemahan di halaman.
- Pilih tema System, Light, atau Dark dengan palet Classic Navy.

### Cara memasang di Chrome

1. [Unduh Alibasa 1.13.1 untuk Chrome](downloads/Alibasa-1.13.1-chrome.zip?raw=true).
2. Ekstrak ZIP ke folder yang akan tetap disimpan.
3. Buka `chrome://extensions` di Chrome.
4. Aktifkan **Mode developer / Developer mode**.
5. Klik **Muat yang belum dipaketkan / Load unpacked**.
6. Pilih folder hasil ekstrak yang berisi `manifest.json`.
7. Refresh halaman web, lalu buka Alibasa melalui menu Ekstensi Chrome atau gunakan toolbar di halaman.

Chrome memuat extension dari folder hasil ekstrak. Simpan folder tersebut selama extension digunakan. Pemasangan ZIP ini memakai Mode developer, belum melalui tombol Add to Chrome di Chrome Web Store.

**Mau memasang dari source?** Pilih **Code → Download ZIP** pada repository ini, ekstrak, lalu pilih subfolder **extension** pada langkah 6. Source bisa langsung dijalankan tanpa menginstal dependensi atau melakukan build.

### Memperbarui pemasangan yang sudah ada

Ganti berkas pada folder extension lama dengan versi terbaru. Buka `chrome://extensions`, klik **Muat ulang / Reload** pada Alibasa, lalu refresh halaman web.

### Data dan izin

Teks yang diminta untuk diterjemahkan dikirim langsung melalui HTTPS ke Bing/Microsoft atau Google. Pengaturan disimpan lokal, dan cache terjemahan sementara berada di RAM extension. Content script berjalan pada halaman HTTP/HTTPS untuk menampilkan toolbar otomatis; terjemahan dimulai saat diminta.

Versi ini tidak memerlukan akun atau API key dan tidak menyertakan integrasi ChatGPT.

[Kebijakan privasi](PRIVACY.md) · Dukungan: [dstdra@gmail.com](mailto:dstdra@gmail.com)

## Build packages / Membuat paket

Run with Python 3 from the repository folder.  
Jalankan dengan Python 3 dari folder repository.

```sh
python scripts/package.py
```

The Chrome and Chrome Web Store ZIP files are written to **dist**. The Web Store package omits the development identity key from the manifest.  
ZIP Chrome dan Chrome Web Store dibuat di folder **dist**. Paket Web Store tidak menyertakan key identitas pengembangan pada manifest.

## License / Lisensi

[MIT](LICENSE). Original copyright notices are retained.  
Pemberitahuan hak cipta dari source dipertahankan.
