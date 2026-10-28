# Uji Solusi — Solution Problems | ramalabs

**Aplikasi analisis masalah dengan asumsi dasar, penelusuran literatur dan data publik, antitesis, audit logical fallacy, serta rekomendasi bertahap.** Ditulis sebagai situs statis berbasis HTML/CSS/JavaScript, tanpa build, server aplikasi, framework, atau API key.

**Copyright © 2026 ramalabs. All rights reserved.**

## Publikasi ke GitHub Pages

1. Buat repository baru di GitHub, misalnya `solution-problems` (pilih **Public**).
2. Unggah **isi folder proyek** ini ke root repository, **bukan berkas ZIP saja**. Pastikan file `index.html`, `app.js`, **`export-docx.js`**, `styles.css`, `favicon.svg`, `.nojekyll`, dan direktori `.github/workflows/deploy.yml` ikut terunggah. Untuk mengunggah direktori tersembunyi `.github` dengan mudah, gunakan Git CLI di bawah.
3. Buka **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Pada tab **Actions**, workflow `Deploy Uji Solusi ramalabs to GitHub Pages` akan berjalan saat ada push ke branch `main` (atau bisa dijalankan manual melalui *Run workflow*).
5. Setelah deployment berhasil, akses `https://USERNAME.github.io/solution-problems/`. Ganti `USERNAME` dengan nama akun atau organisasi GitHub.

Jika ingin cara termudah tanpa workflow, pilih **Settings → Pages → Deploy from a branch → main → /(root) → Save**. File `.nojekyll` memastikan situs disajikan apa adanya. Jangan memilih GitHub Actions dan `Deploy from a branch` secara bersamaan; cukup salah satu.

### Melalui Git (opsi paling lengkap)

```bash
# Jalankan di folder hasil ekstraksi ramalabs-solution-problems
git init
git branch -M main
git add .
git commit -m "Uji Solusi: PDF, Word, dan riset ulang"
git remote add origin https://github.com/USERNAME/solution-problems.git
git push -u origin main
```

## Menjalankan lokal

Dapat dibuka langsung melalui `index.html` pada browser modern. Bila browser membatasi permintaan API dari dokumen `file://`, jalankan server lokal:

```bash
python -m http.server 8000
```

Buka `http://localhost:8000`.


## Fitur laporan: PDF, Word, dan riset ulang

Setelah analisis selesai, toolbar hasil dan bagian bawah laporan menyediakan tombol:

- **Cetak PDF** — membuka dialog cetak browser. Untuk memperoleh file PDF, pilih printer **Save as PDF / Simpan sebagai PDF**, atur ukuran **A4** bila diperlukan, lalu simpan. Tampilan cetak hanya menyertakan laporan, bukti, daftar sumber, dan catatan hak cipta; semua sumber tetap dicetak meskipun filter sumber sedang aktif. Browser memerlukan dukungan fitur cetak.
- **Unduh Word** — mengunduh file `uji-solusi-ramalabs.docx` berformat *Office Open XML* yang valid dan dapat diedit dalam Microsoft Word/LibreOffice. Dokumen memuat semua bagian analisis, tautan referensi aktif, serta `Copyright © 2026 ramalabs` pada badan dokumen dan kaki halaman. Pembuatan DOCX dilakukan langsung di perangkat melalui JavaScript, **tanpa pustaka CDN atau API key**.
- **Riset Ulang** — melakukan pencarian terbaru dengan pertanyaan, wilayah, dan pengaturan yang saat itu ada dalam form. Sumber mungkin berubah karena API eksternal diperbarui.
- **Kembali ke Input** — memindahkan fokus kembali ke kotak pertanyaan tanpa menghapus hasil yang sudah ada; ubah pertanyaan atau pengaturan, kemudian jalankan analisis kembali.
- **Salin / .md / .json** — tetap tersedia seperti versi sebelumnya.

Perlu diperhatikan: tombol PDF tidak mengunduh PDF secara otomatis karena menggunakan antarmuka cetak bawaan browser. Pada perangkat yang tidak mendukung *Save as PDF*, gunakan browser desktop terkini. Isi file ekspor adalah analisis eksploratif dan memiliki keterbatasan bukti sama seperti laporan di layar.

## Sumber data aktual

| Penyedia | API | Peran | Batasan |
|---|---|---|---|
| OpenAlex | `https://api.openalex.org/works` | Metadata/abstrak karya ilmiah | Pencarian otomatis; tidak semua karya berisi abstrak atau peer review. Penggunaan anonim bergantung pada kuota. |
| Crossref | `https://api.crossref.org/works` | Metadata DOI dan abstrak jika tersedia | Registrasi DOI **bukan** bukti kualitas metode. |
| Wikipedia | MediaWiki Action API dengan `origin=*` | Latar belakang/topik | Sumber tersier/sekunder; tidak dianggap bukti kausal. |
| World Bank | `https://api.worldbank.org/v2/` | Deret waktu indikator resmi terpilih | Indikator hanya dimunculkan jika relevan dengan kata kunci; agregat nasional bukan estimasi kausal. |

Semua permintaan dijalankan melalui `fetch()` langsung dari browser. Tidak ada backend atau token rahasia. Permintaan pengguna menjadi bagian dari parameter pencarian API eksternal; sesuai kebijakan privasi masing-masing penyedia, layanan tersebut mungkin mencatat permintaan. **Jangan masukkan data pribadi/rahasia dalam pertanyaan.**

## Cara kerja analisis

1. Konsep utama dipetakan secara heuristik ke istilah pencarian yang lebih mudah ditemukan dalam metadata Indonesia/Inggris.
2. API dikonsultasikan secara langsung, sumber dideduplikasi dengan DOI/judul, dan disaring berdasarkan kecocokan tekstual. Hanya metadata yang benar-benar kembali dari API yang dapat masuk daftar sumber. Jika seluruh API gagal, aplikasi **tidak membuat referensi palsu**.
3. Abstrak yang benar-benar dikembalikan API dapat ditampilkan sebagai cuplikan dengan nomor sumber; cuplikan tersebut bukan klaim penulis aplikasi atau bukti kausal.
4. **Asumsi dasar ditulis dalam lima narasi spesifik** dengan mengenali faktor/paparan, hasil/luaran, dugaan arah hubungan, mekanisme, populasi, dan perancu dari rumusan masalah. Narasi data hanya menampilkan judul serta nomor referensi yang benar-benar diambil dari API; sebuah referensi disebut memiliki kecocokan dengan kedua konsep bila judul/abstrak yang tersedia mengandung istilah terkait. Jika tidak ditemukan, aplikasi menjelaskan kekosongan bukti, bukan membuat klaim. Angka World Bank hanya disebut apabila API mengembalikan observasi nyata, beserta periode dan batasan relevansinya. Pilihan wilayah tidak menyaring lokasi populasi studi OpenAlex atau Crossref, melainkan mengatur fokus interpretasi dan negara pada indikator World Bank. Seluruhnya tetap ditandai *belum diverifikasi*.
5. Tiga hipotesis tandingan disusun untuk menguji penjelasan alternatif, hipotesis nol, dan validitas eksternal.
6. Pola leksikal pada pertanyaan mendeteksi **kemungkinan perlu pemeriksaan** terhadap *post hoc*, *overgeneralization*, dan *appeal to authority*, bukan membuktikan telah terjadi sesat pikir.
7. Rekomendasi memprioritaskan operasionalisasi variabel, pengukuran, pembandingan, pemeriksaan naskah lengkap, serta studi pilot jika memungkinkan.
8. Pengguna dapat mencetak atau menyimpan **PDF** melalui dialog cetak browser (pilih **Save as PDF / Simpan sebagai PDF**), mengunduh dokumen **Word `.docx` asli** beserta tautan referensi, atau menyalin/mengekspor `.md` dan `.json`.
9. Tombol **Kembali ke Input** mempertahankan pertanyaan dan pengaturan untuk diedit. Tombol **Riset Ulang** melakukan penelusuran API ulang dengan input dan pengaturan terkini, bukan memakai cache hasil sebelumnya.

### Keterbatasan penting

- Ini **mesin riset eksploratif berbasis aturan, bukan LLM**; tidak mengklaim mampu menghasilkan sintesis kritis setingkat telaah ilmiah penuh. Penilaian semantik dan relevansi masih heuristik.
- Pemecahan kalimat pertanyaan dan kecocokan konsep masih menggunakan pola leksikal dan kamus terbatas: pertanyaan ambigu, domain khusus, bentuk bahasa tidak umum, atau sinonim yang tidak tercakup dapat menghasilkan narasi tidak tepat. Bila variabel penyebab dan keluaran tidak dapat ditarik secara andal, aplikasi menyatakan bahwa rumusan belum cukup spesifik, bukan mengarang pasangan variabel.
- Cuplikan abstrak dan metadata belum membuktikan kebenaran klaim dalam teks, metodologi, efektivitas intervensi, atau hubungan sebab-akibat.
- Ketersediaan, CORS, kuota, dan isi API dapat berubah. Aplikasi menjelaskan kegagalan per layanan.
- Wikipedia dan catatan Crossref tidak otomatis memenuhi kriteria evidensi kuat. Jumlah karya ilmiah atau sitasi **tidak** boleh disamakan dengan derajat kepastian.
- Indikator World Bank yang dipetakan hanya contoh terpilih; jika tidak relevan, tidak ditampilkan.
- Laporan hasil perlu audit metodologis dan pembacaan dokumen primer sebelum dipakai dalam riset, kebijakan, atau keputusan berisiko tinggi.

## Struktur

```text
ramalabs-solution-problems/
├── index.html
├── styles.css
├── app.js
├── export-docx.js
├── favicon.svg
├── .nojekyll
├── README.md
├── LICENSE
└── .github/
    └── workflows/
        └── deploy.yml
```

## Hak cipta

Copyright © 2026 ramalabs. All rights reserved. Lihat berkas `LICENSE` untuk ketentuan penggunaan kode.

## Pembaruan antarmuka

Judul utama aplikasi adalah **Uji Solusi**. Tombol **Cetak PDF**, **Unduh Word**, **Riset Ulang**, dan **Kembali ke Input** tersedia setelah hasil analisis muncul, termasuk tombol cepat di bagian akhir laporan.

## Pembaruan versi 1.2 — asumsi dasar bernarasi

Asumsi dasar kini **bukan empat butir template generik**. Laporan menampilkan lima paragraf berkonteks: (1) premis pertanyaan dan variabel, (2) mekanisme hipotesis yang relevan dengan topik, (3) cakupan serta faktor perancu, (4) status kecocokan referensi dan angka deskriptif jika tersedia, dan (5) desain pengujian. Tautan [1], [2], dan seterusnya mengarah ke sumber tercatat di laporan; [WB] mengarah ke indikator World Bank.

Contoh: untuk masukan *“Apakah penggunaan kecerdasan buatan meningkatkan hasil belajar mahasiswa di Indonesia?”*, aplikasi mengidentifikasi faktor “penggunaan kecerdasan buatan”, hasil “hasil belajar mahasiswa di Indonesia”, dan kemungkinan jalur melalui umpan balik serta aktivitas belajar. Narasi menjelaskan bahwa jalur ini masih hipotesis; hanya referensi yang memang diperoleh dari API dan relevan menurut pemeriksaan istilah yang dirujuk. **Tidak ada AI generatif maupun pemeriksaan otomatis terhadap kualitas metodologi artikel**.

Fitur PDF, Word, Markdown, JSON, Riset Ulang, dan Kembali ke Input tetap tersedia.
