/* =========================================================
   單元頁共用：翻面概念卡、我懂了 ✓、單元進度、快問快答、排序、分段按鈕
   概念卡 HTML：<div class="concept" id="4-1-c1" data-id="4-1-c1">…</div>
   ========================================================= */
(function(){
  'use strict';
  function unitOf(id){ return id.slice(0,3); }
  function refreshMini(){
    var el = document.querySelector('[data-unit-progress]'); if(!el) return;
    var p = CH4.progress.unit(el.getAttribute('data-unit-progress'));
    el.querySelector('span').style.width = (p.total ? p.done / p.total * 100 : 0) + '%';
    var t = document.querySelector('[data-unit-progress-text]'); if(t) t.textContent = p.done + ' / ' + p.total;
  }
  function initCards(){
    document.querySelectorAll('.concept').forEach(function(card){
      var id = card.getAttribute('data-id');
      var btn = card.querySelector('.got');
      card.setAttribute('tabindex','0'); card.setAttribute('role','button');
      card.setAttribute('aria-label', (card.querySelector('.front h3')||{}).textContent + '（點擊翻面）');
      function paint(){
        var on = CH4.progress.isDone(id);
        card.classList.toggle('done', on);
        if(btn){ btn.setAttribute('aria-pressed', on); btn.textContent = on ? '✓ 已通過檢核' : (hasCheck() ? '📝 我懂了？檢核 3 題' : '我懂了？'); }
      }
      function hasCheck(){ return !!(window.SELFCHECK && SELFCHECK[id] && SELFCHECK[id].length >= 3); }
      function pass(){
        CH4.progress.mark(id, true); paint(); refreshMini();
        var p = CH4.progress.unit(unitOf(id));
        var once = CH4.store.get('gotOnce', []);
        if(once.indexOf(id) < 0){ once.push(id); CH4.store.set('gotOnce', once); CH4.energy.add(5); }
        CH4.toast(p.done === p.total ? '🎉 這個單元的神經元全部連線！' : '🧠 神經元連線：' + p.done + ' / ' + p.total);
      }
      card.addEventListener('click', function(e){
        if(e.target.closest('.got, button, a')) return;
        card.classList.toggle('flipped');
      });
      card.addEventListener('keydown', function(e){
        if((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.got')){ e.preventDefault(); card.classList.toggle('flipped'); }
      });
      if(btn) btn.addEventListener('click', function(e){
        e.stopPropagation();
        if(!hasCheck()){ // 沒有檢核題的卡：維持原本切換
          if(CH4.progress.isDone(id)){ CH4.progress.mark(id, false); paint(); refreshMini(); } else pass();
          return;
        }
        openCheck(id, (card.querySelector('.front h3') || {}).textContent || '', function(){ if(!CH4.progress.isDone(id)) pass(); }, function(){ card.classList.add('flipped'); card.focus(); });
      });
      card._paint = paint;
      paint();
    });
    var all = document.getElementById('flipAll');
    if(all) all.addEventListener('click', function(){
      var cards = document.querySelectorAll('.concept');
      var anyFront = Array.prototype.some.call(cards, function(c){ return !c.classList.contains('flipped'); });
      cards.forEach(function(c){ c.classList.toggle('flipped', anyFront); });
      all.textContent = anyFront ? '全部翻回正面' : '全部翻到說明面';
    });
    // 從首頁神經網路點進來：自動捲到並翻開那張卡
    var h = decodeURIComponent(location.hash.slice(1));
    if(h){
      var target = document.getElementById(h);
      if(target && target.classList.contains('concept')){
        setTimeout(function(){ target.scrollIntoView({ block:'center', behavior: reduced() ? 'auto' : 'smooth' }); target.classList.add('flipped'); }, 350);
      }
    }
    refreshMini();
    if(window.BIO_ACCOUNT && BIO_ACCOUNT.ready) BIO_ACCOUNT.ready.then(function(){ setTimeout(function(){
      refreshMini();
      document.querySelectorAll('.concept').forEach(function(c){ if(c._paint) c._paint(); });
    }, 300); }, function(){});
  }

  /* ---------- 概念卡自我檢核：隨機 3 題，全對才算「我懂了」 ---------- */
  var dlg = null;
  function openCheck(id, title, onPass, onReview){
    if(!dlg){
      dlg = document.createElement('div'); dlg.className = 'check-overlay'; dlg.hidden = true;
      dlg.innerHTML = '<div class="check-box" role="dialog" aria-modal="true" aria-labelledby="chkTitle"><button class="icon-btn check-x" aria-label="關閉">✕</button><div class="check-body"></div></div>';
      document.body.appendChild(dlg);
      dlg.querySelector('.check-x').addEventListener('click', close);
      dlg.addEventListener('click', function(e){ if(e.target === dlg) close(); });
      document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !dlg.hidden) close(); });
    }
    var body = dlg.querySelector('.check-body'), qs, i, score, results;
    var last = document.activeElement;
    function close(){ dlg.hidden = true; document.body.style.overflow = ''; if(last && last.focus) last.focus(); }
    function start(){ qs = CH4.shuffle(SELFCHECK[id]).slice(0, 3); i = 0; score = 0; results = []; render(); }
    function dots(){ return '<div class="check-dots">' + qs.map(function(q, k){ return '<span class="' + (k < results.length ? (results[k] ? 'ok' : 'ng') : (k === i ? 'cur' : '')) + '"></span>'; }).join('') + '</div>'; }
    function render(){
      if(i >= qs.length){
        var ok = score === qs.length;
        body.innerHTML = '<div class="check-kicker">SELF CHECK · ' + CH4.esc(title) + '</div>' + dots() +
          '<h3 id="chkTitle" class="check-result ' + (ok ? 'ok' : 'ng') + '">' + (ok ? '🎉 3 題全對，通過檢核！' : '答對 ' + score + ' / 3，還差一點點') + '</h3>' +
          '<p>' + (ok ? '這個神經元已經連線，首頁的神經網路會亮起來。' : '要 3 題全對才算真的懂了。回到卡片再看一次重點，再來挑戰！每次的題目都會不一樣。') + '</p>' +
          '<div class="check-nav">' + (ok ? '<button class="btn" data-act="close">完成 ✓</button>' : '<button class="btn ghost" data-act="review">📘 回卡片再看一次</button><button class="btn" data-act="again">↻ 再檢核一次</button>') + '</div>';
        if(ok) onPass();
        var b;
        if((b = body.querySelector('[data-act="close"]'))) { b.addEventListener('click', close); b.focus(); }
        if((b = body.querySelector('[data-act="again"]'))) { b.addEventListener('click', start); b.focus(); }
        if((b = body.querySelector('[data-act="review"]'))) b.addEventListener('click', function(){ close(); onReview(); });
        return;
      }
      var q = qs[i];
      var order = CH4.shuffle(q.o.map(function(t, k){ return k; }));
      body.innerHTML = '<div class="check-kicker">SELF CHECK · ' + CH4.esc(title) + '</div>' + dots() +
        '<h3 id="chkTitle" class="check-q">第 ' + (i + 1) + ' / 3 題　' + q.q + '</h3>' +
        '<div class="check-opts">' + order.map(function(k){ return '<button class="chip-btn" data-k="' + k + '">' + q.o[k] + '</button>'; }).join('') + '</div>' +
        '<div class="feedback" aria-live="polite"></div><div class="check-exp"></div>' +
        '<div class="check-nav"><button class="btn" data-act="next" hidden>' + (i === 2 ? '看結果 ▶' : '下一題 ▶') + '</button></div>';
      var answered = false;
      body.querySelectorAll('[data-k]').forEach(function(b){
        b.addEventListener('click', function(){
          if(answered) return; answered = true;
          var ok = Number(b.getAttribute('data-k')) === q.a;
          b.classList.add(ok ? 'ok' : 'ng');
          if(!ok) body.querySelector('[data-k="' + q.a + '"]').classList.add('ok');
          var fb = body.querySelector('.feedback');
          fb.className = 'feedback ' + (ok ? 'ok' : 'ng'); fb.textContent = ok ? '✓ 答對了！' : '✗ 答錯了，正確答案已標出。';
          body.querySelector('.check-exp').textContent = q.e;
          results.push(ok); if(ok) score++;
          record(id, ok);
          body.querySelector('.check-dots').outerHTML = dots();
          var nx = body.querySelector('[data-act="next"]'); nx.hidden = false; nx.focus();
          nx.addEventListener('click', function(){ i++; render(); });
        });
      });
      var first = body.querySelector('[data-k]'); if(first) first.focus();
    }
    dlg.className = 'check-overlay ' + CH4.unitClass(unitOf(id));
    dlg.hidden = false; document.body.style.overflow = 'hidden';
    start();
  }

  /* ---------- 練習紀錄（神經元精熟度）：每題答完呼叫 ---------- */
  function record(conceptId, correct){
    var m = CH4.store.get('mastery', {});
    var r = m[conceptId] || { n:0, ok:0 };
    r.n++; if(correct) r.ok++;
    m[conceptId] = r; CH4.store.set('mastery', m);
  }

  /* ---------- 快問快答：從題庫抽 n 題 ----------
     題目格式：{ c:'4-1-c4', q:'題目', o:['A','B','C','D'], a:2, e:'詳解' } */
  function quickQuiz(el, pool, n){
    var qs, i, score;
    function start(){ qs = CH4.shuffle(pool).slice(0, n || 3); i = 0; score = 0; render(); }
    function render(){
      if(i >= qs.length){
        el.innerHTML = '<p class="q">完成！答對 <span class="score">' + score + ' / ' + qs.length + '</span> 題</p>' +
          '<p class="exp">' + (score === qs.length ? '全對！神經訊號暢通無阻 ⚡' : '答錯的觀念，可以回到上面的概念卡再看一次。') + '</p>' +
          '<div class="nav"><button class="btn" data-act="again">再來 3 題 ↻</button><a class="btn ghost" href="quiz.html">去練習題區 ▶</a></div>';
        el.querySelector('[data-act="again"]').addEventListener('click', start);
        return;
      }
      var q = qs[i];
      var order = CH4.shuffle(q.o.map(function(t, k){ return k; }));
      el.innerHTML = '<p class="q">第 ' + (i + 1) + ' / ' + qs.length + ' 題　' + q.q + '</p>' +
        '<div class="opts">' + order.map(function(k){ return '<button class="chip-btn" data-k="' + k + '">' + q.o[k] + '</button>'; }).join('') + '</div>' +
        '<div class="feedback" aria-live="polite"></div><div class="exp"></div>' +
        '<div class="nav"><span class="score">⚡ ' + score + '</span><button class="btn" data-act="next" hidden>下一題 ▶</button></div>';
      var done = false;
      el.querySelectorAll('[data-k]').forEach(function(b){
        b.addEventListener('click', function(){
          if(done) return; done = true;
          var k = Number(b.getAttribute('data-k')), ok = k === q.a;
          b.classList.add(ok ? 'ok' : 'ng');
          if(!ok) el.querySelector('[data-k="' + q.a + '"]').classList.add('ok');
          var fb = el.querySelector('.feedback');
          fb.className = 'feedback ' + (ok ? 'ok' : 'ng');
          fb.textContent = ok ? '✓ 答對了！' : '✗ 再想想，正確答案已標出。';
          el.querySelector('.exp').textContent = q.e;
          record(q.c, ok);
          if(ok){ score++; CH4.energy.add(3); }
          var nx = el.querySelector('[data-act="next"]'); nx.hidden = false; nx.focus();
          nx.addEventListener('click', function(){ i++; render(); });
        });
      });
    }
    start();
  }

  /* ---------- 排序清單：ul.sortlist ----------
     三種操作都可以：
     1. 按住拖曳：可以一次拖過很多格，直接放到最上面或最下面（拖到畫面邊緣會自動捲動）
     2. 點一下選取，再點另一站：選取的那站直接移到那個位置
     3. ▲▼ 按鈕：一次移一格 */
  function sortable(ul, onChange){
    var picked = null;
    function changed(){ Array.prototype.forEach.call(ul.children, function(x){ x.classList.remove('ok','ng'); }); renum(); if(onChange) onChange(); }
    function renum(){ Array.prototype.forEach.call(ul.children, function(x, k){ var n = x.querySelector('.n'); if(n) n.textContent = k + 1; }); }
    function unpick(){ if(picked){ picked.classList.remove('picked'); picked = null; } }
    function bindLi(li){
      li.querySelectorAll('[data-mv]').forEach(function(btn){
        btn.addEventListener('click', function(e){
          e.stopPropagation(); unpick();
          if(btn.getAttribute('data-mv') === 'up' && li.previousElementSibling) ul.insertBefore(li, li.previousElementSibling);
          if(btn.getAttribute('data-mv') === 'down' && li.nextElementSibling) ul.insertBefore(li.nextElementSibling, li);
          changed();
        });
      });
      li.addEventListener('pointerdown', function(e){
        if(e.target.closest('button') || (e.pointerType === 'mouse' && e.button !== 0)) return;
        e.preventDefault();
        var y0 = e.clientY, dragging = false, scrollTimer = null, lastY = e.clientY;
        function place(y){
          var sibs = Array.prototype.filter.call(ul.children, function(x){ return x !== li; });
          for(var k = 0; k < sibs.length; k++){
            var r = sibs[k].getBoundingClientRect();
            if(y < r.top + r.height / 2){ if(sibs[k] !== li.nextElementSibling) ul.insertBefore(li, sibs[k]); return; }
          }
          if(ul.lastElementChild !== li) ul.appendChild(li);
        }
        function edgeScroll(){
          var d = lastY < 90 ? -14 : (lastY > window.innerHeight - 70 ? 14 : 0);
          if(d){ window.scrollBy(0, d); place(lastY); }
        }
        function move(ev){
          lastY = ev.clientY;
          if(!dragging && Math.abs(ev.clientY - y0) > 6){ dragging = true; unpick(); li.classList.add('dragging'); scrollTimer = setInterval(edgeScroll, 30); }
          if(dragging) place(ev.clientY);
        }
        function up(){
          document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
          clearInterval(scrollTimer);
          if(dragging){ li.classList.remove('dragging'); changed(); return; }
          // 點選模式
          if(!picked){ picked = li; li.classList.add('picked'); return; }
          if(picked === li){ unpick(); return; }
          var items = Array.prototype.slice.call(ul.children);
          var from = items.indexOf(picked), to = items.indexOf(li);
          if(from < to) ul.insertBefore(picked, li.nextElementSibling); else ul.insertBefore(picked, li);
          unpick(); changed();
        }
        document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
      });
    }
    Array.prototype.forEach.call(ul.children, bindLi);
    renum();
  }

  /* ---------- 分段按鈕：<div class="seg"><button data-v="a">…</button></div> ---------- */
  function seg(el, onChange){
    var btns = el.querySelectorAll('button');
    btns.forEach(function(b){
      b.addEventListener('click', function(){
        btns.forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
        onChange(b.getAttribute('data-v'));
      });
    });
    var first = el.querySelector('[aria-pressed="true"]') || btns[0];
    btns.forEach(function(x){ x.setAttribute('aria-pressed', x === first); });
    return first.getAttribute('data-v');
  }
  function reduced(){ return document.documentElement.classList.contains('reduce-motion') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !document.documentElement.classList.contains('allow-motion')); }
  function wait(ms){ return new Promise(function(r){ setTimeout(r, reduced() ? Math.min(ms, 60) : ms); }); }

  /* 只給一次的獎勵（動畫挑戰完成等） */
  function rewardOnce(key, n, why){
    var got = CH4.store.get('rewards', []);
    if(got.indexOf(key) >= 0) return false;
    got.push(key); CH4.store.set('rewards', got); CH4.energy.add(n, why); return true;
  }

  document.addEventListener('DOMContentLoaded', initCards);
  window.UNIT = { openCheck:openCheck, seg:seg, reduced:reduced, wait:wait, refreshMini:refreshMini, sortable:sortable, quickQuiz:quickQuiz, record:record, rewardOnce:rewardOnce };
})();
