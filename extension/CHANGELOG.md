# 1.13.1 — 2026-11-03

- Correct the Chrome Web Store package title encoding and describe the current Bing/Google feature set.
- Read manifest metadata as UTF-8 when building store packages.

# 1.13.0 — 2026-11-03

- Rename the app to Alibasa across the popup, overlay, extension listing and translation labels.
- Preserve the extension identity, themes and saved preferences.

# 1.12.1 — 2026-11-03

- Make bilingual display and automatic translation mutually exclusive.
- Disable the other option while either mode is checked, with a short explanation.
- Normalize older settings with both modes enabled to bilingual display only.

# 1.12.0 — 2026-11-03

- Add a main-menu Hide overlay / Show overlay toggle reflecting the active page.
- Keep the overlay controller alive while hidden, so it can be restored without refreshing.
- Synchronize visibility when hiding from the overlay menu; no status polling.

# 1.11.2 — 2026-11-03

- Keep compact controls, navigation, tables, flex/grid text containers and constrained elements in their original layout; expose bilingual translations in tooltips.
- Isolate paragraph translation formatting in Shadow DOM without copying site CSS classes.
- Restore original tooltips and text on Restore; preserve original nodes and handlers.

# 1.11.1 — 2026-11-03

- Highlight translated output in bilingual mode using Classic Navy light/dark colors.
- Keep original text unchanged; remove the highlight when restoring the page.

# 1.11.0 — 2026-11-03

- Rename the app to Alih across the extension listing, popup, overlay, context menu and translation labels.
- Keep the existing extension identity and saved preferences for updates.

# 1.10.1 — 2026-11-03

- Apply Classic Navy to light/dark themes, overlay and existing icon artwork.
- Keep the current app name pending the user’s choice.

# 1.10.0 — 2026-11-03

- Add saved System, Light and Dark themes to the main popup and overlay.
- Default to System, following operating-system appearance changes without polling.

# 1.9.0 — 2026-11-03

- Refine the existing 450px popup with aligned fields, consistent spacing, restrained action icons and clear focus states.
- Rewrite Indonesian and English interface copy in plain language.
- Keep the established control order and simplify the 240px overlay appearance.

# 1.8.5 — 2026-11-03

- Set the overlay menu width to 240px.

# 1.8.4 — 2026-11-03

- Add lightweight inline icons for Stop, Restore, Settings and Hide overlay.
- Move the language pair to the bottom-left of the overlay menu.

# 1.8.3 — 2026-11-03

- Set the main menu width to 450px and match the fallback popup window.

# 1.8.2 — 2026-11-03

- Reorder the main popup: app language, engine, language pair, page translation, selection translation and hint, Stop/Restore, bilingual display, dynamic translation, Bing fallback.
- Remove the status area and shortcut hint; stop background status polling while the popup is open.
- Show action errors only when needed.

# 1.8.1 — 2026-11-03

- Enlarge the main popup to 560px with larger text and language selectors.
- Remove viewport-based width limiting that could shrink the native extension popup.
- Enlarge the popup-window fallback to match.

# 1.8.0 — 2026-11-03

- Consolidate app language, fallback, dynamic content, connection test and cache clearing into the main popup without duplicating existing controls.
- Save preferences automatically and remove the separate Settings page.
- Open the main extension popup from overlay Settings, with a compact popup-window fallback for older Chrome versions.
- Remove the overlay status display.

# 1.7.2 — 2026-11-02

- Narrow the overlay menu to 280px.
- Match Hide overlay text color and weight to the other menu actions.

# 1.7.1 — 2026-11-02

- Put source → target languages beside LinguaLite in the overlay menu header; remove the engine label.
- Remove Translate page and Translate selection menu entries; the main icon still translates the page.
- Keep Hide overlay in the menu, hiding it until the page is refreshed.

# 1.7.0 — 2026-11-02

- Keep only Bing / Microsoft and Google translation.
- Remove AI engines, API credentials, OAuth code and their host permissions.
- Remove Privacy and availability explanations from Settings.
- Migrate removed engines to Bing and delete saved provider credentials and ChatGPT session data on update.

# 1.6.4 — 2026-11-02

- Use an icon-only overlay action with localized tooltips and accessible labels for Translate, Stop and Restore.
- Dim the idle toolbar to 35% opacity; show 100% on hover, keyboard focus or while its menu is open.

# 1.6.3 — 2026-10-28

- Show provider and saved model on one overlay line, with localized source → target languages beneath.
- Use two smaller initial ChatGPT batches for earlier visible results, then normal batches for throughput.
- Reuse successful ChatGPT block translations in the existing bounded memory cache, scoped by account, model and languages.
- Restore/retranslate when the selected model changes; cancel subscription batches on disconnect.
- First-time live ChatGPT latency remains dependent on the selected model and service response.

# 1.6.2 — 2026-10-28

- Save active engine selection immediately from Settings and popup, before waiting for the ChatGPT model catalog.
- Update the overlay engine name and language pair live, including menus already open on other tabs.
- Use localized provider names and reject stale overlay updates; preserve existing provider credentials when switching engines.

# 1.6.1 — 2026-10-28

- Remove the redundant optional 127.0.0.1 host permission; retain the required OAuth callback permission.
- OAuth behavior is unchanged; real account authorization/inference validation remains pending.

# 1.6.0 — 2026-10-28

- Replace website-tab mode with public-client ChatGPT plan OAuth.
- Receive a nonce/tab/port-scoped loopback redirect inside Chrome via a temporary DNR session rule; no native host or server.
- Implement PKCE, issued client registration, JWT/JWKS identity checks, explicit plan scope verification and callback expiry/replay protections.
- Keep OAuth credentials in trusted session storage; single-flight refresh, account model catalog and direct Responses SSE inference.
- Restore model dropdown and account-scoped translation cache; use two bounded ChatGPT engine workers.
- No cookies permission, borrowed app client IDs, website composer automation or API-key fallback.
- Synthetic protocol/security and Chromium callback tests passed; real account approval/inference remains unverified.

# 1.5.0 — 2026-10-28

- Replace native/OAuth dependency with a dedicated ChatGPT website-tab adapter for testing.
- Remove nativeMessaging permission and all native/token/model API calls from the ChatGPT connector.
- Connect by opening the ordinary website; account login and verification remain user actions.
- Use the website-selected model; remove the subscription model API dropdown.
- Serialize website jobs, bind output to a nonce and conversation, preserve drafts and cancel only owned generation.
- Keep ChatGPT source text out of website result caches; display that subscription tier is not verified.
- Add 224 localized website-connection messages and an explicit connection check.
- Synthetic integration tests pass; live ChatGPT account verification is pending because automated access received HTTP 403.

# 1.4.1 — 2026-10-28

- Fix omitted mixed text around blockquotes; verified against the reported Steam thread.
- Include direct text in body, open shadow roots and same-origin frame bodies.
- Translate button/label/option text while preserving event handlers and option values.
- Split long text-node requests, retain node identity and exact restore.
- Retry malformed numbered HTML as individual text nodes; prevent overlapping records after mutations.
- Bind login controls before model requests complete; bound status/model waits and keep login progress in Settings.
- Detect unavailable native helpers and explain that standalone ChatGPT OAuth is not configured, rather than implying a successful connection.
- Chrome-only Web Store upload ZIP. No Windows installer or native binary is included. Publication remains pending.

# 1.4.0 — 2026-10-28

- Engine-filtered source/target language dropdowns; source-only auto detection.
- Settings moves to the upper-right popup header.
- English default UI, 224 offline interface dictionaries, localized overlay and context menus.
- Reordered engines; dedicated local AI; legacy custom profiles migrated.
- Official OAuth ChatGPT Subscription connector with Windows native helper, account model catalog, encrypted credentials, refresh and completed Responses streams. Manual transfer removed.
- Stable extension ID for native messaging and updated Windows installer.
- Real account subscription login remains unverified; synthetic UI/auth/stream tests are documented.

# LinguaLite 1.3.1 — identitas visual

- Menambahkan logo A/文 teal/mint, ikon Chrome 16/32/48/128px, dan favicon.
- Logo konsisten pada toolbar, popup, pengaturan serta overlay SVG inline.
- Logo vektor dan PNG besar tersedia dalam paket aset terpisah.
- Dimensi PNG, path manifest, pemuatan gambar, render overlay, 11 alur overlay serta 23 tes core telah diperiksa.

# LinguaLite 1.3.0 — batch paralel seluruh halaman

- Menghapus penantian scroll dan jeda per blok. Tombol overlay/popup memproses seluruh blok halaman yang ditemukan.
- Batch native Bing sampai 24 blok; envelope bernomor untuk Google dan AI.
- Empat worker batch per halaman, batas global empat request, antrean maksimum 12.
- Cache per blok dan deduplikasi teks identik dalam batch; hasil dipasang ketika tersedia.
- Tetap memvalidasi marker, revisi dan identitas node; Stop membatalkan seluruh batch tab.
- Blok tersembunyi tidak dikirim sebagai batch halaman.
- 23 tes inti, 13 pemeriksaan mesin browser dan 11 pemeriksaan overlay lulus.
- Uji live 40 blok: 2 request, sekitar 1.00 detik Google / 1.35 detik Bing pada lingkungan pengujian. Bukan jaminan instan untuk semua halaman/provider.

Update: timpa folder lama, Reload ekstensi, lalu refresh tab. Pengaturan dan API key lama pada profil yang sama tetap tersimpan.

# LinguaLite 1.2.0 — overlay

- Tombol otomatis di kanan bawah halaman HTTP/HTTPS; satu klik menerjemahkan tanpa popup.
- Menu teks pilihan, Stop, pulihkan asli, pengaturan dan sembunyikan hingga refresh.
- Modul mesin diimpor saat klik pertama; overlay idle tidak memindai atau mengirim teks dan tidak polling.
- Status terintegrasi, akses keyboard/Escape, tampilan sempit, serta pesan error provider.
- Menambahkan deklarasi content_scripts overlay dan web_accessible_resources mesin. Host permissions API tidak diperluas menjadi wildcard.
- 11 pemeriksaan overlay, 17 pemeriksaan mesin browser dan 17 tes core lulus. Tes browser memakai Edge headless/Chromium dan respons sintetis.

Update: timpa folder lama, Reload LinguaLite di chrome://extensions, lalu refresh tab. Periksa akses situs Chrome jika overlay belum muncul.

# LinguaLite 1.1.0 — perubahan mesin halaman

Dari 1.0.0 ke 1.1.0:

- Mengganti parser plain text halaman dengan fragmen HTML bernomor.
- Menambahkan scheduler viewport dengan snapshot hanya saat blok diproses.
- Mempertahankan elemen inline asli pada mode ganti teks; mempertahankan format pada hasil dwibahasa.
- Memvalidasi marker tanpa innerHTML, atribut dari provider atau eksekusi HTML server.
- Mengamati characterData dan childList; menginvalidasi blok, bukan seluruh halaman.
- Menangani open ShadowRoot dan iframe same-origin dalam batas yang ditentukan.
- Menjaga generasi, revisi, konten serta identitas node untuk menolak respons usang.
- Menambah guard pemulihan agar node terbaru yang diganti situs tidak ditimpa.
- Menambahkan format HTML di adaptor Bing, POST rich pada Google, instruksi marker pada AI, serta pemisahan cache rich/plain.
- Mendukung marker dalam ekspor–impor manual ChatGPT.
- Menambah batas memori konten dan pemangkasan referensi dokumen/frame yang terlepas.

Pengujian: 17 tes core, 17 pemeriksaan browser, tes live HTML Bing dan Google. Lihat README dan JSON hasil tes. Provider berbayar hanya diuji formatnya dengan mock; RAM keseluruhan belum dibenchmark.

Pembaruan: timpa folder lama, Reload ekstensi dan reload tab sumber. Pengaturan lama dipertahankan. Matikan “Teks asli + terjemahan” untuk mode ganti teks.
