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
        if(btn){ btn.setAttribute('aria-pressed', on); btn.textContent = on ? '我懂了 ✓' : '我懂了？'; }
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
        var on = !CH4.progress.isDone(id);
        CH4.progress.mark(id, on); paint(); refreshMini();
        if(on){
          var p = CH4.progress.unit(unitOf(id));
          var once = CH4.store.get('gotOnce', []);
          if(once.indexOf(id) < 0){ once.push(id); CH4.store.set('gotOnce', once); CH4.energy.add(5); }
          CH4.toast(p.done === p.total ? '🎉 這個單元的神經元全部連線！' : '🧠 神經元連線：' + p.done + ' / ' + p.total);
        }
      });
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
      document.querySelectorAll('.concept').forEach(function(c){ c.classList.toggle('done', CH4.progress.isDone(c.getAttribute('data-id'))); var b = c.querySelector('.got'); if(b){ var on = CH4.progress.isDone(c.getAttribute('data-id')); b.setAttribute('aria-pressed', on); b.textContent = on ? '我懂了 ✓' : '我懂了？'; } });
    }, 300); }, function(){});
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

  /* ---------- 拖曳排序：ul.sortlist（也提供 ▲▼ 按鈕） ---------- */
  function sortable(ul, onChange){
    function clearMarks(){ Array.prototype.forEach.call(ul.children, function(x){ x.classList.remove('ok','ng'); }); renum(); if(onChange) onChange(); }
    function renum(){ Array.prototype.forEach.call(ul.children, function(x, k){ var n = x.querySelector('.n'); if(n) n.textContent = k + 1; }); }
    function bindLi(li){
      li.querySelectorAll('[data-mv]').forEach(function(btn){
        btn.addEventListener('click', function(e){
          e.stopPropagation();
          if(btn.getAttribute('data-mv') === 'up' && li.previousElementSibling) ul.insertBefore(li, li.previousElementSibling);
          if(btn.getAttribute('data-mv') === 'down' && li.nextElementSibling) ul.insertBefore(li.nextElementSibling, li);
          clearMarks();
        });
      });
      li.addEventListener('pointerdown', function(e){
        if(e.target.closest('button')) return;
        e.preventDefault();
        li.classList.add('dragging'); if(li.setPointerCapture) li.setPointerCapture(e.pointerId);
        function move(ev){
          var sibs = Array.prototype.filter.call(ul.children, function(x){ return x !== li; });
          for(var k = 0; k < sibs.length; k++){
            var r = sibs[k].getBoundingClientRect();
            if(ev.clientY < r.top + r.height / 2){ if(sibs[k] !== li.nextElementSibling) ul.insertBefore(li, sibs[k]); return; }
          }
          ul.appendChild(li);
        }
        function up(){ li.classList.remove('dragging'); li.removeEventListener('pointermove', move); li.removeEventListener('pointerup', up); li.removeEventListener('pointercancel', up); clearMarks(); }
        li.addEventListener('pointermove', move); li.addEventListener('pointerup', up); li.addEventListener('pointercancel', up);
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
  window.UNIT = { seg:seg, reduced:reduced, wait:wait, refreshMini:refreshMini, sortable:sortable, quickQuiz:quickQuiz, record:record, rewardOnce:rewardOnce };
})();
