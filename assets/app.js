(function(){
  const $ = (s)=>document.querySelector(s);
  const state = {
    lang: localStorage.getItem('lang') || 'en',
    db:{ en: null, no: null }
  };
  const TEXT = {
    en:{
      hint: "Type a name in English. Results come from a static JSON file.",
      placeholder: "Search... (e.g., 'multimeter', 'alarm clock', 'knife')",
      th_title: "Title",
      th_item: "Item",
      th_loc: "Location",
      meta_source: "Source: furusetalle9.oslo.no",
      meta_db_prefix: "DB: ",
      meta_privacy:
      empty: "—",
      db_missing: "⚠ Language database missing — create db/inventory.en.json and db/inventory.no.json"
    },
    no:{
      hint: "Skriv et navn på norsk. Resultatene hentes fra en statisk JSON-fil",
      placeholder: "Søk... (f.eks. 'multimeter', 'vekkerklokke', 'kniv')",
      th_title: "Tittel",
      th_item: "Gjenstand",
      th_loc: "Plassering",
      meta_source: "Kilde: furusetalle9.oslo.no",
      meta_db_prefix: "DB: ",
      meta_privacy:
      empty: "—",
      db_missing: "⚠ Mangler database for språk — lag db/inventory.en.json og db/inventory.no.json"
    }
  };

  function applyLang(){
    const t = TEXT[state.lang];
    $('#hint').textContent = t.hint;
    $('#q').placeholder = t.placeholder;
    $('#th-title').textContent = t.th_title;
    $('#th-item').textContent = t.th_item;
    $('#th-location').textContent = t.th_loc;
    $('#foot-source').textContent = t.meta_source;
    $('#foot-privacy').textContent = t.meta_privacy;
    $('#btn-en').classList.toggle('active', state.lang==='en');
    $('#btn-no').classList.toggle('active', state.lang==='no');
  }

  async function loadDB(lang){
    const url = lang==='en' ? 'db/inventory.en.json' : 'db/inventory.no.json';
    $('#foot-db').textContent = `${(TEXT[state.lang]||TEXT.en).meta_db_prefix}${url}`;
    try{
      const res = await fetch(`${url}?v=${Date.now()}`);
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.db[lang] = data;
      return data;
    }catch(e){
      const t = TEXT[state.lang] || TEXT.en;
      const tbody = $('#tbody');
      tbody.innerHTML = `<tr class="placeholder"><td colspan="3">${t.db_missing}</td></tr>`;
      return [];
    }
  }

  function normalize(s){
    return (s||"").normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
  }

  function scoreRecord(rec, qset){
    const fields = [rec.box_title, rec.item, rec.location].map(normalize);
    let score = 0;
    qset.forEach(q=>fields.forEach(f=>{ if(f.includes(q)) score++; }));
    const item = fields[1];
    qset.forEach(q=>{ if(item.includes(q)) score++; });
    return score;
  }

  function escapeHTML(s){
    return (s||"").replace(/[&<>"]/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;", '"':"&quot;" }[c]));
  }

  function renderRows(rows){
    const t = TEXT[state.lang] || TEXT.en;
    const tbody = $('#tbody');
    if(!rows.length){
      tbody.innerHTML = `<tr class="placeholder"><td colspan="3">${t.empty}</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map(r=>{
      const title = escapeHTML(r.box_title || "");
      const item  = escapeHTML(r.item || "");
      const loc   = escapeHTML(r.location || "");
      return `<tr><td>${title}</td><td>${item}</td><td>${loc || '—'}</td></tr>`;
    }).join("");
  }

  function onInput(){
    const qraw = $('#q').value;
    const qnorm = (window.SYNSETS && window.SYNSETS.normalize) ? window.SYNSETS.normalize(qraw) : normalize(qraw);
    let qset = [qnorm];
    if(window.SYNSETS && window.SYNSETS.expand){
      qset = window.SYNSETS.expand(qraw);
    }
    const data = state.db[state.lang] || [];
    const rows = data
      .map(r=>({rec:r, score: scoreRecord(r, qset)}))
      .filter(x=>x.score>0 || qnorm.trim()==="")
      .sort((a,b)=> b.score - a.score || String(a.rec.item).localeCompare(String(b.rec.item)))
      .slice(0, 500)
      .map(x=>x.rec);
    renderRows(rows);
  }

  async function init(){
    applyLang();
    $('#btn-en').addEventListener('click', async ()=>{
      state.lang='en'; localStorage.setItem('lang','en'); applyLang();
      if(!state.db.en) await loadDB('en'); onInput();
    });
    $('#btn-no').addEventListener('click', async ()=>{
      state.lang='no'; localStorage.setItem('lang','no'); applyLang();
      if(!state.db.no) await loadDB('no'); onInput();
    });
    $('#clear').addEventListener('click', ()=>{ $('#q').value=''; $('#q').focus(); onInput(); });
    $('#q').addEventListener('input', onInput);
    await loadDB(state.lang);
    onInput();
    $('#q').focus();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
