/* =========================================================
   第4章 生物體的協調作用 — 共用程式
   每個頁面：<body data-page="home" data-root="./">（games/ 內的頁面 data-root="../"）
   帳號與雲端同步由總入口的 account.js 負責（data-chapter="ch4" data-prefix="ch4."）
   ========================================================= */
(function(){
  'use strict';

  var PORTAL_URL = 'https://batyunching.github.io/bio/';
  var CH3_URL = 'https://batyunching.github.io/bio-ch3/';

  /* ---------- 單元與概念卡（19 張）：首頁神經網路地圖、進度條、錯題分析共用 ---------- */
  var UNIT_NAMES = { '4-1':'神經系統', '4-2':'內分泌系統', '4-3':'植物的感應' };
  var UNIT_PAGES = { '4-1':'unit4-1.html', '4-2':'unit4-2.html', '4-3':'unit4-3.html' };
  var CONCEPTS = [
    { id:'4-1-c1', unit:'4-1', t:'刺激與反應' },
    { id:'4-1-c2', unit:'4-1', t:'神經元' },
    { id:'4-1-c3', unit:'4-1', t:'神經系統組成' },
    { id:'4-1-c4', unit:'4-1', t:'中樞神經功能' },
    { id:'4-1-c5', unit:'4-1', t:'神經傳導途徑' },
    { id:'4-1-c6', unit:'4-1', t:'意識反應' },
    { id:'4-1-c7', unit:'4-1', t:'反射' },
    { id:'4-2-c1', unit:'4-2', t:'內分泌腺與激素' },
    { id:'4-2-c2', unit:'4-2', t:'神經 vs 內分泌' },
    { id:'4-2-c3', unit:'4-2', t:'腦垂腺' },
    { id:'4-2-c4', unit:'4-2', t:'甲狀腺・副甲狀腺' },
    { id:'4-2-c5', unit:'4-2', t:'腎上腺' },
    { id:'4-2-c6', unit:'4-2', t:'胰島與血糖' },
    { id:'4-2-c7', unit:'4-2', t:'性腺' },
    { id:'4-3-c1', unit:'4-3', t:'膨壓與氣孔' },
    { id:'4-3-c2', unit:'4-3', t:'觸發運動' },
    { id:'4-3-c3', unit:'4-3', t:'捕蟲・睡眠運動' },
    { id:'4-3-c4', unit:'4-3', t:'莖的向性' },
    { id:'4-3-c5', unit:'4-3', t:'根的向性' }
  ];
  var CONCEPT_CARDS = {};
  CONCEPTS.forEach(function(c){ (CONCEPT_CARDS[c.unit] = CONCEPT_CARDS[c.unit] || []).push(c.id); });

  /* ---------- localStorage（全部包 try/catch；account.js 會把 ch4. 開頭的資料同步到雲端） ---------- */
  var PREFIX = 'ch4.';
  var store = {
    get: function(key, fallback){
      try{ var v = localStorage.getItem(PREFIX + key); return v === null ? fallback : JSON.parse(v); }
      catch(e){ return fallback; }
    },
    set: function(key, val){
      try{ localStorage.setItem(PREFIX + key, JSON.stringify(val)); return true; }
      catch(e){ return false; }
    },
    remove: function(key){ try{ localStorage.removeItem(PREFIX + key); }catch(e){} }
  };

  /* ---------- 學習進度 ----------
     understood：概念卡按「我懂了」→ 神經元微亮
     mastery   ：{ 概念id: {n:作答數, ok:答對數} }（第4階段練習題寫入）→ 答對率 ≥ 80% 且至少 3 題 → 全亮 */
  var progress = {
    done: function(){ return store.get('understood', []); },
    mark: function(id, on){
      var list = progress.done().filter(function(x){ return x !== id; });
      if(on !== false) list.push(id);
      store.set('understood', list);
    },
    isDone: function(id){ return progress.done().indexOf(id) >= 0; },
    mastered: function(id){
      var m = store.get('mastery', {})[id];
      return !!(m && m.n >= 3 && m.ok / m.n >= 0.8);
    },
    level: function(id){ return progress.mastered(id) ? 2 : (progress.isDone(id) ? 1 : 0); },
    unit: function(u){
      var all = CONCEPT_CARDS[u] || [], d = progress.done();
      var n = all.filter(function(id){ return d.indexOf(id) >= 0; }).length;
      return { done:n, total:all.length };
    },
    total: function(){
      var t = 0, n = 0;
      Object.keys(CONCEPT_CARDS).forEach(function(u){ var p = progress.unit(u); t += p.total; n += p.done; });
      return { done:n, total:t };
    }
  };

  /* ---------- 作答紀錄：精熟度（mastery）＋作答明細（answers，給錯題概念分析和老師熱圖） ---------- */
  function record(conceptId, correct, myth, qid, src){
    var m = store.get('mastery', {});
    var r = m[conceptId] || { n:0, ok:0 };
    r.n++; if(correct) r.ok++;
    m[conceptId] = r; store.set('mastery', m);
    var a = store.get('answers', []);
    a.push({ q: qid || '', c: conceptId, ok: correct ? 1 : 0, m: (!correct && myth) ? myth : '', s: src || '', t: Date.now() });
    if(a.length > 600) a = a.slice(a.length - 600);
    store.set('answers', a);
  }

  /* ---------- 題庫：★ 基礎＝概念卡自我檢核題，★★／★★★＝data/questions.js ---------- */
  function bank(){
    var out = [];
    if(window.SELFCHECK) Object.keys(SELFCHECK).forEach(function(c){
      SELFCHECK[c].forEach(function(q, i){ out.push({ id: c + '-s' + i, c: c, u: c.slice(0, 3), lv: 1, q: q.q, o: q.o, a: q.a, e: q.e, m: q.m || {} }); });
    });
    (window.EXTRA_QUESTIONS || []).forEach(function(q){ out.push({ id: q.id, c: q.c, u: q.c.slice(0, 3), lv: q.lv, q: q.q, o: q.o, a: q.a, e: q.e, m: q.m || {} }); });
    return out;
  }

  /* ---------- 錯題本 ---------- */
  var wrongBook = {
    list: function(){ return store.get('wrongbook', []); },
    add: function(id){ var l = wrongBook.list(); if(l.indexOf(id) < 0){ l.push(id); store.set('wrongbook', l); } },
    remove: function(id){ store.set('wrongbook', wrongBook.list().filter(function(x){ return x !== id; })); },
    clear: function(){ store.set('wrongbook', []); }
  };

  /* ---------- ⚡ 訊號能量 ---------- */
  var energy = {
    get: function(){ return store.get('energy', 0); },
    add: function(n, why){
      var v = energy.get() + (n || 0); store.set('energy', v);
      var el = document.getElementById('energyVal');
      if(el){ el.textContent = v.toLocaleString(); var box = el.parentNode; box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump'); }
      if(why) toast('⚡ +' + n + '　' + why);
      return v;
    }
  };

  /* ---------- 原創 SVG 圖示 ---------- */
  var icons = {
    // 網站 logo：神經元＋訊號
    logo: function(){
      return '<svg viewBox="0 0 40 40" aria-hidden="true">' +
        '<circle cx="20" cy="20" r="18" fill="#0B1022" stroke="#22D3EE" stroke-width="1.5"/>' +
        '<g stroke="#22D3EE" stroke-width="2" stroke-linecap="round" fill="none">' +
          '<path d="M16 18 L8 11"/><path d="M15 22 L7 25"/><path d="M19 15 L18 7"/>' +
          '<path d="M24 22 Q28 26 33 28"/></g>' +
        '<circle cx="19" cy="20" r="5.5" fill="#22D3EE"/><circle cx="19" cy="20" r="2.2" fill="#0B1022"/>' +
        '<circle cx="33" cy="28" r="2.2" fill="#F472B6"/><circle cx="8" cy="11" r="1.6" fill="#A3E635"/>' +
        '</svg>';
    },
    // 4-1 大腦
    brain: function(size){
      size = size || 72;
      return '<svg viewBox="0 0 80 80" width="'+size+'" height="'+size+'" aria-hidden="true">' +
        '<path d="M40 14 C30 8 16 12 14 24 C6 28 6 42 13 47 C12 58 24 64 32 60 C35 66 46 66 48 60 C58 64 68 56 66 46 C74 40 72 26 64 23 C62 12 48 8 40 14Z" fill="none" stroke="currentColor" stroke-width="3"/>' +
        '<path d="M40 16 V58 M26 26 q8 4 6 12 M54 26 q-8 4 -6 12 M22 44 q8 -2 12 4 M58 44 q-8 -2 -12 4" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M40 60 V74" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
        '</svg>';
    },
    // 4-2 腺體與激素
    gland: function(size){
      size = size || 72;
      return '<svg viewBox="0 0 80 80" width="'+size+'" height="'+size+'" aria-hidden="true">' +
        '<path d="M14 40 C14 22 30 14 40 26 C50 14 66 22 66 40 C66 52 54 56 40 50 C26 56 14 52 14 40Z" fill="none" stroke="currentColor" stroke-width="3"/>' +
        '<circle cx="40" cy="38" r="5" fill="currentColor"/>' +
        '<g fill="currentColor"><circle cx="24" cy="66" r="4"/><circle cx="40" cy="70" r="3"/><circle cx="56" cy="64" r="4.5"/></g>' +
        '<path d="M8 62 Q40 54 72 62" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="3 4"/>' +
        '</svg>';
    },
    // 4-3 含羞草
    plant: function(size){
      size = size || 72;
      return '<svg viewBox="0 0 80 80" width="'+size+'" height="'+size+'" aria-hidden="true">' +
        '<path d="M40 74 V30 Q40 18 52 12" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<g fill="currentColor"><ellipse cx="30" cy="44" rx="9" ry="4" transform="rotate(-25 30 44)"/><ellipse cx="50" cy="40" rx="9" ry="4" transform="rotate(25 50 40)"/>' +
        '<ellipse cx="31" cy="58" rx="9" ry="4" transform="rotate(-20 31 58)"/><ellipse cx="49" cy="54" rx="9" ry="4" transform="rotate(20 49 54)"/></g>' +
        '<circle cx="62" cy="14" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/>' +
        '<path d="M62 2 v4 M74 14 h-4 M70.5 5.5 l-2.8 2.8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
        '</svg>';
    }
  };

  /* ---------- 導覽列 ---------- */
  var NAV = [
    { page:'home',     href:'index.html',       label:'首頁' },
    { page:'4-1',      href:'unit4-1.html',     label:'4-1 神經', unit:'4-1' },
    { page:'4-2',      href:'unit4-2.html',     label:'4-2 內分泌', unit:'4-2' },
    { page:'4-3',      href:'unit4-3.html',     label:'4-3 植物感應', unit:'4-3' },
    { page:'lab',      href:'lab.html',         label:'實驗' },
    { page:'quiz',     href:'quiz.html',        label:'練習' },
    { page:'analysis', href:'analysis.html',    label:'錯題分析' },
    { page:'mindmap',  href:'mindmap.html',     label:'心智圖' },
    { page:'games',    href:'games/index.html', label:'遊戲' },
    { page:'explore',  href:'explore.html',     label:'漫遊' }
  ];

  function buildNav(){
    var body = document.body;
    var root = body.getAttribute('data-root') || './';
    var current = body.getAttribute('data-page') || '';
    var nav = document.createElement('nav');
    nav.className = 'topnav';
    nav.setAttribute('aria-label', '主選單');
    var links = NAV.map(function(n){
      return '<a href="'+root+n.href+'"'+(n.unit?' data-unit="'+n.unit+'"':'')+(n.page===current?' class="active" aria-current="page"':'')+'>'+n.label+'</a>';
    }).join('');
    nav.innerHTML =
      '<a class="brand" href="'+root+'index.html">'+icons.logo()+'<span><small>NEURO COMMAND</small>第4章 生物體的協調作用</span></a>' +
      '<button class="icon-btn hamburger" aria-label="開啟選單" aria-expanded="false">☰</button>' +
      '<div class="links">'+links+'</div>' +
      '<div class="tools">' +
        '<span class="energy" title="訊號能量：看概念卡、答對題目、完成實驗都會增加">⚡ <span id="energyVal">'+energy.get().toLocaleString()+'</span></span>' +
        '<button class="icon-btn" id="btnProjector" title="投影模式（淺色底、字體放大）" aria-pressed="false">☀</button>' +
        '<button class="icon-btn" id="btnMotion" title="減少動態" aria-pressed="false">🐢</button>' +
      '</div>';
    body.insertBefore(nav, body.firstChild);

    var ham = nav.querySelector('.hamburger');
    ham.addEventListener('click', function(){
      var open = nav.classList.toggle('open');
      ham.setAttribute('aria-expanded', open ? 'true' : 'false');
      ham.textContent = open ? '✕' : '☰';
    });

    var bp = nav.querySelector('#btnProjector'), bm = nav.querySelector('#btnMotion');
    function sync(){
      bp.setAttribute('aria-pressed', document.documentElement.classList.contains('projector'));
      bm.setAttribute('aria-pressed', document.documentElement.classList.contains('reduce-motion'));
    }
    bp.addEventListener('click', function(){
      var on = document.documentElement.classList.toggle('projector');
      store.set('projector', on); sync();
      toast(on ? '☀ 投影模式：淺色底、字體放大' : '🌙 已回到平板深色模式');
      document.dispatchEvent(new CustomEvent('ch4:theme'));
    });
    bm.addEventListener('click', function(){
      var on = document.documentElement.classList.toggle('reduce-motion');
      store.set('reduceMotion', on); sync();
      toast(on ? '已減少動態效果' : '已恢復動態效果');
    });
    sync();
    // 老師帳號：選單多一個「老師模式」
    if(window.BIO_ACCOUNT && BIO_ACCOUNT.ready) BIO_ACCOUNT.ready.then(function(){
      if(!BIO_ACCOUNT.isTeacher) return;
      var a = document.createElement('a'); a.href = root + 'teacher.html'; a.textContent = '👩‍🏫 老師';
      if(current === 'teacher'){ a.className = 'active'; a.setAttribute('aria-current', 'page'); }
      nav.querySelector('.links').appendChild(a);
    }, function(){});
  }

  // 盡早套用顯示設定，避免閃爍
  if(store.get('projector', false)) document.documentElement.classList.add('projector');
  if(store.get('reduceMotion', false)) document.documentElement.classList.add('reduce-motion');

  /* ---------- 小工具 ---------- */
  var toastTimer;
  function toast(msg){
    var t = document.querySelector('.toast');
    if(!t){ t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role','status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function(){ t.classList.remove('show'); }, 2400);
  }
  function shuffle(arr){
    var a = arr.slice();
    for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function unitClass(u){ return 'unit-' + String(u).replace('-', ''); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  document.addEventListener('DOMContentLoaded', buildNav);

  window.CH4 = {
    PORTAL_URL: PORTAL_URL, CH3_URL: CH3_URL,
    UNIT_NAMES: UNIT_NAMES, UNIT_PAGES: UNIT_PAGES, CONCEPTS: CONCEPTS, CONCEPT_CARDS: CONCEPT_CARDS,
    store: store, progress: progress, wrongBook: wrongBook, record: record, bank: bank, energy: energy, icons: icons,
    toast: toast, shuffle: shuffle, unitClass: unitClass, esc: esc
  };
})();
