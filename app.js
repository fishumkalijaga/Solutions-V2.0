/**
 * Solution Problems — ramalabs
 * Copyright © 2026 ramalabs. All rights reserved.
 * Browser-only, source-grounded exploratory research; no fabricated citations.
 */
'use strict';

const $ = (selector) => document.querySelector(selector);
const ui = {
  form: $('#research-form'), problem: $('#problem'), domain: $('#domain'), region: $('#region'),
  period: $('#period'), language: $('#language'), counter: $('#char-counter'),
  canvas: $('#canvas'), button: $('#analyze-btn'), buttonLabel: $('#analyze-label'),
  cancel: $('#cancel-btn'), actions: $('#result-actions'), resultLabel: $('#result-label'),
  pulse: $('#result-pulse'), toast: $('#toast'), network: $('#network-status'),
  resultColumn: $('#result-column'),
};
let activeController = null;
let lastReport = null;
let toastTimer = null;
const API_TIMEOUT = 14500;

const STOPWORDS = new Set(('apakah bagaimana mengapa kenapa apa siapa kapan dimana di pada dalam dari untuk dengan yang dan atau serta sebuah suatu terhadap sebagai bahwa maka dapat bisa mungkin akan oleh menjadi telah sudah sedang lebih kurang tentang antara melalui secara bagaimana pengaruh dampak hubungan keterkaitan peran faktor upaya strategi kebijakan masalah solusi efektif efektivitas benar benar-benar ditingkatkan benar-benar hasil ada tidak ini itu tersebut para bagi agar ke karena saat setelah sebelum guna baik jika juga mereka kami kita saya anda sebuah banyak sedikit adalah merupakan the a an and or to of for from in on with by does do can could should what why how whether is are was were be been being as has have had that this these those it its their effects effect impact relationship between using use an impact study research does into via improve compared versus') .split(/\s+/));
const GLOSSARY = [
  [/kecerdasan buatan|artificial intelligence|\bai\b/i,'artificial intelligence'],
  [/pembelajaran|belajar|learning/i,'learning'],
  [/mahasiswa|college students?|university students?/i,'university students'],
  [/siswa|murid|school students?/i,'students'],
  [/hasil belajar|prestasi akademik|learning outcomes?/i,'learning outcomes'],
  [/pendidikan|sekolah|education/i,'education'],
  [/guru|dosen|pengajar|teachers?/i,'teachers'],
  [/pengangguran|unemployment/i,'unemployment'],
  [/kemiskinan|poverty/i,'poverty'],
  [/pertumbuhan ekonomi|economic growth/i,'economic growth'],
  [/inflasi|inflation/i,'inflation'],
  [/produktivitas|productivity/i,'productivity'],
  [/bisnis|usaha|business/i,'business'],
  [/internet|digital/i,'internet'],
  [/teknologi|technology/i,'technology'],
  [/media sosial|social media/i,'social media'],
  [/kesehatan|health/i,'health'],
  [/kesejahteraan|wellbeing|well-being/i,'wellbeing'],
  [/penyakit|disease/i,'disease'],
  [/stunting/i,'stunting'],
  [/gizi|nutrition/i,'nutrition'],
  [/polusi|pencemaran|pollution/i,'pollution'],
  [/perubahan iklim|climate change/i,'climate change'],
  [/emisi karbon|emisi co2|carbon emissions?/i,'carbon emissions'],
  [/energi terbarukan|renewable energy/i,'renewable energy'],
  [/lingkungan|environment/i,'environment'],
  [/kebijakan publik|public policy/i,'public policy'],
  [/pemerintah|government/i,'government'],
  [/korupsi|corruption/i,'corruption'],
  [/indonesia/i,'Indonesia'],
];
const DOMAINS = {
  education: {label:'Pendidikan',pattern:/belajar|siswa|mahasiswa|sekolah|guru|dosen|pendidikan|akademik|literasi|learning|education|students?/i,
    confounder:'kondisi awal peserta didik, kualitas pengajaran, dan akses sumber belajar',measure:'skor atau capaian belajar sebelum dan sesudah intervensi',design:'kelompok pembanding dengan capaian awal setara, idealnya eksperimen atau kuasi-eksperimen'},
  economy: {label:'Ekonomi & bisnis',pattern:/ekonomi|inflasi|kemiskinan|pengangguran|usaha|bisnis|upah|pajak|produktivit|pendapatan|economic|poverty|unemployment|business|growth/i,
    confounder:'perubahan kondisi makroekonomi, komposisi sektor, dan karakteristik wilayah',measure:'indikator ekonomi yang mempunyai definisi dan periode pengukuran konsisten',design:'analisis runtun waktu atau data panel dengan kontrol tren dan faktor pengganggu'},
  health: {label:'Kesehatan masyarakat',pattern:/kesehatan|stunting|gizi|penyakit|vaksin|rumah sakit|health|disease|nutrition|hospital/i,
    confounder:'usia, status kesehatan awal, akses layanan, dan faktor sosioekonomi',measure:'indikator keluaran kesehatan yang terdefinisi secara klinis atau epidemiologis',design:'kohort terbanding, uji terkendali bila layak, atau analisis multivariabel'},
  environment: {label:'Lingkungan',pattern:/lingkungan|iklim|emisi|karbon|polusi|pencemaran|energi|sampah|climate|environment|pollution|emissions/i,
    confounder:'perubahan cuaca, pola aktivitas ekonomi, kepadatan penduduk, dan komposisi energi',measure:'indikator lingkungan dengan lokasi, unit, dan rentang waktu yang konsisten',design:'komparasi lintas wilayah atau sebelum–sesudah dengan kontrol perubahan eksternal'},
  technology: {label:'Teknologi & AI',pattern:/\bai\b|artificial intelligence|teknologi|digital|internet|aplikasi|platform|algoritm|technology/i,
    confounder:'kesiapan digital, motivasi pengguna, dan seleksi pengguna teknologi',measure:'ukuran adopsi teknologi dan hasil yang relevan secara terpisah',design:'kelompok pengguna dan nonpengguna yang sebanding disertai uji sensitivitas'},
  public: {label:'Kebijakan publik',pattern:/kebijakan|regulasi|pemerintah|layanan publik|politik|policy|government|regulation/i,
    confounder:'perbedaan pelaksanaan program, karakteristik sasaran, dan kebijakan bersamaan',measure:'indikator keluaran kebijakan serta kelompok sasaran yang terdefinisi',design:'evaluasi dampak dengan kelompok pembanding atau analisis perbedaan-dalam-perbedaan'},
  general: {label:'Lintas bidang',pattern:/$^/,confounder:'karakteristik awal subjek, seleksi sampel, dan perubahan faktor eksternal',measure:'indikator hasil yang dinyatakan dalam definisi operasional',design:'pembandingan yang relevan dengan kontrol atas penjelasan alternatif'},
};
const WORLD_BANK = [
  {regex:/internet|digital|online|daring|teknologi informasi|connectivity/i,id:'IT.NET.USER.ZS',name:'Penduduk yang menggunakan internet',unit:'% penduduk',note:'Indikator adopsi digital, bukan ukuran langsung hasil belajar maupun pertumbuhan ekonomi.'},
  {regex:/pengangguran|unemployment/i,id:'SL.UEM.TOTL.ZS',name:'Pengangguran total (estimasi ILO)',unit:'% angkatan kerja',note:'Estimasi tingkat pengangguran; tidak menjelaskan penyebab dengan sendirinya.'},
  {regex:/kemiskinan|poverty/i,id:'SI.POV.NAHC',name:'Kemiskinan menurut garis nasional',unit:'% penduduk',note:'Definisi garis kemiskinan mengikuti metode statistik nasional.'},
  {regex:/pertumbuhan ekonomi|pdb|gdp|economic growth/i,id:'NY.GDP.MKTP.KD.ZG',name:'Pertumbuhan PDB riil tahunan',unit:'% per tahun',note:'Pertumbuhan agregat; bukan estimasi efek satu kebijakan atau teknologi.'},
  {regex:/inflasi|inflation/i,id:'FP.CPI.TOTL.ZG',name:'Inflasi harga konsumen',unit:'% per tahun',note:'Inflasi agregat; tidak membuktikan penyebab perubahan harga.'},
  {regex:/emisi|karbon|co2|carbon|iklim|climate/i,id:'EN.GHG.CO2.MT.CE.AR5',name:'Emisi CO₂ (ekivalen)',unit:'juta ton CO₂e',note:'Indikator konteks emisi; periksa metadata World Bank untuk definisi dan cakupan.'},
  {regex:/harapan hidup|life expectancy|kesehatan|health/i,id:'SP.DYN.LE00.IN',name:'Angka harapan hidup saat lahir',unit:'tahun',note:'Indikator agregat kesehatan, bukan bukti efektivitas intervensi tertentu.'},
  {regex:/angka partisipasi sekolah|akses pendidikan menengah|school enrollment|secondary enrollment/i,id:'SE.SEC.ENRR',name:'Angka partisipasi kasar pendidikan menengah',unit:'%',note:'Partisipasi sekolah tidak sama dengan capaian pembelajaran.'},
];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function safeUrl(value) {
  try { const u = new URL(String(value)); return u.protocol === 'https:' ? u.href : ''; }
  catch { return ''; }
}
function plainText(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g,' ').trim();
}
function shorten(text,max=230) {
  const t=String(text||'').replace(/\s+/g,' ').trim();
  if(t.length<=max)return t;
  return t.slice(0,max).replace(/\s+\S*$/,'').trim()+'…';
}
function tokens(text) {
  return (String(text).toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]).filter(w=>w.length>2&&!STOPWORDS.has(w));
}
function unique(items){return [...new Set(items)];}
function detectDomain(problem,selected){
  if(selected!=='auto'&&DOMAINS[selected])return selected;
  let max=-1,chosen='general';
  for(const [key,val] of Object.entries(DOMAINS)){
    if(key==='general')continue;
    const score=(problem.match(new RegExp(val.pattern.source,'gi'))||[]).length;
    if(score>max && score>0){max=score;chosen=key;}
  }
  return chosen;
}
function makeQuery(problem){
  const english=[];
  for(const [regex,value] of GLOSSARY){if(regex.test(problem))english.push(value);}
  const raw=unique(tokens(problem)).filter(word=>word.length>=4).slice(0,8);
  const terms=unique(english.join(' ').toLowerCase().split(' ').concat(raw));
  // Retain meaningful multi-word concepts without overconstraining search.
  const concepts=unique(english);
  const search=(concepts.length ? concepts.slice(0,3).join(' ') : raw.slice(0,5).join(' ')) || problem.slice(0,120);
  const secondary=raw.slice(0,4).join(' ') || search;
  const searchTokens=unique(tokens(concepts.join(' ')+' '+raw.join(' ')));
  return {search,secondary,searchTokens,raw,terms};
}
function relevanceScore(source,terms){
  if(!terms.length)return 1;
  const title=tokens(source.title);
  const abstract=tokens(source.excerpt||'');
  const matches=terms.filter(term=>title.includes(term)||abstract.includes(term));
  return matches.length + matches.filter(term=>title.includes(term)).length*1.5;
}
function decodeInverted(index){
  if(!index||typeof index!=='object')return '';
  const pairs=[];
  for(const [word,positions] of Object.entries(index)){
    if(!Array.isArray(positions))continue;
    for(const pos of positions){if(Number.isInteger(pos)&&pos>=0&&pos<3500)pairs.push([pos,word]);}
  }
  pairs.sort((a,b)=>a[0]-b[0]);
  return pairs.slice(0,850).map(p=>p[1]).join(' ').replace(/\s+([,.!?;:])/g,'$1');
}
function formatDate(date){return new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(date);}
function toast(message){
  ui.toast.textContent=message;ui.toast.hidden=false;clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{ui.toast.hidden=true;},3500);
}
function getSettings(){return {problem:ui.problem.value.trim(),domain:detectDomain(ui.problem.value.trim(),ui.domain.value),region:ui.region.value,period:Number(ui.period.value),language:ui.language.value};}
async function fetchJSON(url,signal){
  const ctl=new AbortController();const timeout=setTimeout(()=>ctl.abort(new Error('Batas waktu terlampaui')),API_TIMEOUT);
  const onAbort=()=>ctl.abort(signal.reason || new DOMException('Aborted','AbortError'));
  if(signal.aborted)onAbort();else signal.addEventListener('abort',onAbort,{once:true});
  try {
    const response=await fetch(url,{signal:ctl.signal,headers:{'Accept':'application/json'}});
    if(!response.ok)throw new Error('HTTP '+response.status);
    return await response.json();
  } finally {clearTimeout(timeout);signal.removeEventListener('abort',onAbort);}
}
function openAlexYearFilter(settings){return settings.period?String(new Date().getFullYear()-settings.period)+'-01-01':null;}
async function findOpenAlex(settings,query,signal){
  const params=new URLSearchParams({search:query.search,per_page:'12'});
  const earliest=openAlexYearFilter(settings);if(earliest)params.set('filter','from_publication_date:'+earliest);
  let result=await fetchJSON('https://api.openalex.org/works?'+params,signal);
  if(!result.results?.length && query.search!==query.secondary){params.set('search',query.secondary);result=await fetchJSON('https://api.openalex.org/works?'+params,signal);}
  return (result.results||[]).map(item=>{
    const abstract=decodeInverted(item.abstract_inverted_index);
    const url=safeUrl(item.doi)||safeUrl(item.primary_location?.landing_page_url)||safeUrl(item.id);
    const journal=item.primary_location?.source?.display_name||'OpenAlex';
    const authors=(item.authorships||[]).slice(0,3).map(a=>a.author?.display_name).filter(Boolean).join(', ');
    return {kind:'academic',provider:'OpenAlex',title:item.title||item.display_name||'',year:item.publication_year||'',url,
      doi:(item.doi||'').replace(/^https?:\/\/doi\.org\//,''),excerpt:shorten(abstract,340),hasAbstract:Boolean(abstract),
      detail:journal+(authors?' · '+authors:''),cited:item.cited_by_count||0,id:item.id||url};
  }).filter(item=>item.title&&item.url);
}
async function findCrossref(settings,query,signal){
  const params=new URLSearchParams({'query.bibliographic':query.search,rows:'9',select:'DOI,title,author,published,URL,container-title,type,abstract,is-referenced-by-count,score'});
  const earliest=openAlexYearFilter(settings);if(earliest)params.set('filter','from-pub-date:'+earliest);
  const data=await fetchJSON('https://api.crossref.org/works?'+params,signal);
  return (data.message?.items||[]).map(item=>{
    const parts=item.published?.['date-parts']?.[0]||[];
    const year=parts[0]||'';
    const doi=item.DOI||'';
    const authors=(item.author||[]).slice(0,3).map(a=>[a.given,a.family].filter(Boolean).join(' ')).join(', ');
    const journal=item['container-title']?.[0]||'Crossref';
    const abstract=plainText(item.abstract||'');
    return {kind:'academic',provider:'Crossref',title:item.title?.[0]||'',year,url:safeUrl(doi?'https://doi.org/'+doi:item.URL),doi,
      excerpt:shorten(abstract,340),hasAbstract:Boolean(abstract),detail:journal+(authors?' · '+authors:''),
      cited:item['is-referenced-by-count']||0,id:doi||item.URL};
  }).filter(item=>item.title&&item.url);
}
async function findWikipedia(settings,query,signal){
  const keywords=(settings.language==='id'?query.secondary:query.search).split(' ').slice(0,4).join(' ');
  const params=new URLSearchParams({action:'query',generator:'search',gsrsearch:keywords,gsrlimit:'5',prop:'extracts|info',exintro:'1',explaintext:'1',inprop:'url',format:'json',origin:'*'});
  let data=await fetchJSON('https://'+settings.language+'.wikipedia.org/w/api.php?'+params,signal);
  const pages=Object.values(data.query?.pages||{});
  return pages.filter(p=>!p.missing).map(p=>({kind:'context',provider:'Wikipedia',title:p.title||'',year:'',url:safeUrl(p.fullurl),doi:'',excerpt:shorten(p.extract||'',350),hasAbstract:Boolean(p.extract),detail:settings.language==='id'?'Wikipedia bahasa Indonesia':'Wikipedia bahasa Inggris',cited:0,id:'wiki:'+p.pageid})).filter(p=>p.title&&p.url);
}
function selectIndicator(problem){return WORLD_BANK.find(item=>item.regex.test(problem))||null;}
async function findWorldBank(settings,indicator,signal){
  if(!indicator)return null;
  const country=settings.region==='indonesia'?'IDN':'WLD';
  const url=`https://api.worldbank.org/v2/country/${country}/indicator/${indicator.id}?format=json&per_page=75`;
  const data=await fetchJSON(url,signal);
  const series=(Array.isArray(data?.[1])?data[1]:[]).filter(row=>row&&row.value!==null&&Number.isFinite(Number(row.value)))
    .map(row=>({year:Number(row.date),value:Number(row.value)})).filter(row=>Number.isInteger(row.year)).sort((a,b)=>a.year-b.year);
  if(!series.length)return null;
  return {...indicator,country:settings.region==='indonesia'?'Indonesia':'Dunia',series:series.slice(-20),
    url:safeUrl(`https://data.worldbank.org/indicator/${indicator.id}?locations=${country}`),apiUrl:url};
}
function normalizeSources(openalex,crossref,wiki,query){
  const seen=new Set(),all=[];
  const ordered=[...openalex,...crossref,...wiki];
  for(const source of ordered){
    const doi=source.doi?.toLowerCase().replace(/^https?:\/\/doi\.org\//,'');
    const title=source.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
    const key=doi?'doi:'+doi:'title:'+title;
    if(seen.has(key))continue;
    seen.add(key);
    const score=relevanceScore(source,query.searchTokens);
    // A title/abstract must overlap at least one topic term.
    if(score<=0)continue;
    all.push({...source,matchScore:score});
  }
  const academic=all.filter(s=>s.kind==='academic').sort((a,b)=>b.matchScore-a.matchScore||Number(b.hasAbstract)-Number(a.hasAbstract)||Number(b.year)-Number(a.year)).slice(0,8);
  const context=all.filter(s=>s.kind==='context').sort((a,b)=>b.matchScore-a.matchScore).slice(0,3);
  return [...academic,...context].map((source,index)=>({...source,ref:index+1}));
}
function buildEvidenceHighlights(sources){
  // Extract only words that occur in a returned abstract; never invent findings.
  return sources.filter(s=>s.kind==='academic'&&s.hasAbstract&&s.matchScore>=2)
    .slice(0,3).map(source=>{
      const sentences=source.excerpt.match(/[^.!?]+[.!?]?/g)||[source.excerpt];
      const preferred=sentences.find(t=>/results|findings|found|suggest|conclud|associated|significant|improve|increase|decrease|berpengaruh|menunjukkan|hasil penelitian/i.test(t))||sentences[0];
      return {ref:source.ref,source:source.title,statement:shorten(preferred.trim(),195)};
    }).filter(item=>item.statement.length>=25);
}
function evaluateSourceCoverage(sources,indicator){
  const academic=sources.filter(s=>s.kind==='academic');
  const abstracts=academic.filter(s=>s.hasAbstract).length;
  const distinct=new Set(academic.map(s=>s.doi||s.title.toLowerCase())).size;
  const contextual=(indicator?1:0)+sources.filter(s=>s.kind==='context').length;
  let label='Belum memadai';
  if(distinct>=3&&abstracts>=2)label='Dukungan literatur awal';
  else if(distinct>=1||contextual>=1)label='Terbatas / kontekstual';
  return {label,academic:academic.length,abstracts,contextual,distinct};
}
// Construct question-specific assumptions AFTER source retrieval. These are
// hypotheses, never findings. All [n] references point to a returned source.
function tidyConcept(value) {
  return String(value || '').replace(/^[\s,.:;!?"“”']+|[\s,.:;!?"“”']+$/g, '')
    .replace(/\s+/g, ' ').trim().slice(0, 150);
}
function extractResearchFrame(question) {
  const q=tidyConcept(question);
  const patterns=[
    /^(?:apakah|benarkah|sejauh mana)\s+(.+?)\s+(meningkatkan|menurunkan|mengurangi|memperburuk|memperbaiki|mempengaruhi|memengaruhi|menyebabkan|menentukan|berdampak pada|berpengaruh terhadap|berpengaruh pada|berkaitan dengan|berhubungan dengan|berkontribusi terhadap|berkontribusi pada|mendorong|menghambat)\s+(.+)$/i,
    /^(?:bagaimana|seberapa besar|sejauh mana|apa)\s+(?:pengaruh|dampak|efek|kontribusi|hubungan)\s+(.+?)\s+(?:terhadap|pada|dengan|bagi)\s+(.+)$/i,
    /^(?:apa|bagaimana)\s+(?:hubungan|keterkaitan)\s+antara\s+(.+?)\s+dan\s+(.+)$/i,
    /^(.+?)\s+(meningkatkan|menurunkan|mengurangi|memperbaiki|memengaruhi|mempengaruhi|menyebabkan|berdampak pada|berkaitan dengan|berpengaruh terhadap)\s+(.+)$/i,
  ];
  for(let i=0;i<patterns.length;i++){
    const m=q.match(patterns[i]);
    if(!m)continue;
    let x=tidyConcept(m[1]);
    const y=tidyConcept(i===1||i===2?m[2]:m[3]);
    const relation=i===1?'berpengaruh terhadap':i===2?'berhubungan dengan':m[2].toLowerCase();
    x=x.replace(/^(?:pengaruh|dampak|efek)\s+/i,'');
    if(x.length>=3&&y.length>=3){
      const direction=/meningkatkan|mendorong|memperbaiki/i.test(relation)?'meningkat':/menurunkan|mengurangi|menghambat|memperburuk/i.test(relation)?'menurun':'berkaitan';
      const causal=/meningkatkan|menurunkan|mengurangi|menyebabkan|memengaruhi|mempengaruhi|berdampak|berpengaruh|mendorong|menghambat|memperbaiki|memperburuk/i.test(relation);
      return {question:q,paired:true,x,y,relation,direction,causal};
    }
  }
  const focus=tidyConcept(q.replace(/^(?:apakah|bagaimana|mengapa|kenapa|sejauh mana|apa|kapan|siapa|mengukur|menganalisis|menjelaskan)\s+/i,''));
  return {question:q,paired:false,x:focus||q,y:null,relation:null,direction:null,causal:false};
}
function conceptTerms(part) {
  const aliases=[];
  for(const [regex,english] of GLOSSARY){
    if(regex.test(part))aliases.push(...tokens(english));
  }
  // Extra synonyms help English-language metadata without claiming that
  // translated matches constitute substantive agreement.
  if(/hasil belajar|prestasi akademik/i.test(part))aliases.push('academic','achievement','performance','outcomes');
  if(/mahasiswa/i.test(part))aliases.push('university','college','higher','education','undergraduate');
  if(/kecerdasan buatan|\bai\b/i.test(part))aliases.push('generative','chatgpt','machine');
  if(/pertumbuhan ekonomi/i.test(part))aliases.push('gdp','economic','growth');
  if(/stunting/i.test(part))aliases.push('child','growth','undernutrition');
  return unique([...tokens(part),...aliases]).filter(t=>t.length>2);
}
function sourceForBothConcepts(frame,sources){
  if(!frame.paired)return [];
  const xterms=conceptTerms(frame.x),yterms=conceptTerms(frame.y);
  if(!xterms.length||!yterms.length)return [];
  return sources.filter(s=>s.kind==='academic').map(source=>{
    const indexed=tokens(source.title+' '+(source.excerpt||''));
    const xhits=xterms.filter(t=>indexed.includes(t)).length;
    const yhits=yterms.filter(t=>indexed.includes(t)).length;
    const titleTokens=tokens(source.title);
    const titleHits=xterms.filter(t=>titleTokens.includes(t)).length+yterms.filter(t=>titleTokens.includes(t)).length;
    return {source, xhits, yhits, rank:xhits+yhits+titleHits*2};
  }).filter(item=>item.xhits>0&&item.yhits>0).sort((a,b)=>b.rank-a.rank).slice(0,2).map(item=>item.source);
}
function selectedMechanism(frame,domain) {
  const text=frame.question;
  if(/(?:kecerdasan buatan|artificial intelligence|\bai\b|chatgpt)/i.test(text)&&/belajar|pendidikan|mahasiswa|siswa|pembelajaran|akademik/i.test(text))
    return 'Jalur yang layak diuji ialah perubahan akses terhadap umpan balik, dukungan penyelesaian tugas, serta waktu belajar setelah penggunaan alat AI. Sebaliknya, ketergantungan pada jawaban otomatis juga mungkin mengubah kedalaman pemahaman. Kedua kemungkinan ini merupakan penjelasan yang bersaing, bukan temuan yang telah terbukti.';
  if(/internet|digital|platform|e-commerce/i.test(text)&&/ekonomi|usaha|produktivitas|pendapatan|pertumbuhan/i.test(text))
    return 'Mekanisme yang mungkin ialah berkurangnya biaya pencarian informasi, perluasan akses pasar, dan perubahan produktivitas. Namun manfaat tersebut tidak harus merata karena kualitas jaringan, keterampilan digital, dan struktur usaha berbeda antarwilayah; mekanisme ini perlu diperiksa dengan data sektoral.';
  if(/emisi|karbon|co2/i.test(text)&&/iklim|lingkungan|pemanasan/i.test(text))
    return 'Hipotesis mekanismenya ialah keterkaitan emisi gas rumah kaca dengan proses pemanasan dan perubahan kondisi iklim. Pengujian pada satu wilayah tetap harus memisahkan tren emisi global, variabilitas iklim setempat, perubahan penggunaan lahan, serta jeda waktu respons lingkungan.';
  if(/stunting|gizi/i.test(text))
    return 'Penjelasan yang mungkin berkaitan dengan kecukupan asupan gizi, infeksi berulang, sanitasi, dan akses layanan kesehatan. Faktor-faktor tersebut perlu diukur secara terpisah agar perubahan indikator tidak langsung diatribusikan kepada satu program.';
  if(/pengangguran|kemiskinan|inflasi|upah/i.test(text))
    return 'Kondisi pasar kerja, daya beli, distribusi kesempatan ekonomi, dan perubahan harga merupakan jalur penjelasan yang mungkin relevan. Hubungannya perlu diuji terhadap perubahan makroekonomi dan karakteristik kelompok sasaran, bukan hanya dengan satu tren agregat.';
  if(/kesehatan|penyakit|vaksin/i.test(text))
    return 'Mekanisme substantif dapat terkait dengan perbedaan paparan risiko, perilaku pencegahan, serta akses dan mutu layanan. Dugaan tersebut memerlukan bukti epidemiologis yang sesuai sebelum diperlakukan sebagai penjelasan kesehatan.';
  if(domain==='education')return 'Perbedaan proses belajar, intensitas keterlibatan peserta didik, mutu umpan balik, dan akses sumber belajar merupakan jalur yang mungkin relevan. Periksa apakah indikator capaian benar-benar berubah, bukan sekadar persepsi pengguna.';
  if(domain==='environment')return 'Jalur yang perlu diuji dapat melibatkan pola konsumsi energi, tekanan aktivitas manusia, dan kondisi lingkungan setempat. Jangan menyimpulkan mekanisme hanya dari korelasi antarindikator agregat.';
  if(domain==='technology')return 'Perubahan akses informasi, intensitas penggunaan teknologi, dan keterampilan pengguna dapat menjadi jalur yang perlu diuji. Adopsi teknologi sendiri tidak identik dengan hasil atau manfaat yang diharapkan.';
  if(domain==='public')return 'Perbedaan antara rancangan kebijakan, pelaksanaan di lapangan, dan respons kelompok sasaran perlu dijadikan kemungkinan penjelasan. Bukti keberhasilan harus memisahkan pelaksanaan program dari perubahan hasil.';
  return `Penjelasan atas “${frame.x}” harus ditelusuri dari konsep, mekanisme, dan data yang benar-benar tersedia. Karena input belum merinci mekanisme yang dapat diobservasi, aplikasi tidak mengasumsikan satu penyebab pasti.`;
}
function makeAssumptions(settings,sources=[],indicator=null,errors=[]) {
  const frame=extractResearchFrame(settings.problem);
  const ds=DOMAINS[settings.domain];
  const scope=settings.region==='indonesia'?'Indonesia':'lintas negara';
  const questionScope=/\b(?:di|untuk|pada)\s+(indonesia|malaysia|singapura|singapore|vietnam|thailand|filipina|china|tiongkok|jepang|jakarta|yogyakarta|jawa\s+(?:barat|timur|tengah)|bali)\b/i.exec(frame.question);
  const scopeNote=questionScope&&settings.region==='indonesia'&&!/indonesia|jakarta|yogyakarta|jawa|bali/i.test(questionScope[1])
    ?` Perhatian: pertanyaan menyebut ${questionScope[1]}, sedangkan filter pencarian dipilih Indonesia; sesuaikan cakupan sebelum menarik kesimpulan.`:'';
  const facts=[];
  if(frame.paired){
    const relation=frame.causal?'sebagai dugaan pengaruh yang belum teruji':'sebagai dugaan keterkaitan yang belum teruji';
    facts.push({title:'Premis yang diturunkan dari pertanyaan',text:`Pertanyaan “${frame.question}” menempatkan “${frame.x}” sebagai faktor atau paparan yang hendak diperiksa dan “${frame.y}” sebagai hasil atau kondisi yang ingin dijelaskan. Hubungan “${frame.relation}” diperlakukan ${relation}, bukan sebagai kesimpulan. Jika keduanya tidak dibedakan dalam data, jawaban berisiko mengulang premis pertanyaan tanpa mengujinya.`});
  }else{
    facts.push({title:'Premis yang diturunkan dari pertanyaan',text:`Masalah yang dimasukkan berfokus pada “${frame.x}”. Pertanyaan ini belum menyebutkan secara tegas pasangan faktor penyebab dan keluaran yang akan dibandingkan. Karena itu asumsi awalnya ialah fenomena tersebut dapat diuraikan menjadi indikator teramati; faktor penyebab atau arah hubungan tidak akan ditetapkan terlebih dahulu tanpa perumusan tambahan.`});
  }
  const mechanism=selectedMechanism(frame,settings.domain);
  facts.push({title:'Mekanisme yang dihipotesiskan',text:frame.paired?`Untuk hubungan antara “${frame.x}” dan “${frame.y}”, ${mechanism.charAt(0).toLowerCase()+mechanism.slice(1)} Keberadaan mekanisme ini harus diuji, bukan disimpulkan dari pilihan kata dalam rumusan masalah.`:mechanism});
  const timeframe=settings.period?`cakupan literatur ${settings.period} tahun terakhir`:'literatur dari seluruh tahun yang tersedia';
  facts.push({title:'Konteks, populasi, dan faktor pembanding',text:`Analisis awal berfokus pada ${scope}, sesuai pilihan wilayah, dengan ${timeframe}. Pilihan wilayah memandu interpretasi dan negara pada indikator World Bank; pencarian OpenAlex/Crossref sendiri tidak membatasi lokasi sampel, sehingga studi yang ditemukan dapat berasal dari wilayah lain. Interpretasi perlu mempertimbangkan ${ds.confounder}. ${frame.paired?`Perbedaan “${frame.y}” pada kelompok yang terpapar dan tidak terpapar “${frame.x}” hanya dapat ditafsirkan setelah kondisi awal dan cara pemilihan kelompok dibandingkan.`:`Populasi sasaran, periode observasi, dan kelompok pembanding harus ditentukan sebelum hipotesis dibuat.`}${scopeNote}`});
  const matches=sourceForBothConcepts(frame,sources);
  let evidenceText;
  if(matches.length){
    const refs=matches.map(s=>`[${s.ref}] “${shorten(s.title,92)}”${s.year?` (${s.year})`:''}`).join('; ');
    evidenceText=`Pemeriksaan otomatis terhadap judul dan/atau cuplikan abstrak menemukan kecocokan istilah untuk kedua konsep pada sumber ${refs}. Ini hanya bukti bahwa topik terkait muncul dalam metadata/abstrak; belum membuktikan arah hubungan, hasil studi, kualitas desain, atau kesepakatan literatur. Sumber lengkap wajib dibaca sebelum asumsi substantif diterima.`;
  } else if(sources.filter(s=>s.kind==='academic').length){
    evidenceText=`Penelusuran mengembalikan ${sources.filter(s=>s.kind==='academic').length} catatan ilmiah, tetapi pemeriksaan istilah sederhana belum menemukan catatan yang sekaligus cocok dengan kedua konsep utama secara memadai. Catatan tersebut masih dapat menjadi titik awal penelusuran, tetapi tidak dapat digunakan sebagai dukungan langsung terhadap dugaan dalam pertanyaan. Perlu perluasan kata kunci dan telaah artikel primer.`;
    if(!frame.paired)evidenceText=`Penelusuran menemukan ${sources.filter(s=>s.kind==='academic').length} catatan ilmiah yang memiliki kemiripan kata kunci dengan masalah “${frame.x}”. Kecocokan ini bersifat tekstual; temuan, metode, dan konteks studi belum diperiksa, sehingga belum ada bukti yang layak digunakan untuk memastikan penjelasan sebab-akibat.`;
  } else {
    evidenceText=`Belum ada artikel ilmiah yang berhasil diambil dan dinilai relevan untuk masalah “${frame.question}”. Karena itu tidak ada bukti akademik langsung yang dapat dinyatakan mendukung asumsi ini. Jangan mengganti ketiadaan data dengan klaim, angka, atau sitasi rekaan.`;
  }
  if(indicator?.series?.length){
    const last=indicator.series[indicator.series.length-1];
    evidenceText+=` Sebagai konteks deskriptif, seri World Bank “${indicator.name}” untuk ${indicator.country} mencatat ${numberFormat(last.value,2)} ${indicator.unit} pada ${last.year} [WB]. Indikator tersebut bukan ukuran langsung efek “${frame.x}” terhadap “${frame.y||'masalah yang diajukan'}” dan tidak dapat membuktikan sebab-akibat.`;
  }
  if(errors.length)evidenceText+=' Sebagian layanan data gagal diakses; ketiadaan sumber mungkin disebabkan keterbatasan akses, bukan ketiadaan penelitian.';
  facts.push({title:'Dukungan data yang benar-benar tersedia',text:evidenceText});
  const population=frame.paired?`“${frame.x}” (faktor/paparan) dan “${frame.y}” (hasil)`:`indikator terukur untuk “${frame.x}”`;
  facts.push({title:'Asumsi operasional dan syarat pengujian',text:`Agar dugaan ini bisa diuji, definisikan ${population}, sumber datanya, unit observasi, serta rentang waktu yang sama. Pengujian awal dapat memakai ${ds.measure}; rancangan yang perlu dipertimbangkan adalah ${ds.design}. Rumuskan terlebih dahulu hasil yang akan mendukung atau melemahkan hipotesis, lalu laporkan besaran hubungan, ketidakpastian, dan kemungkinan penjelasan alternatif.`});
  return facts;
}
function makeHypotheses(settings){
  const ds=DOMAINS[settings.domain];
  return [
    {tag:'ANTITESIS A · PENJELASAN ALTERNATIF',title:`Perbedaan yang diamati mungkin lebih dipengaruhi oleh ${ds.confounder}, bukan oleh faktor utama dalam pertanyaan.`,test:`Uji dengan ${ds.design}; amati apakah dugaan hubungan bertahan setelah faktor alternatif diperhitungkan.`},
    {tag:'ANTITESIS B · HIPOTESIS NOL',title:'Setelah kondisi awal dan faktor pembanding dikendalikan, efek atau hubungan yang diduga mungkin tidak berbeda secara bermakna dari nol.',test:`Tetapkan terlebih dahulu ${ds.measure}, ukuran sampel, interval ketidakpastian, serta kriteria hasil yang akan menolak atau tidak menolak hipotesis nol.`},
    {tag:'ANTITESIS C · VALIDITAS EKSTERNAL',title:'Hasil dari satu kelompok, periode, atau wilayah mungkin tidak berlaku untuk populasi lain.',test:'Ulangi pengukuran pada kelompok dan periode yang berbeda. Catat perubahan besar efek dan potensi bias seleksi.'},
  ];
}
function makeFallacies(problem){
  const postHoc=/setelah|sesudah|semenjak|sejak|akibat|karena|menyebabkan|berdampak|memengaruhi|mempengaruhi|meningkatkan|menurunkan|cause|because|leads to|results in/i.test(problem);
  const overGeneral=/\bsemua\b|\bselalu\b|\bpasti\b|\bsetiap\b|\bsepenuhnya\b|\btidak pernah\b|\bany\b|\ball\b|\balways\b|\bevery\b|\bnever\b/i.test(problem);
  const authority=/menurut pakar|kata ahli|menurut profesor|tokoh mengatakan|menurut pejabat|sudah diakui|pakar membuktikan|experts say|authority says/i.test(problem);
  return [
    {name:'Post hoc ergo propter hoc',triggered:postHoc,risk:'Hubungan waktu atau korelasi bisa disalahartikan sebagai hubungan sebab-akibat.',check:'Pastikan arah waktu, tren sebelumnya, kelompok pembanding, dan penyebab alternatif. Frasa kausal saja bukan bukti sesat pikir.'},
    {name:'Overgeneralization',triggered:overGeneral,risk:'Temuan pada sampel terbatas berisiko diperlakukan sebagai kebenaran untuk seluruh populasi.',check:'Periksa ukuran serta cara pemilihan sampel, konteks, pengecualian, dan interval kepercayaan.'},
    {name:'Appeal to authority',triggered:authority,risk:'Nama pakar atau lembaga bisa dianggap sebagai pengganti pemeriksaan metode dan data.',check:'Periksa mutu desain, transparansi data, replikasi, dan konflik kepentingan—bukan sekadar reputasi sumber.'},
  ];
}
function makeRecommendations(settings,coverage,indicator){
  const ds=DOMAINS[settings.domain];
  const rec=[
    `Definisikan masalah secara operasional: tentukan populasi ${settings.region==='indonesia'?'di Indonesia':'yang hendak dibandingkan'}, satuan analisis, serta ${ds.measure}.`,
    `Uji hipotesis utama terhadap antitesis dengan ${ds.design}; dokumentasikan faktor pengganggu, sumber bias, dan kriteria keberhasilan sebelum menganalisis hasil.`,
  ];
  if(coverage.abstracts>=2){rec.push(`Baca naskah lengkap minimal dua publikasi yang paling relevan dari daftar sumber. Verifikasi desain, besar efek, ukuran sampel, ketidakpastian, dan keterbatasan; abstrak saja tidak cukup untuk menetapkan kesimpulan.`);}
  else rec.push('Prioritaskan penelusuran dan pembacaan studi primer berkualitas; hasil yang tersedia belum memadai untuk mengklaim efektivitas atau kausalitas.');
  if(indicator)rec.push(`Gunakan deret waktu World Bank “${indicator.name}” hanya sebagai konteks deskriptif; bandingkan definisi indikator dan tahun pengamatan sebelum mengaitkannya dengan masalah.`);
  else rec.push('Cari dataset primer yang mencakup variabel, wilayah, dan periode spesifik; lakukan uji konsistensi definisi, ketidaklengkapan data, dan keterbandingan antarobservasi.');
  rec.push('Buat keputusan bertahap: mulai dari studi kecil atau pilot yang terukur, evaluasi hasil dan ketidakpastian, lalu perluas hanya apabila bukti berulang mendukungnya.');
  return rec;
}
function makeSynthesis(settings,coverage,indicator,errors){
  if(coverage.academic===0&&!indicator){
    return 'Belum ditemukan bukti primer yang cukup dari layanan yang berhasil diakses. Kesimpulan substantif tidak dapat ditetapkan. Analisis di bawah hanya menyediakan kerangka pengujian dan strategi pengumpulan bukti.';
  }
  const pieces=[`Penelusuran menemukan ${coverage.academic} catatan ilmiah yang lolos penyaringan kecocokan teks (${coverage.abstracts} dengan abstrak tersedia)`];
  if(indicator)pieces.push(`dan satu indikator World Bank sebagai konteks statistik`);
  if(coverage.contextual-(indicator?1:0)>0)pieces.push(`serta sumber ensiklopedis`);
  const caut='Keberadaan publikasi, jumlah sitasi, atau tren agregat tidak membuktikan hipotesis dalam pertanyaan. Kesimpulan mengenai arah, besaran, dan sebab-akibat masih memerlukan telaah naskah lengkap serta analisis data yang sesuai.';
  return pieces.join(' ')+'. '+caut+(errors.length?' Sebagian layanan sumber tidak berhasil diakses.':'');
}
function setBusy(busy){
  ui.button.disabled=busy;ui.buttonLabel.textContent=busy?'Menelusuri sumber…':'Analisis masalah sekarang';
  ui.cancel.hidden=!busy;ui.pulse.classList.toggle('active',busy);
  ui.resultLabel.textContent=busy?'RESEARCH IN PROGRESS':lastReport?'RESEARCH REPORT':'RESEARCH CANVAS';
  ui.actions.hidden=busy||!lastReport;
}
function loadingMarkup(steps,errors=[]){
  const names=['Menganalisis rumusan masalah','Menelusuri OpenAlex & Crossref','Memeriksa Wikipedia & indikator World Bank','Menyusun antitesis dan uji logika','Memfinalisasi rekomendasi'];
  return `<div class="progress-container"><div class="progress-icon"><svg class="loading-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke-dasharray="35 22"/></svg></div><h2>Menyusun analisis berbasis bukti</h2><p>Menelusuri sumber publik secara langsung. Ketersediaan hasil bergantung pada koneksi dan layanan penyedia data.</p><div class="progress-list">${names.map((n,i)=>`<div class="progress-item ${steps[i]||''}"><span class="progress-item-icon">${steps[i]==='done'?'✓':String(i+1)}</span><span>${n}</span></div>`).join('')}</div>${errors.length?`<p class="progress-warning">${escapeHtml(errors.join(' · '))}</p>`:''}</div>`;
}
function numberFormat(n,digits=1){return new Intl.NumberFormat('id-ID',{maximumFractionDigits:digits}).format(n);}
function drawSparkline(series){
  if(series.length<2)return '';
  const values=series.map(x=>x.value), min=Math.min(...values),max=Math.max(...values),range=(max-min)||1;
  const points=values.map((v,i)=>({x:10+i*480/(values.length-1),y:62-49*(v-min)/range}));
  const line=points.map((p,i)=>`${i?'L':'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const last=points[points.length-1];
  return `<div class="indicator-chart"><svg viewBox="0 0 500 73" preserveAspectRatio="none" role="img" aria-label="Grafik deret waktu deskriptif"><path d="M10 64H490" stroke="#e4ebe8" stroke-width="1"/><path d="${line}" stroke="#2d917c" fill="none" vector-effect="non-scaling-stroke"/><circle cx="${last.x}" cy="${last.y}" r="4" fill="#247f6f" stroke="white" stroke-width="2"/></svg></div>`;
}
function linkHTML(url,label){const safe=safeUrl(url);return safe?`<a class="source-link" href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 17 10-10M8 7h9v9"/></svg></a>`:'';}
function assumptionTextHTML(text, sources, indicator) {
  return escapeHtml(text).replace(/\[(\d+|WB)\]/g, (matched, ref) => {
    if(ref==='WB')return indicator?.url?`<a class="assumption-ref" href="${escapeHtml(safeUrl(indicator.url))}" target="_blank" rel="noopener noreferrer" aria-label="Data World Bank">[WB]</a>`:matched;
    return sources.some(s=>String(s.ref)===ref)?`<a class="assumption-ref" href="#source-ref-${ref}" aria-label="Lihat referensi ${ref}">[${ref}]</a>`:matched;
  });
}
function sourceMarkup(source){
  return `<article class="source-card" id="source-ref-${source.ref}" data-kind="${escapeHtml(source.kind)}"><div class="source-top"><span class="source-type ${source.kind==='context'?'context':''}">[${source.ref}] ${escapeHtml(source.provider)}</span><span class="source-year">${escapeHtml(source.year||'Tahun tidak tersedia')}</span></div><h4>${escapeHtml(source.title)}</h4>${source.excerpt?`<p class="source-excerpt">${escapeHtml(shorten(source.excerpt,265))}</p>`:`<p>Hanya metadata tersedia; abstrak tidak tersedia dari API ini.</p>`}<div class="source-btm"><span class="source-publisher">${escapeHtml(shorten(source.detail,110))}${source.doi?' · DOI terdaftar':''}</span>${linkHTML(source.url,'Lihat sumber')}</div></article>`;
}
function indicatorMarkup(indicator){
  if(!indicator)return '';
  const series=indicator.series,last=series[series.length-1],old=series.length>1?series[series.length-2]:null;
  const from=series[0];
  const delta=old?` · ${last.value>=old.value?'+':''}${numberFormat(last.value-old.value,2)} ${indicator.unit.includes('%')?'poin persentase':'satuan'} dari ${old.year}` : '';
  return `<div class="indicator-card"><div class="indicator-head"><div><div class="indicator-name">${escapeHtml(indicator.name)} · ${escapeHtml(indicator.country)}</div><div class="indicator-value">${numberFormat(last.value,2)} <span style="font-size:11px;font-weight:600;color:#758e88">${escapeHtml(indicator.unit)}</span></div><div class="indicator-trend">Data terbaru ${last.year}${escapeHtml(delta)}</div></div><span class="source-type data">WORLD BANK</span></div>${drawSparkline(series)}<div class="indicator-foot"><span>${from.year} — ${last.year} · ${series.length} observasi valid</span>${linkHTML(indicator.url,'Periksa data asli')}</div><p class="report-ref">${escapeHtml(indicator.note)}</p></div>`;
}
function renderReport(report){
  const {settings,sources,indicator,coverage,assumptions,hypotheses,fallacies,recommendations,synthesis,errors,created,evidenceHighlights}=report;
  const warnings=errors.length?`<div class="evidence-note">Sebagian sumber gagal diakses: ${escapeHtml(errors.join('; '))}. Tidak ada data yang dibuat untuk menggantikan respons API.</div>`:'';
  const evidenceWarning=coverage.abstracts<2?'<div class="evidence-note missing">Bukti belum memadai untuk mendukung klaim substantif. Data yang ada hanya membantu merumuskan pengujian; jangan menyimpulkan sebab-akibat dari daftar sumber.</div>':'<div class="evidence-note">Catatan metodologis: pencarian otomatis hanya memeriksa metadata dan cuplikan abstrak. Artikel yang tercantum belum diverifikasi penuh, dan jumlah sitasi bukan ukuran kebenaran.</div>';
  ui.canvas.className='canvas';
  ui.canvas.innerHTML=`<article class="report"><header class="report-head"><span class="report-kicker">SOLUTION PROBLEMS / ANALISIS EMPIRIS</span><h2>${escapeHtml(settings.problem)}</h2><p class="report-summary">${escapeHtml(synthesis)}</p><div class="report-meta"><span class="meta-chip">${escapeHtml(DOMAINS[settings.domain].label)}</span><span class="meta-chip">${escapeHtml(settings.region==='indonesia'?'Indonesia':'Global')}</span><span class="meta-chip">${escapeHtml(formatDate(new Date(created)))}</span><span class="meta-chip warn">Dukungan: ${escapeHtml(coverage.label)}</span></div></header>
  <section class="report-section"><div class="report-section-header"><span class="section-index">01</span><h3>Asumsi dasar</h3></div><p class="section-small">Narasi dibentuk dari masalah yang diinput, hasil pencarian sumber, dan indikator yang benar-benar tersedia. Seluruh dugaan tetap harus diuji.</p><div class="assumption-narratives">${assumptions.map(a=>`<section class="assumption-item"><h4>${escapeHtml(a.title)}</h4><p>${assumptionTextHTML(a.text, sources, indicator)}</p></section>`).join('')}</div></section>
  <section class="report-section" id="evidence-section"><div class="report-section-header"><span class="section-index">02</span><h3>Bukti awal &amp; jejak sumber</h3></div><p class="section-small">Identitas catatan dan tautan berasal dari respons layanan sumber. Isi publikasi belum diverifikasi penuh; relevansi disaring secara otomatis.</p>${warnings}${evidenceWarning}<div class="evidence-stats"><div class="evidence-stat"><b>${coverage.academic}</b><span>Catatan ilmiah</span></div><div class="evidence-stat"><b>${coverage.abstracts}</b><span>Abstrak tersedia</span></div><div class="evidence-stat"><b>${coverage.contextual}</b><span>Sumber konteks</span></div></div>${evidenceHighlights.length?`<div class="highlights-box"><h4>Yang tertulis dalam abstrak sumber</h4><p class="section-small">Kutipan teks yang benar-benar dikembalikan API; belum diverifikasi terhadap naskah lengkap atau kualitas metodenya.</p>${evidenceHighlights.map(item=>`<p class="highlight-line"><b>[${item.ref}]</b> “${escapeHtml(item.statement)}”</p>`).join('')}</div>`:''}${indicator?`<h4 style="font-size:12px;margin:0 0 10px">Data empiris deskriptif</h4>${indicatorMarkup(indicator)}`:''}${sources.length?`<div class="source-filters" role="group" aria-label="Filter referensi"><button type="button" class="source-filter active" data-filter="all">Semua (${sources.length})</button><button type="button" class="source-filter" data-filter="academic">Ilmiah (${coverage.academic})</button><button type="button" class="source-filter" data-filter="context">Konteks (${sources.length-coverage.academic})</button></div><div class="sources" id="sources-list">${sources.map(sourceMarkup).join('')}</div>`:'<div class="source-empty">Belum ada artikel atau sumber kontekstual relevan yang berhasil ditemukan. Coba rumuskan pertanyaan lebih spesifik atau ulangi ketika layanan tersedia.</div>'}</section>
  <section class="report-section"><div class="report-section-header"><span class="section-index">03</span><h3>Antitesis &amp; falsifikasi</h3></div><p class="section-small">Hipotesis alternatif ini adalah kemungkinan yang harus diuji, bukan pernyataan fakta.</p>${hypotheses.map(h=>`<div class="hypothesis-card"><span class="hypothesis-tag">${escapeHtml(h.tag)}</span><h4>${escapeHtml(h.title)}</h4><p><strong>Cara menguji:</strong> ${escapeHtml(h.test)}</p></div>`).join('')}</section>
  <section class="report-section"><div class="report-section-header"><span class="section-index">04</span><h3>Audit logical fallacy</h3></div><p class="section-small">Pendeteksian berbasis pola teks; sebuah tanda bukan vonis bahwa argumen pasti sesat.</p>${fallacies.map(f=>`<div class="fallacy-card"><div class="fallacy-title">${escapeHtml(f.name)}<span class="fallacy-label ${f.triggered?'triggered':''}">${f.triggered?'Perlu diperiksa':'Tidak terindikasi eksplisit'}</span></div><p>${escapeHtml(f.risk)} <strong>Uji:</strong> ${escapeHtml(f.check)}</p></div>`).join('')}</section>
  <section class="report-section"><div class="report-section-header"><span class="section-index">05</span><h3>Rekomendasi yang dapat ditindaklanjuti</h3></div><ol class="recommendation-list">${recommendations.map(r=>`<li>${escapeHtml(r)}</li>`).join('')}</ol></section>
  <section class="report-section"><div class="report-section-header"><span class="section-index">↳</span><h3>Kesimpulan &amp; batas analisis</h3></div><div class="caution-box">${escapeHtml(synthesis)} Analisis ini bukan telaah sistematis, bukan verifikasi klaim penuh, dan tidak memastikan hubungan kausal. Periksa langsung DOI, dokumen asli, serta definisi seri statistik sebelum digunakan untuk kebijakan atau keputusan berisiko tinggi.</div><p class="report-ref">Jejak sumber: ${sources.length} tautan referensi${indicator?' + 1 tautan indikator World Bank':''}. Tidak ada sitasi yang dibuat secara sintetis. Copyright © 2026 ramalabs.</p></section></article>
  <nav class="report-end-actions" aria-label="Navigasi riset dan ekspor laporan"><button type="button" id="back-bottom-btn" class="bottom-back">← Kembali ke Input</button><button type="button" id="rerun-bottom-btn" class="bottom-rerun">↻ Riset Ulang</button><button type="button" id="pdf-bottom-btn" class="bottom-back">↗ Cetak PDF</button><button type="button" id="word-bottom-btn" class="bottom-back">↓ Unduh Word</button></nav>`;
  ui.canvas.querySelector('#rerun-bottom-btn')?.addEventListener('click',rerunResearch);
  ui.canvas.querySelector('#back-bottom-btn')?.addEventListener('click',backToInput);
  ui.canvas.querySelector('#pdf-bottom-btn')?.addEventListener('click',()=>$('#pdf-btn').click());
  ui.canvas.querySelector('#word-bottom-btn')?.addEventListener('click',()=>$('#word-btn').click());
  ui.canvas.querySelectorAll('.source-filter').forEach(button=>button.addEventListener('click',()=>{
    ui.canvas.querySelectorAll('.source-filter').forEach(b=>b.classList.toggle('active',b===button));
    ui.canvas.querySelectorAll('.source-card').forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.kind!==button.dataset.filter;});
  }));
  ui.actions.hidden=false;ui.resultLabel.textContent='RESEARCH REPORT';ui.pulse.classList.remove('active');
}
async function runResearch(event){
  event.preventDefault();
  if(activeController)return;
  const settings=getSettings();
  if(settings.problem.length<12){toast('Tulis masalah sedikitnya 12 karakter.');ui.problem.focus();return;}
  lastReport=null;
  const ctl=new AbortController();activeController=ctl;setBusy(true);
  const query=makeQuery(settings.problem);
  const statuses=['done','running','','',''];
  const errors=[];
  ui.canvas.className='canvas';ui.canvas.innerHTML=loadingMarkup(statuses);
  const sourcesResult={openalex:[],crossref:[],wikipedia:[],worldbank:null};
  const indicatorSpec=selectIndicator(settings.problem);
  const tasks=[
    {key:'openalex',fn:()=>findOpenAlex(settings,query,ctl.signal),message:'OpenAlex tidak tersedia'},
    {key:'crossref',fn:()=>findCrossref(settings,query,ctl.signal),message:'Crossref tidak tersedia'},
    {key:'wikipedia',fn:()=>findWikipedia(settings,query,ctl.signal),message:'Wikipedia tidak tersedia'},
  ];
  if(indicatorSpec)tasks.push({key:'worldbank',fn:()=>findWorldBank(settings,indicatorSpec,ctl.signal),message:'World Bank tidak tersedia'});
  let completed=0;
  await Promise.all(tasks.map(async task=>{
    try {sourcesResult[task.key]=await task.fn();}
    catch(e){if(!ctl.signal.aborted)errors.push(`${task.message} (${e?.message?.slice(0,50)||'gagal'})`);}
    finally {
      completed++;
      if(!ctl.signal.aborted){
        if(completed>=2){statuses[1]='done';statuses[2]='running';}
        if(completed===tasks.length){statuses[2]='done';statuses[3]='running';}
        ui.canvas.innerHTML=loadingMarkup(statuses,errors);
      }
    }
  }));
  if(ctl.signal.aborted){activeController=null;setBusy(false);ui.canvas.innerHTML='<div class="error-report"><h2>Penelusuran dibatalkan</h2><p>Masukkan masalah dan jalankan kembali bila diperlukan.</p></div>';return;}
  statuses[3]='done';statuses[4]='running';ui.canvas.innerHTML=loadingMarkup(statuses,errors);
  const sources=normalizeSources(sourcesResult.openalex,sourcesResult.crossref,sourcesResult.wikipedia,query);
  const indicator=sourcesResult.worldbank;
  const coverage=evaluateSourceCoverage(sources,indicator);
  const report={settings,searchQuery:query.search,created:new Date().toISOString(),sources,indicator,coverage,
    assumptions:makeAssumptions(settings,sources,indicator,errors),evidenceHighlights:buildEvidenceHighlights(sources),hypotheses:makeHypotheses(settings),fallacies:makeFallacies(settings.problem),
    recommendations:makeRecommendations(settings,coverage,indicator),errors};
  report.synthesis=makeSynthesis(settings,coverage,indicator,errors);
  lastReport=report;activeController=null;setBusy(false);renderReport(report);
  if(errors.length)toast('Analisis selesai dengan sebagian sumber tidak tersedia.');
  else toast('Analisis selesai. Periksa sumber dan batas bukti.');
}
function reportToMarkdown(r){
  let out=`# SOLUTION PROBLEMS — Laporan Analisis\n\n**Pertanyaan:** ${r.settings.problem}\n\n**Tanggal:** ${formatDate(new Date(r.created))}  \n**Bidang:** ${DOMAINS[r.settings.domain].label}  \n**Wilayah:** ${r.settings.region}  \n**Dukungan bukti:** ${r.coverage.label}\n\n## Kesimpulan sementara\n${r.synthesis}\n\n`;
  out+='## 1. Asumsi dasar (narasi dari pertanyaan dan sumber yang tersedia; belum terverifikasi)\n\n'+r.assumptions.map((a,i)=>`### ${i+1}. ${a.title}\n${a.text}`).join('\n\n')+'\n\n';
  out+='## 2. Jejak bukti empiris\n';
  if(r.evidenceHighlights.length)out+='### Cuplikan abstrak yang dapat ditelusuri (bukan hasil verifikasi penuh)\n'+r.evidenceHighlights.map(h=>`- [${h.ref}] “${h.statement}”`).join('\n')+'\n\n';
  if(r.indicator){const last=r.indicator.series.at(-1);out+=`- World Bank, ${r.indicator.name} (${r.indicator.country}): ${numberFormat(last.value,2)} ${r.indicator.unit} (${last.year}). ${r.indicator.note} ${r.indicator.url}\n`;}
  out+=r.sources.length?r.sources.map(s=>`- [${s.ref}] ${s.title} (${s.year||'tahun tidak tersedia'}). ${s.provider}. ${s.url}${s.excerpt?'\n  - Ringkasan metadata/abstrak: '+s.excerpt:''}`).join('\n'):'Tidak ada referensi relevan yang berhasil ditarik.';
  out+='\n\n## 3. Antitesis dan pengujian\n'+r.hypotheses.map(h=>`### ${h.tag}\n${h.title}\n\nCara menguji: ${h.test}`).join('\n\n')+'\n\n';
  out+='## 4. Audit kekeliruan logika\n'+r.fallacies.map(f=>`- **${f.name}** (${f.triggered?'perlu diperiksa':'tidak terindikasi eksplisit'}): ${f.risk} ${f.check}`).join('\n')+'\n\n';
  out+='## 5. Rekomendasi\n'+r.recommendations.map((a,i)=>`${i+1}. ${a}`).join('\n')+'\n\n';
  out+='## Keterbatasan\nPencarian eksploratif dari metadata, abstrak dan indikator publik. Bukan tinjauan sistematis atau verifikasi penuh atas isi artikel. Tidak ada bukti kausal yang dapat disimpulkan hanya dari hasil pencarian.\n';
  if(r.errors.length)out+='\nLayanan yang gagal: '+r.errors.join('; ')+'\n';
  return out+'\nCopyright © 2026 ramalabs. All rights reserved.\n';
}
function downloadContent(text,filename,type){
  const blob=new Blob([text],{type});downloadBlob(blob,filename);
}
function downloadBlob(blob,filename){
  const link=document.createElement('a');const url=URL.createObjectURL(blob);
  link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function backToInput(){
  if(activeController)return;
  ui.problem.scrollIntoView({behavior:'smooth',block:'center'});
  ui.problem.focus({preventScroll:true});
  toast('Silakan ubah masalah atau pengaturan, lalu jalankan analisis.');
}
function rerunResearch(){
  if(activeController)return;
  // Re-run the search, including any changes the user has made to the input fields.
  ui.form.requestSubmit();
  if(window.matchMedia('(max-width: 800px)').matches){
    ui.resultColumn.scrollIntoView({behavior:'smooth',block:'start'});
  }
}
ui.form.addEventListener('submit',runResearch);
ui.problem.addEventListener('input',()=>{ui.counter.textContent=ui.problem.value.length+' / 1200';});
ui.cancel.addEventListener('click',()=>{if(activeController)activeController.abort();});
$('#copy-btn').addEventListener('click',async()=>{
  if(!lastReport)return;
  try{await navigator.clipboard.writeText(reportToMarkdown(lastReport));toast('Analisis disalin ke clipboard.');}
  catch{toast('Clipboard tidak tersedia. Gunakan unduhan Markdown.');}
});
$('#markdown-btn').addEventListener('click',()=>{if(lastReport)downloadContent(reportToMarkdown(lastReport),'solution-problems-ramalabs.md','text/markdown;charset=utf-8');});
$('#json-btn').addEventListener('click',()=>{if(lastReport)downloadContent(JSON.stringify({...lastReport,copyright:'Copyright © 2026 ramalabs'},null,2),'solution-problems-ramalabs.json','application/json;charset=utf-8');});
$('#pdf-btn').addEventListener('click',()=>{
  if(!lastReport)return;
  // Browser print dialog: select "Save as PDF" or a physical printer.
  window.print();
});
$('#word-btn').addEventListener('click',()=>{
  if(!lastReport)return;
  try{
    const docx=window.buildRamalabsDocx(lastReport);
    const blob=new Blob([docx],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
    downloadBlob(blob,'uji-solusi-ramalabs.docx');
    toast('Dokumen Word (.docx) berhasil disiapkan.');
  }catch(error){console.error('DOCX export:',error);toast('Gagal membuat Word. Coba ulangi.');}
});
$('#rerun-btn').addEventListener('click',rerunResearch);
$('#back-input-btn').addEventListener('click',backToInput);
document.querySelectorAll('.example').forEach(button=>button.addEventListener('click',()=>{
  ui.problem.value=button.dataset.question;ui.domain.value=button.dataset.domain;ui.counter.textContent=ui.problem.value.length+' / 1200';ui.problem.focus();
  if(window.matchMedia('(max-width: 800px)').matches)ui.problem.scrollIntoView({behavior:'smooth',block:'center'});
}));
function refreshNetwork(){ui.network.innerHTML=navigator.onLine?'<span class="live-dot"></span> Sumber internet langsung':'<span class="live-dot offline"></span> Offline · butuh internet';}
window.addEventListener('online',refreshNetwork);window.addEventListener('offline',refreshNetwork);refreshNetwork();
