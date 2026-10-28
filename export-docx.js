/**
 * DOCX exporter for Uji Solusi — Solution Problems.
 * Copyright © 2026 ramalabs. All rights reserved.
 * Produces a genuine Office Open XML .docx without third-party libraries or server access.
 */
(function () {
  'use strict';

  const encoder = new TextEncoder();
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const PACKAGE_REL = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const OFFICE_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

  function xml(value) {
    return String(value ?? '')
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
  function textRun(value, bold) {
    return `<w:r>${bold ? '<w:rPr><w:b/></w:rPr>' : ''}<w:t xml:space="preserve">${xml(value)}</w:t></w:r>`;
  }
  function paragraph(value, style = 'Normal') {
    return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr>${textRun(value)}</w:p>`;
  }
  const blank = () => '<w:p/>';

  function buildDocument(report) {
    const rows = [];
    const links = [];
    const add = (value, style) => rows.push(paragraph(value, style));
    const addList = (items) => items.forEach((value, i) => add(`${i + 1}. ${value}`, 'ListText'));
    const linkParagraph = (prefix, label, url) => {
      if (!/^https?:\/\//i.test(String(url || ''))) {
        add(prefix + label);
        return;
      }
      const id = `rId${links.length + 3}`;
      links.push({ id, url: String(url) });
      rows.push(`<w:p><w:pPr><w:pStyle w:val="Source"/></w:pPr>${textRun(prefix + label + ' — ')}<w:hyperlink r:id="${id}"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>${xml(url)}</w:t></w:r></w:hyperlink></w:p>`);
    };
    const { settings, sources, indicator, coverage, assumptions, hypotheses, fallacies,
      recommendations, synthesis, errors, evidenceHighlights } = report;
    const labels = {
      education: 'Pendidikan', economy: 'Ekonomi & bisnis', health: 'Kesehatan masyarakat',
      environment: 'Lingkungan', technology: 'Teknologi & AI', public: 'Kebijakan publik',
    };
    let created;
    try { created = new Date(report.created).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }); }
    catch { created = String(report.created); }

    add('UJI SOLUSI', 'Title');
    add('Solution Problems / Laporan Analisis Empiris · ramalabs', 'Subtitle');
    add(settings.problem, 'Heading1');
    add(`Tanggal: ${created}`, 'Meta');
    add(`Bidang: ${labels[settings.domain] || settings.domain} | Wilayah: ${settings.region === 'indonesia' ? 'Indonesia' : 'Global'} | Dukungan bukti: ${coverage.label}`, 'Meta');
    rows.push(blank());
    add('Ringkasan analisis awal', 'Heading2');
    add(synthesis);

    add('01 · Asumsi dasar', 'Heading2');
    add('Narasi disusun berdasarkan rumusan masalah, kecocokan sumber yang tersedia, dan data deskriptif bila ditemukan. Asumsi bukan fakta yang terverifikasi.', 'Note');
    assumptions.forEach((entry) => { add(entry.title, 'Heading3'); add(entry.text); });

    add('02 · Bukti awal dan referensi', 'Heading2');
    add(`Catatan ilmiah relevan secara tekstual: ${coverage.academic}. Abstrak tersedia: ${coverage.abstracts}. Sumber kontekstual: ${coverage.contextual}.`, 'Meta');
    add('Metadata, abstrak, dan indikator harus diperiksa pada sumber aslinya; daftar referensi tidak membuktikan sebab-akibat.', 'Note');
    if (errors.length) add(`Layanan yang gagal diakses: ${errors.join('; ')}. Tidak ada data buatan yang menggantikannya.`, 'Note');
    if (evidenceHighlights.length) {
      add('Cuplikan teks abstrak (belum diverifikasi terhadap teks lengkap)', 'Heading3');
      evidenceHighlights.forEach((entry) => add(`[${entry.ref}] “${entry.statement}”`, 'Source'));
    }
    if (indicator?.series?.length) {
      const last = indicator.series[indicator.series.length - 1];
      add('Indikator statistik World Bank', 'Heading3');
      add(`${indicator.name} (${indicator.country}): ${last.value} ${indicator.unit}, tahun ${last.year}.`, 'Source');
      add(indicator.note, 'Note');
      linkParagraph('Sumber statistik: ', indicator.name, indicator.url);
    }
    add('Daftar sumber yang dapat ditelusuri', 'Heading3');
    if (!sources.length) add('Belum ditemukan catatan sumber relevan yang tersedia. Jangan menarik kesimpulan empiris.', 'Note');
    sources.forEach((source) => {
      linkParagraph(`[${source.ref}] ${source.provider} (${source.year || 'tahun tidak tersedia'}): `, source.title, source.url);
      if (source.detail) add(`Metadata: ${source.detail}`, 'Note');
      if (source.excerpt) add(`Cuplikan dari penyedia: ${source.excerpt}`, 'Note');
    });

    add('03 · Antitesis dan cara menguji', 'Heading2');
    hypotheses.forEach((entry) => {
      add(entry.tag, 'Heading3');
      add(entry.title);
      add(`Cara menguji: ${entry.test}`, 'Note');
    });

    add('04 · Audit logical fallacy', 'Heading2');
    add('Indikasi diperoleh dari pola bahasa; bukan pembuktian adanya kekeliruan logika.', 'Note');
    fallacies.forEach((entry) => {
      add(`${entry.name} — ${entry.triggered ? 'Perlu diperiksa' : 'Tidak terindikasi secara eksplisit'}`, 'Heading3');
      add(`${entry.risk} Uji: ${entry.check}`);
    });

    add('05 · Rekomendasi', 'Heading2');
    addList(recommendations);
    add('Kesimpulan dan keterbatasan', 'Heading2');
    add(`${synthesis} Analisis ini bersifat eksploratif, bukan telaah sistematis, verifikasi penuh artikel, atau pembuktian kausal. Telaah sumber primer secara langsung sebelum digunakan untuk keputusan penting.`);
    rows.push(blank());
    add('Copyright © 2026 ramalabs. All rights reserved.', 'Copyright');

    const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>${rows.join('')}` +
      '<w:sectPr><w:footerReference w:type="default" r:id="rId2"/>' +
      '<w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1191" w:right="1191" w:bottom="1191" w:left="1191" w:header="600" w:footer="650" w:gutter="0"/></w:sectPr>' +
      '</w:body></w:document>';
    const relationships = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="${PACKAGE_REL}">` +
      `<Relationship Id="rId1" Type="${OFFICE_REL}/styles" Target="styles.xml"/>` +
      `<Relationship Id="rId2" Type="${OFFICE_REL}/footer" Target="footer1.xml"/>` +
      links.map((link) => `<Relationship Id="${link.id}" Type="${OFFICE_REL}/hyperlink" Target="${xml(link.url)}" TargetMode="External"/>`).join('') +
      '</Relationships>';

    return {
      '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>`,
      '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${PACKAGE_REL}"><Relationship Id="rId1" Type="${OFFICE_REL}/officeDocument" Target="word/document.xml"/></Relationships>`,
      'word/document.xml': document,
      'word/_rels/document.xml.rels': relationships,
      'word/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="${W}">
        <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="21"/><w:color w:val="25383B"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="150" w:line="310" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
        <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
        <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:spacing w:after="80"/></w:pPr><w:rPr><w:b/><w:color w:val="176D60"/><w:sz w:val="42"/></w:rPr></w:style>
        <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:pPr><w:spacing w:after="260"/></w:pPr><w:rPr><w:color w:val="71848B"/><w:sz w:val="19"/></w:rPr></w:style>
        <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:keepNext/><w:spacing w:before="190" w:after="165"/></w:pPr><w:rPr><w:b/><w:color w:val="183F42"/><w:sz w:val="31"/></w:rPr></w:style>
        <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:keepNext/><w:spacing w:before="290" w:after="140"/></w:pPr><w:rPr><w:b/><w:color w:val="176D60"/><w:sz w:val="25"/></w:rPr></w:style>
        <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:pPr><w:keepNext/><w:spacing w:before="180" w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="21"/></w:rPr></w:style>
        <w:style w:type="paragraph" w:styleId="Meta"><w:name w:val="Meta"/><w:pPr><w:spacing w:after="65"/></w:pPr><w:rPr><w:color w:val="647A7C"/><w:sz w:val="18"/></w:rPr></w:style>
        <w:style w:type="paragraph" w:styleId="Note"><w:name w:val="Note"/><w:pPr><w:spacing w:after="100"/></w:pPr><w:rPr><w:color w:val="71848B"/><w:sz w:val="19"/></w:rPr></w:style>
        <w:style w:type="paragraph" w:styleId="Source"><w:name w:val="Source"/><w:pPr><w:spacing w:after="140"/></w:pPr><w:rPr><w:sz w:val="19"/></w:rPr></w:style>
        <w:style w:type="paragraph" w:styleId="ListText"><w:name w:val="ListText"/><w:pPr><w:ind w:left="350" w:hanging="240"/><w:spacing w:after="115"/></w:pPr></w:style>
        <w:style w:type="paragraph" w:styleId="Copyright"><w:name w:val="Copyright"/><w:rPr><w:color w:val="71848B"/><w:sz w:val="17"/></w:rPr></w:style>
        <w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:rPr><w:color w:val="176D60"/><w:u w:val="single"/></w:rPr></w:style></w:styles>`,
      'word/footer1.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="${W}"><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="71848B"/><w:sz w:val="16"/></w:rPr><w:t>Copyright © 2026 ramalabs · Uji Solusi</w:t></w:r></w:p></w:ftr>`,
    };
  }

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let value = i;
      for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xEDB88320 : 0);
      table[i] = value >>> 0;
    }
    return table;
  })();
  function crc32(bytes) {
    let value = 0xFFFFFFFF;
    for (const byte of bytes) value = crcTable[(value ^ byte) & 0xFF] ^ (value >>> 8);
    return (value ^ 0xFFFFFFFF) >>> 0;
  }
  function makeZip(files) {
    const chunks = [];
    const central = [];
    let offset = 0;
    let centralLength = 0;
    for (const [path, text] of Object.entries(files)) {
      const pathBytes = encoder.encode(path);
      const data = encoder.encode(text);
      const checksum = crc32(data);
      const local = new Uint8Array(30 + pathBytes.length);
      const lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034B50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true); // UTF-8 filenames
      lv.setUint16(8, 0, true); // Stored (no compression)
      lv.setUint32(14, checksum, true);
      lv.setUint32(18, data.length, true);
      lv.setUint32(22, data.length, true);
      lv.setUint16(26, pathBytes.length, true);
      local.set(pathBytes, 30);
      chunks.push(local, data);

      const cd = new Uint8Array(46 + pathBytes.length);
      const cv = new DataView(cd.buffer);
      cv.setUint32(0, 0x02014B50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint32(16, checksum, true);
      cv.setUint32(20, data.length, true);
      cv.setUint32(24, data.length, true);
      cv.setUint16(28, pathBytes.length, true);
      cv.setUint32(42, offset, true);
      cd.set(pathBytes, 46);
      central.push(cd);
      centralLength += cd.length;
      offset += local.length + data.length;
    }
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054B50, true);
    ev.setUint16(8, central.length, true);
    ev.setUint16(10, central.length, true);
    ev.setUint32(12, centralLength, true);
    ev.setUint32(16, offset, true);
    const zip = new Uint8Array(offset + centralLength + end.length);
    let position = 0;
    for (const chunk of [...chunks, ...central, end]) {
      zip.set(chunk, position);
      position += chunk.length;
    }
    return zip;
  }

  window.buildRamalabsDocx = function (report) {
    if (!report?.settings?.problem) throw new Error('Tidak ada laporan yang bisa diekspor.');
    return makeZip(buildDocument(report));
  };
})();
