// ===== KONFIG DEFAULT =====
  let VERCEL_TOKEN = 'vcp_6S4aezd4agpPsogoaF6wPsIkEXCfj7AYtz6dQfv9DwbRucCNI92nTGzv';
  const CHANNEL = 'https://whatsapp.com/channel/0029VbDGtCEDzgT8iNvBqB0V';

  // ===== ELEMEN =====
  const fileInput   = document.getElementById('fileInput');
  const fileName    = document.getElementById('fileName');
  const fileIcon    = document.getElementById('fileIcon');
  const codeInput   = document.getElementById('codeInput');
  const projectName = document.getElementById('projectName');
  const deployBtn   = document.getElementById('deployBtn');
  const logPanel    = document.getElementById('logPanel');
  const logEl       = document.getElementById('log');
  const result      = document.getElementById('result');
  const progressFill= document.getElementById('progressFill');

  let currentFileContent = '';

  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // ===== SVG ICONS =====
  const ICON = {
    file: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
    check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    rocket: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"></path><path d="M5 12l7-7 7 7"></path></svg>',
    globe: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
    copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
    trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    external: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>'
  };

  // ===== SETTINGS =====
  const SKEY = 'deployhtml_settings_v1';
  const defaultSettings = { autoClean: false };
  let settings = { ...defaultSettings };

  function loadSettings(){
    try{
      const saved = JSON.parse(localStorage.getItem(SKEY));
      if(saved) settings = { ...defaultSettings, ...saved };
    }catch(_){}
    // Load token
    const savedToken = localStorage.getItem('deployhtml_token');
    if(savedToken) VERCEL_TOKEN = savedToken;
    syncSettingsUI();
  }
  function saveSettingsToStorage(){
    try{ localStorage.setItem(SKEY, JSON.stringify(settings)); }catch(_){}
  }
  function syncSettingsUI(){
    const setAutoClean = document.getElementById('setAutoClean');
    const setToken = document.getElementById('setToken');
    if(setAutoClean) setAutoClean.checked = settings.autoClean;
    if(setToken) setToken.value = VERCEL_TOKEN;
  }

  // ===== FILE HANDLER =====
  fileInput.addEventListener('change', (e) => {
    const f = e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      currentFileContent = reader.result;
      codeInput.value = currentFileContent;
      fileName.textContent = f.name + ' (' + (f.size / 1024).toFixed(1) + ' KB)';
      fileIcon.outerHTML = ICON.check;
      fileName.style.color = 'var(--white)';
    };
    reader.readAsText(f);
  });

  // Auto-fill project name from file name
  fileInput.addEventListener('change', (e) => {
    const f = e.target.files[0];
    if(f && !projectName.value.trim()){
      let suggested = f.name.replace(/\.(html?|htm)$/i, '')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      if(suggested.length >= 3){
        projectName.value = suggested;
      }
    }
  });

  // ===== LOG HELPER =====
  function log(msg, cls){
    logPanel.hidden = false;
    const line = document.createElement('div');
    if(cls) line.className = cls;
    line.textContent = msg;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function setProgress(pct){
    progressFill.style.width = pct + '%';
  }

  function showError(title, text, hint){
    result.hidden = false;
    result.className = 'result error';
    result.innerHTML =
      `<div class="panel-label" style="color:var(--warn);">${esc(title)}</div>
       <div class="err-text">${esc(text)}</div>
       ${hint ? `<div class="meta">${esc(hint)}</div>` : ''}`;
  }

  function showSuccess(url, projectSlug){
    result.hidden = false;
    result.className = 'result';
    result.innerHTML = `
      <div class="panel-label" style="color:var(--ok);">DEPLOY BERHASIL</div>
      <div style="margin-top:8px;">
        <div style="font-size:11px; color:var(--dim); letter-spacing:.12em; text-transform:uppercase; margin-bottom:6px;">Website URL</div>
        <div class="url-display" id="urlBox">${esc(url)}</div>
      </div>
      <div class="actions-row">
        <a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="accent">${ICON.globe} Buka Website</a>
        <button type="button" id="copyUrlBtn">${ICON.copy} Salin URL</button>
      </div>
      <div class="meta" style="margin-top:16px;">
        <span>Project: <b style="color:var(--white)">${esc(projectSlug)}</b></span>
        <span>Status: <b style="color:var(--ok)">LIVE</b></span>
      </div>
    `;

    document.getElementById('copyUrlBtn').addEventListener('click', async () => {
      const btn = document.getElementById('copyUrlBtn');
      try{
        await navigator.clipboard.writeText(url);
        btn.innerHTML = ICON.check + ' Tersalin!';
        setTimeout(() => btn.innerHTML = ICON.copy + ' Salin URL', 1500);
      }catch(_){
        btn.textContent = 'Gagal menyalin';
        setTimeout(() => btn.innerHTML = ICON.copy + ' Salin URL', 1500);
      }
    });
  }

  // ===== VALIDASI =====
  function validate(){
    const name = projectName.value.trim();
    const code = codeInput.value.trim();

    if(!name){
      showError('Nama project kosong', 'Isi nama project terlebih dahulu.', 'Contoh: portofolio-ku, landing-page, dll.');
      return null;
    }
    if(!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(name)){
      showError('Nama project tidak valid', 'Gunakan hanya huruf kecil, angka, dan tanda minus (-). Minimal 3 karakter.', 'Contoh: portofolio-ku, my-site-123');
      return null;
    }
    if(!code){
      showError('Kode HTML kosong', 'Upload file .html atau tempel kode HTML di kolom yang tersedia.');
      return null;
    }
    if(!code.toLowerCase().includes('<html') && !code.toLowerCase().includes('<!doctype')){
      showError('Bukan HTML valid', 'Kode yang dimasukkan sepertinya bukan HTML lengkap.', 'Pastikan ada tag <html> atau <!DOCTYPE html>');
      return null;
    }
    return { name, code };
  }

  // ===== DEPLOY =====
  async function deploy(){
    logEl.innerHTML = '';
    logPanel.hidden = true;
    result.hidden = true;
    setProgress(0);

    const v = validate();
    if(!v) return;

    if(!VERCEL_TOKEN || VERCEL_TOKEN.includes('vcp_....') || VERCEL_TOKEN === ''){
      showError('Token belum diisi', 'Buka menu Settings di kiri atas dan isi Vercel API Token kamu.', 'Dapatkan token di: vercel.com/account/tokens');
      return;
    }

    deployBtn.disabled = true;
    deployBtn.innerHTML = '<span class="loader"></span>Deploying...';

    try{
      log('Mengirim ke Vercel API...', 'dim');
      setProgress(15);

      const res = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + VERCEL_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: v.name,
          target: 'production',
          files: [{ file: 'index.html', data: v.code }],
          projectSettings: { framework: null }
        })
      });

      const data = await res.json();

      if(!res.ok){
        const errMsg = data.error ? (data.error.message || JSON.stringify(data.error)) : JSON.stringify(data);
        throw new Error('Vercel API error: ' + errMsg);
      }

      log('Deployment dibuat: ' + data.id, 'ok');
      log('Menunggu build selesai...', 'dim');
      setProgress(35);

      let ready = false;
      let deployUrl = data.url;
      let shortAlias = null;

      for(let i = 0; i < 40 && !ready; i++){
        await new Promise(r => setTimeout(r, 2000));

        const chk = await fetch('https://api.vercel.com/v13/deployments/' + data.id, {
          headers: { 'Authorization': 'Bearer ' + VERCEL_TOKEN }
        });
        const cd = await chk.json();

        if(cd.readyState === 'READY'){
          ready = true;
          deployUrl = cd.url;
          if(cd.alias && cd.alias.length){
            shortAlias = cd.alias.find(a => a.endsWith('.vercel.app')) || cd.alias[0];
          }
          log('Build READY', 'ok');
          setProgress(80);
        } else if(cd.readyState === 'ERROR'){
          throw new Error('Build gagal di Vercel. Cek log di dashboard Vercel.');
        } else {
          log('status: ' + cd.readyState + ' (' + (i+1) + '/40)', 'dim');
          setProgress(35 + Math.min(40, i * 1.2));
        }
      }

      if(!ready){
        throw new Error('Timeout menunggu build. Cek dashboard Vercel untuk status.');
      }

      const finalUrl = 'https://' + (shortAlias || (v.name + '.vercel.app'));
      setProgress(100);
      log('Website live: ' + finalUrl, 'ok');

      showSuccess(finalUrl, v.name);
      addHistory(v.name, finalUrl);

    }catch(err){
      console.error(err);
      log('Gagal: ' + err.message, 'err');
      setProgress(0);
      showError('Deploy gagal', err.message || 'Terjadi kesalahan tak terduga.', 'Pastikan token Vercel valid dan koneksi internet stabil.');
    }finally{
      deployBtn.disabled = false;
      deployBtn.innerHTML = ICON.rocket + ' Deploy Sekarang';
    }
  }

  deployBtn.addEventListener('click', deploy);

  // ===== HISTORY =====
  const HKEY = 'deployhtml_history_v1';
  const hList = document.getElementById('hList');
  const hCount = document.getElementById('hCount');

  function loadHistory(){ try{ return JSON.parse(localStorage.getItem(HKEY)) || []; }catch(_){ return []; } }
  function saveHistory(l){ try{ localStorage.setItem(HKEY, JSON.stringify(l)); }catch(_){} }
  function fmtDate(ts){
    return new Intl.DateTimeFormat('id-ID', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(ts));
  }
  function addHistory(name, url){
    let l = loadHistory();
    l.unshift({ id: Date.now() + Math.random(), name, url, ts: Date.now() });
    if(settings.autoClean) l = l.slice(0, 20);
    else l = l.slice(0, 50);
    saveHistory(l);
    renderHistory();
  }
  function el(tag, cls, text){
    const e = document.createElement(tag);
    if(cls) e.className = cls;
    if(text !== undefined) e.textContent = text;
    return e;
  }
  function renderHistory(){
    const l = loadHistory();
    hCount.textContent = l.length + ' riwayat';
    hList.innerHTML = '';
    if(!l.length){
      hList.appendChild(el('div', 'empty', 'Belum ada riwayat deploy. Hasil deploy kamu bakal muncul di sini.'));
      return;
    }
    l.forEach(it => {
      const card = el('div', 'h-item');
      card.appendChild(el('div', 'h-date', fmtDate(it.ts)));
      card.appendChild(el('div', 'h-k', 'PROJECT'));
      card.appendChild(el('div', 'h-v', it.name));
      card.appendChild(el('div', 'h-k', 'URL'));
      card.appendChild(el('div', 'h-v res', it.url));
      const act = el('div', 'h-act');
      const open = el('a', '', '');
      open.href = it.url; open.target = '_blank'; open.rel = 'noopener noreferrer';
      open.innerHTML = ICON.external + ' Buka';
      act.appendChild(open);
      const cp = el('button', '', '');
      cp.type = 'button';
      cp.innerHTML = ICON.copy + ' Salin';
      cp.addEventListener('click', async () => {
        try{ await navigator.clipboard.writeText(it.url); cp.innerHTML = ICON.check + ' Tersalin'; }
        catch(_){ cp.textContent = 'Gagal'; }
        setTimeout(() => cp.innerHTML = ICON.copy + ' Salin', 1400);
      });
      act.appendChild(cp);
      const del = el('button', 'del', '');
      del.type = 'button';
      del.innerHTML = ICON.trash + ' Hapus';
      del.addEventListener('click', () => {
        saveHistory(loadHistory().filter(x => x.id !== it.id));
        renderHistory();
      });
      act.appendChild(del);
      card.appendChild(act);
      hList.appendChild(card);
    });
  }
  document.getElementById('clearAll').addEventListener('click', () => {
    if(loadHistory().length && confirm('Hapus semua riwayat?')){ saveHistory([]); renderHistory(); }
  });

  // ===== DRAWER =====
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('overlay');
  function openDrawer(){ drawer.classList.add('open'); overlay.classList.add('show'); renderHistory(); syncSettingsUI(); }
  function closeDrawer(){ drawer.classList.remove('open'); overlay.classList.remove('show'); }
  document.getElementById('menuBtn').addEventListener('click', openDrawer);
  document.getElementById('drawerClose').addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
    document.getElementById('tabHistory').hidden = t.dataset.tab !== 'history';
    document.getElementById('tabGuide').hidden = t.dataset.tab !== 'guide';
    document.getElementById('tabSettings').hidden = t.dataset.tab !== 'settings';
  }));

  // Settings actions
  document.getElementById('setSave').addEventListener('click', () => {
    settings.autoClean = document.getElementById('setAutoClean').checked;
    const newToken = document.getElementById('setToken').value.trim();
    if(newToken) {
      VERCEL_TOKEN = newToken;
      localStorage.setItem('deployhtml_token', newToken);
    }
    saveSettingsToStorage();
    const btnSave = document.getElementById('setSave');
    btnSave.textContent = 'Tersimpan';
    setTimeout(() => btnSave.textContent = 'Simpan', 1400);
    if(settings.autoClean){
      saveHistory(loadHistory().slice(0, 20));
      renderHistory();
    }
  });
  document.getElementById('setReset').addEventListener('click', () => {
    settings = { ...defaultSettings };
    saveSettingsToStorage();
    localStorage.removeItem('deployhtml_token');
    VERCEL_TOKEN = 'vcp_6S4aezd4agpPsogoaF6wPsIkEXCfj7AYtz6dQfv9DwbRucCNI92nTGzv';
    syncSettingsUI();
    const btnReset = document.getElementById('setReset');
    btnReset.textContent = 'Direset';
    setTimeout(() => btnReset.textContent = 'Reset', 1400);
  });

  // ===== MODAL JOIN SALURAN =====
  const modal = document.getElementById('modal');
  const MODAL_SEEN = 'deployhtml_modal_seen_v1';

  function openModal(){
    modal.hidden = false;
  }
  function closeModal(){
    modal.hidden = true;
    try{ localStorage.setItem(MODAL_SEEN, '1'); }catch(_){}
  }
  document.getElementById('mClose').addEventListener('click', closeModal);
  document.getElementById('mJoin').addEventListener('click', () => {
    window.open(CHANNEL, '_blank', 'noopener,noreferrer');
    closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){ closeModal(); closeDrawer(); }
  });

  // ===== INIT =====
  loadSettings();
  renderHistory();

  // Tampilkan modal saat pertama kali buka web
  try{
    if(!localStorage.getItem(MODAL_SEEN)){
      setTimeout(openModal, 600);
    }
  }catch(_){
    setTimeout(openModal, 600);
  }
