/* @ds-bundle: {"format":4,"namespace":"TrueRound","components":[{"name":"Button"},{"name":"Badge"},{"name":"CornerTag"},{"name":"Icon"},{"name":"Scorecard"},{"name":"Record"},{"name":"LevelLadder"},{"name":"SkillMeter"},{"name":"ClearanceCard"},{"name":"AthleteCard"},{"name":"Field"},{"name":"Toggle"},{"name":"BottomNav"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }
  function omit(obj, keys) {
    var out = {};
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) < 0) out[k] = obj[k];
    return out;
  }

  var PATHS = {
    check: 'M5 12.5l4.5 4.5L19 7.5',
    clock: 'M12 7v5l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z',
    shield: 'M12 3l7 3v6c0 4.4-3 7.8-7 9-4-1.2-7-4.6-7-9V6l7-3zM9 12l2 2 4-4',
    ban: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM5.6 5.6l12.8 12.8',
    home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
    ladder: 'M5 20V9M10 20V6M15 20V12M20 20V4',
    card: 'M4 5h16v14H4zM4 10h16M9 15h6',
    play: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM10 8.5v7l6-3.5z',
    calendar: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.4-4 4.4-6 8-6s6.6 2 8 6',
    lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
    scale: 'M12 4v16M5 20h14M6 8h12M6 8l-3 6h6zM18 8l-3 6h6z',
    whistle: 'M4 10h9a5 5 0 1 1-5 5H4zM13 10l5-4M17 6h3',
    share: 'M12 15V3M7.5 7.5L12 3l4.5 4.5M5 13v8h14v-8',
    settings: 'M4 7h9M17 7h3M15 4.5v5M4 17h3M11 17h9M9 14.5v5',
    camera: 'M4 8h4l2-3h4l2 3h4v11H4zM12 16.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    back: 'M15 5l-7 7 7 7'
  };

  function Icon(props) {
    var size = props.size || 20;
    return h('svg', {
      className: cx('tr-icon', props.className), width: size, height: size, viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', strokeWidth: props.strokeWidth || 2,
      strokeLinecap: 'square', strokeLinejoin: 'miter', 'aria-hidden': props.label ? undefined : 'true',
      role: props.label ? 'img' : undefined, 'aria-label': props.label
    }, h('path', { d: PATHS[props.name] || PATHS.check }));
  }

  function Button(props) {
    var variant = props.variant || 'secondary';
    var rest = omit(props, ['variant', 'size', 'block', 'className', 'children', 'icon']);
    return h('button', Object.assign({ type: 'button' }, rest, {
      className: cx('tr-btn', 'tr-btn-' + variant, props.size === 'sm' && 'tr-btn-sm', props.block && 'tr-btn-block', props.className)
    }), props.icon ? h(Icon, { name: props.icon, size: props.size === 'sm' ? 16 : 18 }) : null, props.children);
  }

  var STATUS_ICON = { verified: 'check', pending: 'clock', cleared: 'shield', suspended: 'ban' };
  function Badge(props) {
    var status = props.status || 'neutral';
    var icon = STATUS_ICON[status];
    return h('span', { className: cx('tr-badge', 'tr-badge-' + status, props.className) },
      icon ? h(Icon, { name: icon, size: 14, strokeWidth: 2.5 }) : null,
      h('span', null, props.children));
  }

  function CornerTag(props) {
    var corner = props.corner === 'blue' ? 'blue' : 'red';
    return h('span', { className: cx('tr-corner', 'tr-corner-' + corner, props.className) },
      h('span', { className: 'tr-corner-dot', 'aria-hidden': 'true' }),
      props.children || (corner === 'red' ? 'Red corner' : 'Blue corner'));
  }

  function sum(arr) { var s = 0; for (var i = 0; i < arr.length; i++) s += arr[i]; return s; }

  // judges: [[ [red, blue] per round ], ...] one array per judge
  function Scorecard(props) {
    var judges = props.judges || [];
    var rounds = judges.length ? judges[0].length : 0;
    var head = [h('th', { key: 'j', scope: 'col' }, 'Judge')];
    for (var r = 0; r < rounds; r++) head.push(h('th', { key: 'r' + r, scope: 'col' }, 'R' + (r + 1)));
    head.push(h('th', { key: 't', scope: 'col', className: 'tr-sc-total' }, 'Total'));
    // --i staggers the reveal: round by round across judges, then the totals.
    var rows = judges.map(function (j, ji) {
      var cells = [h('th', { key: 'n', scope: 'row' }, String(ji + 1))];
      j.forEach(function (pair, ri) {
        cells.push(h('td', { key: ri, style: { '--i': ri * judges.length + ji } }, h('span', { className: 'tr-sc-red' }, pair[0]), h('span', { className: 'tr-sc-sep' }, ':'), h('span', { className: 'tr-sc-blue' }, pair[1])));
      });
      var tr = sum(j.map(function (p) { return p[0]; }));
      var tb = sum(j.map(function (p) { return p[1]; }));
      cells.push(h('td', { key: 't', className: 'tr-sc-total', style: { '--i': rounds * judges.length + ji + 1 } }, h('span', { className: 'tr-sc-red' }, tr), h('span', { className: 'tr-sc-sep' }, ':'), h('span', { className: 'tr-sc-blue' }, tb)));
      return h('tr', { key: ji }, cells);
    });
    var result = props.result;
    return h('figure', { className: cx('tr-scorecard', props.className) },
      props.hideCorners ? null : h('div', { className: 'tr-sc-corners' },
        h('div', { className: 'tr-sc-fighter tr-sc-fighter-red' }, h(CornerTag, { corner: 'red' }), h('strong', null, props.red || 'Red corner')),
        h('div', { className: 'tr-sc-fighter tr-sc-fighter-blue' }, h(CornerTag, { corner: 'blue' }), h('strong', null, props.blue || 'Blue corner'))),
      h('table', { className: 'tr-sc-table' }, h('thead', null, h('tr', null, head)), h('tbody', null, rows)),
      result ? h('figcaption', { className: 'tr-sc-result' },
        h('span', { className: 'tr-label' }, 'Result'),
        result.winner
          ? h('span', null, h('strong', { className: result.winner === 'blue' ? 'tr-sc-blue' : 'tr-sc-red' }, result.winnerName || (result.winner === 'blue' ? props.blue : props.red)), ' by ', result.method)
          : h('span', null, h('strong', null, result.method)),
        props.verifiedBy ? h(Badge, { status: 'verified' }, props.verifiedBy) : null) : null);
  }

  function reducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return true; }
  }

  // Counts from 0 to `target` once on mount; instant under reduced motion.
  function useCountUp(target, enabled, ms) {
    var still = !enabled || reducedMotion() || document.hidden;
    var st = React.useState(still ? target : 0), val = st[0], setVal = st[1];
    React.useEffect(function () {
      if (!enabled || reducedMotion() || document.hidden) { setVal(target); return; }
      var start = null, raf;
      function step(t) {
        if (start === null) start = t;
        var p = Math.min(1, (t - start) / (ms || 700));
        setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
      // Frames pause in hidden tabs and thumbnail captures: always land on the real number.
      var done = setTimeout(function () { setVal(target); }, (ms || 700) + 150);
      return function () { cancelAnimationFrame(raf); clearTimeout(done); };
    }, [target, enabled]);
    return val;
  }

  function Record(props) {
    var w = props.wins || 0, l = props.losses || 0, d = props.draws || 0;
    var cw = useCountUp(w, props.animate), cl = useCountUp(l, props.animate), cd = useCountUp(d, props.animate);
    return h('div', { className: cx('tr-record', props.size === 'sm' && 'tr-record-sm', props.className), 'aria-label': w + ' wins, ' + l + ' losses, ' + d + ' draws' },
      h('div', { className: 'tr-record-num', 'aria-hidden': 'true' }, cw + '-' + cl + '-' + cd),
      h('div', { className: 'tr-record-key', 'aria-hidden': 'true' }, h('span', null, 'W'), h('span', null, 'L'), h('span', null, 'D')));
  }

  function LevelLadder(props) {
    var levels = props.levels || [];
    var current = props.current || 0;
    return h('ol', { className: cx('tr-ladder', props.className), 'aria-label': 'Pathway level ' + (current + 1) + ' of ' + levels.length },
      levels.map(function (name, i) {
        var state = i < current ? 'done' : i === current ? 'current' : 'next';
        return h('li', { key: name, className: 'tr-ladder-step tr-ladder-' + state, 'aria-current': state === 'current' ? 'step' : undefined },
          h('span', { className: 'tr-ladder-bar' }),
          h('span', { className: 'tr-ladder-name' }, name));
      }));
  }

  function SkillMeter(props) {
    var value = Math.max(0, Math.min(100, props.value || 0));
    var filled = Math.round(value / 10);
    var segs = [];
    for (var i = 0; i < 10; i++) segs.push(h('span', { key: i, className: i < filled ? 'on' : '', style: { '--i': i } }));
    var status = props.status || (value >= 100 ? 'verified' : 'neutral');
    return h('div', { className: cx('tr-skill', props.className) },
      h('div', { className: 'tr-skill-head' },
        h('span', { className: 'tr-skill-name' }, props.skill),
        h('span', { className: 'tr-skill-value' }, value + '%')),
      h('div', { className: 'tr-skill-meter', role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': value, 'aria-label': props.skill }, segs),
      props.verifiedBy || props.status === 'pending' ? h('div', { className: 'tr-skill-meta' },
        status === 'pending' ? h(Badge, { status: 'pending' }, 'Awaiting coach') : h(Badge, { status: 'verified' }, 'Verified'),
        props.verifiedBy ? h('span', null, props.verifiedBy + (props.date ? ' · ' + props.date : '')) : null) : null);
  }

  var CLEAR_LABEL = { cleared: 'Cleared to compete', pending: 'Medical due', suspended: 'Suspended' };
  function ClearanceCard(props) {
    var status = props.status || 'cleared';
    return h('section', { className: cx('tr-clear', 'tr-clear-' + status, props.className) },
      h('div', { className: 'tr-clear-band' }, h(Icon, { name: STATUS_ICON[status] || 'clock', size: 18, strokeWidth: 2.5 }), h('span', null, props.title || CLEAR_LABEL[status])),
      h('div', { className: 'tr-clear-body' },
        props.until ? h('div', { className: 'tr-clear-until' }, h('span', { className: 'tr-label' }, status === 'suspended' ? 'No contact until' : 'Valid until'), h('span', { className: 'tr-clear-date' }, props.until)) : null,
        props.issuedBy ? h('div', { className: 'tr-clear-meta' }, 'Issued by ' + props.issuedBy) : null,
        props.children));
  }

  function initials(name) {
    return (name || '').split(' ').filter(Boolean).slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase();
  }

  function AthleteCard(props) {
    var rec = props.record || {};
    return h('article', { className: cx('tr-athlete', props.corner && 'tr-athlete-' + props.corner, props.className) },
      h('div', { className: 'tr-athlete-top' },
        props.photo
          ? h('img', { className: 'tr-avatar tr-avatar-photo', src: props.photo, alt: '', width: 56, height: 56 })
          : h('div', { className: 'tr-avatar', 'aria-hidden': 'true' }, initials(props.name)),
        h('div', { className: 'tr-athlete-id' },
          props.verified ? h(Badge, { status: 'verified' }, 'Verified record') : null,
          h('h3', { className: 'tr-athlete-name' }, props.name),
          h('p', { className: 'tr-athlete-sub' }, [props.gym, props.coach && 'Coach ' + props.coach].filter(Boolean).join(' · ')))),
      h('div', { className: 'tr-athlete-stats' },
        props.record ? h(Record, { wins: rec.wins, losses: rec.losses, draws: rec.draws }) : null,
        h('dl', { className: 'tr-athlete-dl' },
          props.level ? h('div', null, h('dt', null, 'Level'), h('dd', null, props.level)) : null,
          props.weightClass ? h('div', null, h('dt', null, 'Weight'), h('dd', null, props.weightClass)) : null,
          props.nation ? h('div', null, h('dt', null, 'Nation'), h('dd', null, props.nation)) : null)),
      props.footer ? h('div', { className: 'tr-athlete-foot' }, props.footer) : null);
  }

  function Field(props) {
    var id = props.id || ('f-' + String(props.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    var rest = omit(props, ['label', 'hint', 'error', 'className', 'id']);
    return h('div', { className: cx('tr-field', props.error && 'tr-field-error', props.className) },
      h('label', { htmlFor: id }, props.label),
      h('input', Object.assign({ id: id, 'aria-invalid': props.error ? 'true' : undefined, 'aria-describedby': (props.hint || props.error) ? id + '-hint' : undefined }, rest)),
      props.error || props.hint ? h('p', { id: id + '-hint', className: 'tr-field-hint' }, props.error || props.hint) : null);
  }

  function Toggle(props) {
    var id = props.id || ('t-' + String(props.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    return h('div', { className: cx('tr-toggle', props.disabled && 'tr-toggle-disabled', props.className) },
      h('div', { className: 'tr-toggle-text' },
        h('label', { htmlFor: id }, props.label),
        props.hint ? h('p', null, props.hint) : null),
      h('button', {
        id: id, type: 'button', role: 'switch', 'aria-checked': props.checked ? 'true' : 'false', disabled: props.disabled,
        className: 'tr-switch', onClick: function () { if (!props.disabled && props.onChange) props.onChange(!props.checked); }
      }, h('span', { className: 'tr-switch-knob' })));
  }

  function BottomNav(props) {
    var items = props.items || [];
    return h('nav', { className: cx('tr-nav', props.className), 'aria-label': props.label || 'Main' },
      items.map(function (it) {
        var active = it.id === props.active;
        return h('button', {
          key: it.id, type: 'button', className: cx('tr-nav-item', active && 'is-active'), 'aria-current': active ? 'page' : undefined,
          onClick: function () { if (props.onSelect) props.onSelect(it.id); }
        }, h(Icon, { name: it.icon, size: 22 }), h('span', null, it.label),
          it.badge ? h('span', { className: 'tr-nav-dot', 'aria-label': it.badge }) : null);
      }));
  }

  window.TrueRound = {
    Button: Button, Badge: Badge, CornerTag: CornerTag, Icon: Icon, Scorecard: Scorecard, Record: Record,
    LevelLadder: LevelLadder, SkillMeter: SkillMeter, ClearanceCard: ClearanceCard, AthleteCard: AthleteCard,
    Field: Field, Toggle: Toggle, BottomNav: BottomNav, useCountUp: useCountUp, icons: Object.keys(PATHS)
  };
})();
