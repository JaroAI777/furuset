(() => {
  const $ = (s) => document.querySelector(s);

  // ── UI teksty
  const L10N = {
    en: {
      subtitle: 'Type a name in English. Results come from a static JSON file (client-side only).',
      placeholder: 'Search... (e.g., "multimeter", "alarm clock", "knife")',
      thTitle: 'Title', thItem: 'Item', thLocation: 'Location',
      status: (lang) => `Source: furusetalle9.oslo.no • DB: db/inventory.${lang}.json • No tracking • client-side only`
    },
    no: {
      subtitle: 'Skriv et navn på norsk. Resultater kommer fra en statisk JSON-fil (kun i nettleseren).',
      placeholder: 'Søk... (f.eks. "multimeter", "vekkerklokke", "kniv")',
      thTitle: 'Tittel', thItem: 'Gjenstand', thLocation: 'Plassering',
      status: (lang) => `Kilde: furusetalle9.oslo.no • DB: db/inventory.${lang}.json • Ingen sporing • kun klient`
    }
  };

  // ── Synonimy funkcjonalne (NO/EN) – proste rozszerzenia zapytań
  const SYN = {
    en: {
      multimeter: ['multimeter','voltmeter','ammeter','tester','test meter'],
      voltmeter: ['voltmeter','multimeter','tester'],
      ammeter: ['ammeter','multimeter','tester'],
      scissors: ['scissors','knife','box cutter','utility knife','tapetkniv','saks'],
      knife: ['knife','box cutter','utility knife','tapetkniv','saks','scissors'],
      tape: ['tape','duct tape','pvc tape','teflon tape','aluminium tape','teip','teflontape','pvc-tape','aluminiumstape'],
      glue: ['glue','adhesive','contact glue','epoxy','lim','kontaktlim','epoxy'],
      saw: ['saw','coping saw','hacksaw','sag','metallsag'],
      alarm: ['alarm','alarm clock','vekkerklokke','clock'],
      clock: ['clock','alarm clock','vekkerklokke']
    },
    no: {
      multimeter: ['multimeter','voltmeter','ammeter','måleinstrument','tester'],
      voltmeter: ['voltmeter','multimeter','tester'],
      ammeter: ['ammeter','multimeter','tester'],
      saks: ['saks','kniv','tapetkniv','box cutter','scissors'],
      kniv: ['kniv','tapetkniv','box cutter','saks','scissors'],
      teip: ['teip','tape','teflontape','pvc-tape','aluminiumstape'],
      lim: ['lim','kontaktlim','epoxy','limpistol','glue'],
      sag: ['sag','metallsag','copingsag','håndsag','saw'],
      vekkerklokke: ['vekkerklokke','alarm','alarmklokke','clock']
    }
  };

  // ── stan
  let lang = (localStorage.getItem('furuset_lang') || 'en');
  const state = { db: [], lang };

  // ── narzędzia
  const normalize = (s='') => s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const tokenize  = (s='') => normalize(s).split(/\s+/).filter(Boolean);
  const escapeHtml = (s='') => s.replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

  function applyL10n() {
    const t = L10N[state.lang];
    $('#subtitle').innerHTML = t.subtitle;
    const q = $('#q'); q.placeholder = t.placeholder;
    $('#th-title').textContent = t.thTitle;
    $('#th-item').textContent = t.thItem;
    $('#th-location').textContent = t.thLocation;
    $('#status').textContent = t.status(state.lang);
    document.documentElement.setAttribute('data-lang', state.lang);
  }

  function dbUrl() { return `db/inventory.${state.lang}.json?v=${Date.now()}`; }

  async function loadDB() {
    const url = dbUrl();
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const data = await res.json();
    state.db = Array.isArray(data) ? data : [];
    update();
  }

  // Rozszerz zapytanie o synonimy: AND po słowach, OR po synonimach danego słowa
  function expandQuery(q) {
    const toks = tokenize(q);
    const dict = SYN[state.lang] || {};
    return toks.map(t => {
      const set = new Set([t]);
      for (const [k, arr] of Object.entries(dict)) {
        if (k === t || arr.includes(t)) { arr.forEach(x => set.add(normalize(x))); set.add(normalize(k)); }
      }
      return Array.from(set);
    });
  }

  function recordMatches(rec, expansions) {
    const hay = normalize(`${rec.item||''} ${rec.box_title||''} ${rec.location||''}`);
    return expansions.every(group => group.some(term => hay.includes(term)));
  }

  function renderRows(rows) {
    const tb = $('#tbody'); tb.innerHTML = '';
    if (!rows.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="3" class="empty">—</td>`;
      tb.appendChild(tr); return;
    }
    for (const r of rows) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        `<td class="box">${escapeHtml(r.box_title||'')}</td>
         <td class="item">${escapeHtml(r.item||'')}</td>
         <td class="loc">${escapeHtml(r.location||'')}</td>`;
      tb.appendChild(tr);
    }
  }

  function update() {
    const q = $('#q').value.trim();
    const data = state.db || [];
    if (!q) { renderRows(data.slice(0,200)); return; }
    const expanded = expandQuery(q);
    const result = data.filter(r => recordMatches(r, expanded)).slice(0,200);
    renderRows(result);
  }

  // ── UI
  $('#flag-en').addEventListener('click', () => { state.lang='en'; localStorage.setItem('furuset_lang','en'); applyL10n(); loadDB().catch(console.error); });
  $('#flag-no').addEventListener('click', () => { state.lang='no'; localStorage.setItem('furuset_lang','no'); applyL10n(); loadDB().catch(console.error); });
  $('#q').addEventListener('input', update);
  $('#btn-clear').addEventListener('click', ()=>{ $('#q').value=''; update(); });

  // start
  applyL10n();
  loadDB().catch(console.error);
})();
