(function () {
  var S = window.STATUS, FE = window.FRONTEND, BE = window.BACKEND;
  var ST = S.statuses, ORDER = ['done', 'progress', 'client', 'pending'];
  var PR = ['P0', 'P1', 'P2', 'P3'];
  var state = { p: 'all', s: 'all', q: '' };

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function badge(s) { return '<span class="badge s-' + s + '">' + ST[s] + '</span>'; }
  function deferred(list) { return list.filter(function (f) { return f.deferred; }).length; }
  function tally(list) { var t = { done: 0, progress: 0, client: 0, pending: 0 }; list.forEach(function (f) { t[f.status]++; }); return t; }

  $('updated').textContent = S.updated;
  $('auditDate2').textContent = S.auditDate;
  $('deferNote').textContent = S.deferredNote;

  function summary(listEl, barEl, textEl, list, label) {
    var t = tally(list), n = list.length;
    textEl.textContent = n + ' items: ' + t.done + ' completed, ' + t.progress + ' in progress, ' + t.client + ' waiting on JKHPMC, ' + t.pending + ' pending.' + (deferred(list) ? ' On hold (mandi rates): ' + deferred(list) + '.' : '');
    barEl.setAttribute('aria-label', label + ' items by status');
    barEl.innerHTML = ORDER.map(function (s) { return t[s] ? '<span class="seg s-' + s + '" style="flex:' + t[s] + '" title="' + ST[s] + ': ' + t[s] + '"></span>' : ''; }).join('');
    listEl.innerHTML = ORDER.map(function (s) { return '<li><i class="dot s-' + s + '"></i>' + ST[s] + ' <b>' + t[s] + '</b></li>'; }).join('');
  }
  summary($('feLegend'), $('feBar'), $('feSummary'), FE, 'Frontend');
  summary($('beLegend'), $('beBar'), $('beSummary'), BE, 'Backend');

  // checks
  S.checks.forEach(function (c) {
    $('checks').appendChild(el('div', 'card check' + (c[2] ? ' warn' : ''), '<span class="tick" aria-hidden="true">' + (c[2] ? '!' : '✓') + '</span><div><b>' + esc(c[0]) + '</b><br>' + esc(c[1]) + '</div>'));
  });

  // priority cards
  PR.forEach(function (p) {
    var f = FE.filter(function (x) { return x.p === p; }), b = BE.filter(function (x) { return x.p === p; });
    var card = el('div', 'card prio-card');
    card.innerHTML = '<div class="ph"><span class="pchip p-' + p + '">' + p + '</span><b>' + S.priorities[p].name + '</b></div><p class="muted">' + S.priorities[p].blurb + '</p>';
    [['Frontend', f], ['Backend', b]].forEach(function (r) {
      var t = tally(r[1]);
      var row = el('div', 'prow');
      row.innerHTML = '<span>' + r[0] + ' <small>(' + r[1].length + ')</small></span><div class="stack small">' +
        ORDER.map(function (s) { return t[s] ? '<span class="seg s-' + s + '" style="flex:' + t[s] + '" title="' + ST[s] + ': ' + t[s] + '"></span>' : ''; }).join('') +
        '</div><small>' + t.done + ' done</small>';
      card.appendChild(row);
    });
    $('prio').appendChild(card);
  });

  // filters
  function chips(host, items, key) {
    items.forEach(function (it) {
      var b = el('button', 'chip', it[1]); b.type = 'button'; b.setAttribute('aria-pressed', it[0] === 'all');
      if (it[2]) b.classList.add(it[2]);
      b.addEventListener('click', function () {
        state[key] = it[0];
        Array.prototype.forEach.call(host.children, function (c) { c.setAttribute('aria-pressed', c === b); });
        render();
      });
      host.appendChild(b);
    });
  }
  chips($('fp'), [['all', 'All']].concat(PR.map(function (p) { return [p, p + ' ' + S.priorities[p].name]; })), 'p');
  chips($('fs'), [['all', 'All']].concat(ORDER.map(function (s) { return [s, ST[s], 's-' + s]; })).concat([['deferred', 'Deferred (on hold)', 's-deferred']]), 's');
  $('q').addEventListener('input', function (e) { state.q = e.target.value.trim().toLowerCase(); render(); });

  function match(f) {
    if (state.p !== 'all' && f.p !== state.p) return false;
    if (state.s === 'deferred') { if (!f.deferred) return false; }
    else if (state.s !== 'all' && f.status !== state.s) return false;
    if (state.q) {
      var hay = [f.id, f.title, f.desc, f.built, f.remains, f.needs, ST[f.status], f.deferred ? 'deferred on hold' : ''].join(' ').toLowerCase();
      if (hay.indexOf(state.q) < 0) return false;
    }
    return true;
  }

  function card(f, layer) {
    var c = el('article', 'card feat s-border-' + f.status + (f.deferred ? ' is-deferred' : ''));
    var h = '<div class="fh"><span class="fid">' + f.id + '</span><span class="pchip p-' + f.p + '">' + f.p + '</span>' + badge(f.status) + (f.deferred ? '<span class="badge deferred">Deferred</span>' : '') + '</div>' +
      '<h4>' + esc(f.title) + '</h4><p>' + esc(f.desc) + '</p>';
    if (layer === 'fe') h += '<dl class="bits"><dt>Built</dt><dd>' + esc(f.built) + '</dd><dt>Still to do</dt><dd>' + esc(f.remains) + '</dd></dl>';
    if (layer === 'be' && f.note) h += '<dl class="bits"><dt>Verified / remaining</dt><dd>' + esc(f.note) + '</dd></dl>';
    if (f.deferred) h += '<p class="defer-note"><b>On hold:</b> will be built after a long time. Not being worked on now.</p>';
    if (f.needs) h += '<p class="needs"><b>Needs:</b> ' + esc(f.needs) + '</p>';
    c.innerHTML = h; return c;
  }

  function renderList(host, list, layer) {
    host.innerHTML = '';
    var any = 0;
    PR.forEach(function (p) {
      var items = list.filter(function (f) { return f.p === p && match(f); });
      if (!items.length) return;
      any += items.length;
      var g = el('div', 'group');
      g.appendChild(el('h3', 'gh', '<span class="pchip p-' + p + '">' + p + '</span> ' + S.priorities[p].name + ' <small>' + items.length + '</small>'));
      var grid = el('div', 'grid feats'); items.forEach(function (f) { grid.appendChild(card(f, layer)); });
      g.appendChild(grid); host.appendChild(g);
    });
    if (!any) host.appendChild(el('p', 'empty', 'No items match the current filters.'));
    return any;
  }

  function render() {
    var a = renderList($('feList'), FE, 'fe'), b = renderList($('beList'), BE, 'be');
    $('count').textContent = 'Showing ' + a + ' frontend and ' + b + ' backend items.';
  }
  render();

  // dependencies, approvals, risks, milestones
  window.DEPENDENCIES.forEach(function (d) {
    var tr = el('tr', null, '<td data-l="Needed">' + esc(d[0]) + '</td><td data-l="Unblocks">' + esc(d[1]) + '</td><td data-l="Risk if late">' + esc(d[2] || '—') + '</td>');
    $('depBody').appendChild(tr);
  });
  window.HISTORY.forEach(function (h) {
    $('logBody').appendChild(el('tr', null, '<td data-l="Date">' + h.date + '</td><td><b>' + esc(h.task) + '</b></td><td><span class="pchip p-' + h.p + '">' + h.p + '</span></td><td>' + badge(h.status) + '</td><td>' + esc(h.what) + '</td><td>' + esc(h.verified) + '</td><td>' + esc(h.remaining || '—') + '</td>'));
  });
  window.APPROVALS.forEach(function (a) { $('appr').appendChild(el('li', null, esc(a))); });
  window.RISKS.forEach(function (r) {
    $('riskList').appendChild(el('div', 'card risk r-' + r[2], '<span class="lvl">' + r[2] + '</span><b>' + esc(r[0]) + '</b><p>' + esc(r[1]) + '</p>'));
  });
  window.MILESTONES.forEach(function (m) {
    var li = el('li', 'ms s-border-' + m.status);
    li.innerHTML = '<div class="msh"><span class="mid">' + m.id + '</span>' + badge(m.status) + (m.recommended ? '<span class="rec">Recommended first backend milestone</span>' : '') + '</div><h4>' + esc(m.title) + '</h4><p>' + esc(m.text) + '</p>' +
      (m.done ? '<p class="needs"><b>Done when:</b> ' + esc(m.done) + '</p>' : '');
    $('msList').appendChild(li);
  });
})();
