(function () {
  var R = window.React, h = R.createElement, html = window.htm.bind(h);
  var useState = R.useState, useReducer = R.useReducer, useEffect = R.useEffect, useRef = R.useRef;
  var T = window.TrueRound, D = window.TR_DATA;
  var Button = T.Button, Badge = T.Badge, CornerTag = T.CornerTag, Icon = T.Icon, Scorecard = T.Scorecard, Record = T.Record,
    LevelLadder = T.LevelLadder, SkillMeter = T.SkillMeter, ClearanceCard = T.ClearanceCard, AthleteCard = T.AthleteCard,
    Field = T.Field, Toggle = T.Toggle, BottomNav = T.BottomNav;
  var STORE_KEY = 'trueround-demo-v3';
  var TODAY = D.TODAY, LEVELS = D.LEVELS;

  /* ---------- helpers ---------- */
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function parse(d) { return new Date(d + 'T12:00:00Z'); }
  function fmt(d) { if (!d) return ''; var x = parse(d); return x.getUTCDate() + ' ' + MONTHS[x.getUTCMonth()] + ' ' + x.getUTCFullYear(); }
  function days(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }
  function addDays(d, n) { var x = parse(d); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
  function age(dob, on) {
    var a = parse(dob), b = parse(on || TODAY), y = b.getUTCFullYear() - a.getUTCFullYear();
    if (b.getUTCMonth() < a.getUTCMonth() || (b.getUTCMonth() === a.getUTCMonth() && b.getUTCDate() < a.getUTCDate())) y--;
    return y;
  }
  function isMinor(a) { return age(a.dob) < 18; }
  function nameOf(a) { return isMinor(a) ? a.first + ' ' + a.last.charAt(0) + '.' : a.first + ' ' + a.last; }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  var SKILL_NAMES = {};
  D.AREAS.forEach(function (ar) { ar.skills.forEach(function (sk) { SKILL_NAMES[sk[0]] = sk[1]; }); });
  function coachName(id) { var c = D.coaches[id]; return c ? c.name : 'your coach'; }

  function boutsOf(s, id) {
    return s.bouts.filter(function (b) { return b.athlete === id; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  }
  function recordOf(s, id) {
    var r = { wins: 0, losses: 0, draws: 0 };
    boutsOf(s, id).forEach(function (b) { if (b.result === 'win') r.wins++; else if (b.result === 'loss') r.losses++; else r.draws++; });
    return r;
  }
  function medical(a, on) {
    on = on || TODAY;
    if (a.suspension && a.suspension.until >= on) return { status: 'suspended', until: a.suspension.until, by: a.suspension.issuedBy, reason: a.suspension.reason };
    if (a.clearance && a.clearance.until >= on) {
      var left = days(on, a.clearance.until);
      return { status: left <= 30 ? 'pending' : 'cleared', until: a.clearance.until, by: a.clearance.issuedBy, left: left };
    }
    return { status: 'pending', missing: true };
  }
  function medicalTitle(m) {
    if (m.status === 'suspended') return 'Suspended';
    if (m.missing) return 'No valid medical on file';
    if (m.status === 'pending') return 'Medical expires in ' + m.left + ' days';
    return 'Cleared to compete';
  }
  function medicalBadge(m) {
    if (m.status === 'suspended') return html`<${Badge} status="suspended">Suspended to ${fmt(m.until)}<//>`;
    if (m.missing) return html`<${Badge} status="pending">No medical<//>`;
    if (m.status === 'pending') return html`<${Badge} status="pending">Expires ${fmt(m.until)}<//>`;
    return html`<${Badge} status="cleared">Cleared<//>`;
  }
  function eligibility(a, ev) {
    var div = age(a.dob, ev.date) < 18 ? 'Junior' : 'Senior';
    var medOk = !!(a.clearance && a.clearance.until >= ev.date);
    var suspOk = !(a.suspension && a.suspension.until >= ev.date);
    return [
      { ok: medOk, label: medOk ? 'Medical valid on event day (until ' + fmt(a.clearance.until) + ')' : 'Medical not valid on event day. Book a pre-competition medical first.' },
      { ok: suspOk, label: suspOk ? 'No suspension on event day' : 'Suspended until ' + fmt(a.suspension.until) },
      { ok: a.level >= ev.minLevel, label: 'Level ' + LEVELS[ev.minLevel] + ' or above (yours: ' + LEVELS[a.level] + ')' },
      { ok: TODAY <= ev.closes, label: 'Registration open until ' + fmt(ev.closes) },
      { ok: ev.divisions.indexOf(div) >= 0, label: div + ' division offered at this event' }
    ];
  }
  function judgeTotals(judges) {
    return judges.map(function (j) {
      return j.reduce(function (t, p) { return [t[0] + Number(p[0]), t[1] + Number(p[1])]; }, [0, 0]);
    });
  }
  function decisionFrom(judges) {
    var t = judgeTotals(judges), red = 0, blue = 0, even = 0;
    t.forEach(function (x) { if (x[0] > x[1]) red++; else if (x[1] > x[0]) blue++; else even++; });
    var winner = red >= 2 ? 'red' : blue >= 2 ? 'blue' : null;
    var method;
    if (!winner) method = even === 3 ? 'Unanimous draw' : even === 2 ? 'Majority draw' : 'Split draw';
    else if ((winner === 'red' ? red : blue) === 3) method = 'Unanimous decision';
    else if (even > 0) method = 'Majority decision';
    else method = 'Split decision';
    return { winner: winner, method: method, totals: t };
  }

  /* ---------- state ---------- */
  function load() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      if (raw) { var s = JSON.parse(raw); if (s && s.v === 1 && s.athletes) return s; }
    } catch (e) { /* storage blocked: run on seed data */ }
    return D.seed();
  }
  function feedItem(n, athlete, kind, text) { n.feed.unshift({ id: uid(), athlete: athlete, date: TODAY, kind: kind, text: text }); }

  function reducer(s, a) {
    if (a.type === 'reset') return D.seed();
    var n = JSON.parse(JSON.stringify(s)), ath, sk;
    switch (a.type) {
      case 'role': n.role = a.role; break;
      case 'viewAs': n.viewAs = a.id; break;
      case 'request':
        sk = n.athletes[a.athlete].skills[a.skill];
        sk.status = 'pending'; sk.requested = Math.min(100, (sk.value || 0) + 20); sk.requestedOn = TODAY;
        break;
      case 'verify':
        a.items.forEach(function (it) {
          var x = n.athletes[it.athlete].skills[it.skill];
          x.value = it.value; x.status = 'verified'; x.by = 'hassan'; x.date = TODAY; delete x.requested; delete x.requestedOn;
          feedItem(n, it.athlete, 'verified', 'Coach Hassan Jizzini verified ' + SKILL_NAMES[it.skill] + ' at ' + it.value + '%.');
        });
        break;
      case 'notYet':
        sk = n.athletes[a.athlete].skills[a.skill];
        sk.status = sk.value > 0 ? 'verified' : 'none'; delete sk.requested; delete sk.requestedOn;
        feedItem(n, a.athlete, 'review', 'Coach Hassan Jizzini reviewed ' + SKILL_NAMES[a.skill] + ': not yet. Keep drilling it and ask again.');
        break;
      case 'recommend':
        ath = n.athletes[a.athlete];
        n.gradings.unshift({ id: uid(), athlete: a.athlete, from: ath.level, to: ath.level + 1, coach: 'hassan', status: 'recommended', on: TODAY });
        feedItem(n, a.athlete, 'review', 'Coach Hassan Jizzini recommended you for ' + LEVELS[ath.level + 1] + '. The federation grading panel will review it.');
        break;
      case 'grading':
        n.gradings.forEach(function (g) {
          if (g.id !== a.id) return;
          g.status = a.approve ? 'approved' : 'returned'; g.decidedOn = TODAY;
          if (a.approve) { n.athletes[g.athlete].level = g.to; feedItem(n, g.athlete, 'verified', 'Promoted to ' + LEVELS[g.to] + ' by the federation grading panel.'); }
          else feedItem(n, g.athlete, 'review', 'The grading panel returned your ' + LEVELS[g.to] + ' recommendation to your coach.');
        });
        break;
      case 'book': n.sparring.unshift({ id: uid(), date: a.date, athletes: a.athletes, on: TODAY }); break;
      case 'bout':
        n.bouts.push(a.bout);
        feedItem(n, a.bout.athlete, 'result', 'Result written by ' + a.bout.official + ': ' + a.bout.result + ' by ' + a.bout.method.toLowerCase() + ' at ' + a.bout.event + '.');
        break;
      case 'clear':
        n.athletes[a.athlete].clearance = { until: a.until, issuedBy: a.by, issuedOn: TODAY };
        feedItem(n, a.athlete, 'medical', 'Pre-competition medical recorded. Cleared to compete until ' + fmt(a.until) + '.');
        break;
      case 'suspend':
        n.athletes[a.athlete].suspension = { until: a.until, reason: a.reason, issuedBy: a.by, issuedOn: TODAY };
        feedItem(n, a.athlete, 'medical', 'Medical suspension issued. No contact sparring until ' + fmt(a.until) + '.');
        break;
      case 'register':
        n.registrations.push({ event: a.event, athlete: a.athlete, weightClass: n.athletes[a.athlete].weightClass, on: TODAY });
        break;
      case 'withdraw':
        n.registrations = n.registrations.filter(function (r) { return !(r.event === a.event && r.athlete === a.athlete); });
        break;
      case 'unlock': n.athletes[a.athlete].unlocked.push(a.level); break;
      case 'watch':
        ath = n.athletes[a.athlete];
        if (ath.watched.indexOf(a.video) < 0) ath.watched.push(a.video);
        break;
      case 'privacy': n.athletes[a.athlete].privacy[a.key] = a.value; break;
      case 'create': n.athletes[a.athlete.id] = a.athlete; n.viewAs = a.athlete.id; n.role = 'athlete'; feedItem(n, a.athlete.id, 'review', 'Account created. Coach Hassan Jizzini can now see you on the Cedar Combat Club roster.'); break;
      case 'delete':
        delete n.athletes[a.id];
        ['bouts', 'registrations', 'feed', 'gradings'].forEach(function (k) { n[k] = n[k].filter(function (x) { return x.athlete !== a.id; }); });
        n.viewAs = Object.keys(n.athletes)[0];
        break;
    }
    return n;
  }

  /* ---------- shared bits ---------- */
  function Mark(props) {
    return html`<svg width=${props.size || 28} height=${props.size || 28} viewBox="0 0 64 64" aria-hidden="true" className="mark">
      <g fill="none" strokeWidth="9"><path className="mark-ink" d="M36.2 10.4A22 22 0 0 1 52.8 39.16"/><path className="mark-ink" d="M48.6 46.43A22 22 0 0 1 15.4 46.43"/><path className="mark-ink" d="M11.2 39.16A22 22 0 0 1 27.8 10.4"/></g>
      <path d="M22.5 32.5L29 39L42 25.5" fill="none" className="mark-gold" strokeWidth="6" strokeLinecap="square"/></svg>`;
  }

  // The three-round ring from the mark, used large as a watermark.
  function Ring(props) {
    return html`<svg className=${props.className} viewBox="0 0 64 64" aria-hidden="true">
      <path className="ring-a" d="M36.2 10.4A22 22 0 0 1 52.8 39.16"/><path className="ring-a" d="M48.6 46.43A22 22 0 0 1 15.4 46.43"/><path className="ring-b" d="M11.2 39.16A22 22 0 0 1 27.8 10.4"/></svg>`;
  }

  function Num(props) { return T.useCountUp(props.n, true, 600); }

  function initialsOf(a) { return (a.first.charAt(0) + a.last.charAt(0)).toUpperCase(); }
  // Longest line of a stacked display name; the CSS sizes the type so it fits.
  function nameChars(a) { return { '--chars': Math.max(6, a.first.length, isMinor(a) ? 2 : a.last.length) }; }
  // Under-18s never show a photo, whatever the record holds.
  function photoOf(a) { return a.photo && !isMinor(a) ? (window.TR_PHOTOS || {})[a.photo] || null : null; }
  function Face(props) {
    var src = photoOf(props.a);
    return src ? html`<img src=${src} alt="" width=${props.size} height=${props.size} />` : initialsOf(props.a);
  }

  // Event date as a tile: the day large, the month under it.
  function DateTile(props) {
    var x = parse(props.date);
    return html`<div className="date-tile" aria-hidden="true"><span className="date-day">${x.getUTCDate()}</span><span className="date-mon">${MONTHS[x.getUTCMonth()]}</span></div>`;
  }

  // How the wins came: decision, submission or stoppage, as ring gauges.
  var WIN_METHODS = [['Decision', /decision/i], ['Submission', /submission/i], ['Stoppage', /stops|stoppage|ko\b/i]];
  function WinMethods(props) {
    var wins = props.bouts.filter(function (b) { return b.result === 'win'; });
    if (!wins.length) return null;
    var counts = WIN_METHODS.map(function (m) { return wins.filter(function (b) { return m[1].test(b.method); }).length; });
    var lead = Math.max.apply(null, counts), C = 2 * Math.PI * 26;
    return html`<section className="card"><h2 className="tr-label">How the wins came</h2>
      <div className="rings">${WIN_METHODS.map(function (m, i) {
        var pct = Math.round(counts[i] / wins.length * 100);
        return html`<figure key=${m[0]} className=${'ring-stat' + (counts[i] === lead && lead > 0 ? ' lead' : '')}>
          <div className="ring-box"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" className="ring-track"/>
            <circle cx="32" cy="32" r="26" className="ring-val" style=${{ strokeDasharray: (C * pct / 100).toFixed(1) + ' ' + C.toFixed(1) }} transform="rotate(-90 32 32)"/></svg>
            <span className="ring-num">${counts[i]}</span></div>
          <figcaption><span className="ring-name">${m[0]}</span><span className="data muted">${pct}% of wins</span></figcaption></figure>`;
      })}</div></section>`;
  }

  // Face-off header for a bout: red corner left, blue corner right.
  function FaceOff(props) {
    return html`<div className="faceoff">
      <div className="fo-side fo-red"><span className="fo-corner">Red corner</span><span className="fo-name">${props.red}</span><span className="data muted">${props.redNation || ''}</span></div>
      <span className="fo-vs" aria-label="versus">VS</span>
      <div className="fo-side fo-blue"><span className="fo-corner">Blue corner</span><span className="fo-name">${props.blue}</span><span className="data muted">${props.blueNation || ''}</span></div>
    </div>`;
  }

  function Sheet(props) {
    var ref = useRef(null);
    useEffect(function () {
      function onKey(e) { if (e.key === 'Escape') props.onClose(); }
      document.addEventListener('keydown', onKey);
      if (ref.current) ref.current.focus();
      return function () { document.removeEventListener('keydown', onKey); };
    }, []);
    return html`<div className="sheet-scrim" onClick=${props.onClose}>
      <div className=${'sheet' + (props.wide ? ' sheet-wide' : '')} role="dialog" aria-modal="true" aria-label=${props.title} tabIndex="-1" ref=${ref} onClick=${function (e) { e.stopPropagation(); }}>
        <div className="sheet-head"><h2 className="sheet-title">${props.title}</h2>
          <button type="button" className="icon-btn" onClick=${props.onClose} aria-label="Close">✕</button></div>
        <div className="sheet-body">${props.children}</div>
      </div></div>`;
  }

  function Confirm(props) {
    return html`<${Sheet} title=${props.title} onClose=${props.onCancel}>
      <p className="muted">${props.children}</p>
      <div className="btn-row"><${Button} variant=${props.danger ? 'danger' : 'primary'} onClick=${props.onConfirm}>${props.confirmLabel}<//>
      <${Button} variant="quiet" onClick=${props.onCancel}>Cancel<//></div><//>`;
  }

  function Seg(props) {
    return html`<div className="seg" role="tablist" aria-label=${props.label}>${props.options.map(function (o) {
      return html`<button key=${o[0]} type="button" role="tab" aria-selected=${props.value === o[0]} className=${props.value === o[0] ? 'on' : ''} onClick=${function () { props.onChange(o[0]); }}>${o[1]}${o[2] ? html`<span className="seg-count">${o[2]}</span>` : null}</button>`;
    })}</div>`;
  }

  /* ---------- demo bar ---------- */
  function DemoBar(props) {
    var s = props.s, act = props.act;
    var cs = useState(false), confirming = cs[0], setConfirming = cs[1];
    var athletes = Object.keys(s.athletes).map(function (k) { return s.athletes[k]; });
    return html`<div className="demobar theme-dark">
      <div className="demobar-brand"><${Mark} size=${24} /><span className="wordmark">TrueRound</span><span className="demobar-tag">Concept prototype</span></div>
      <${Seg} label="Switch role" value=${s.role} onChange=${function (r) { act({ type: 'role', role: r }); }}
        options=${[['athlete', 'Athlete'], ['coach', 'Coach'], ['official', 'Official']]} />
      ${s.role === 'athlete' ? html`<label className="demobar-select"><span>Viewing as</span>
        <select id="view-as" value=${s.viewAs} onChange=${function (e) { act({ type: 'viewAs', id: e.target.value }); }}>
          ${athletes.map(function (a) { return html`<option key=${a.id} value=${a.id}>${nameOf(a)}${isMinor(a) ? ' (under 18)' : ''}</option>`; })}
        </select></label>` : null}
      <span className="demobar-date">Demo date ${fmt(TODAY)}</span>
      <button type="button" className="link-btn guide-btn" onClick=${props.openGuide}>How to demo</button>
      <button type="button" className="link-btn" onClick=${function () { setConfirming(true); }}>Reset demo</button>
      ${confirming ? html`<${Confirm} title="Reset the demo?" confirmLabel="Reset" danger=${true}
        onCancel=${function () { setConfirming(false); }} onConfirm=${function () { setConfirming(false); act({ type: 'reset' }, 'Demo data restored.'); }}>
        Every change you made in this browser goes back to the starting data.<//>` : null}
    </div>`;
  }

  /* ---------- athlete app ---------- */
  var TABS = [{ id: 'home', label: 'Home', icon: 'home' }, { id: 'pathway', label: 'Pathway', icon: 'ladder' }, { id: 'record', label: 'Record', icon: 'card' }, { id: 'learn', label: 'Learn', icon: 'play' }, { id: 'events', label: 'Events', icon: 'calendar' }];

  function AthleteApp(props) {
    var s = props.s, act = props.act;
    var a = s.athletes[s.viewAs];
    var tab = props.tab, setTab = props.setTab;
    var ps = useState(false), profile = ps[0], setProfile = ps[1];
    var ss = useState(false), signup = ss[0], setSignup = ss[1];
    useEffect(function () { setProfile(false); }, [s.viewAs]);
    if (!a) return null;
    var screen;
    var common = { s: s, a: a, act: act, go: setTab, openProfile: function () { setProfile(true); } };
    if (profile) screen = html`<${ProfileScreen} ...${common} back=${function () { setProfile(false); }} startSignup=${function () { setSignup(true); }} />`;
    else if (tab === 'home') screen = html`<${HomeScreen} ...${common} />`;
    else if (tab === 'pathway') screen = html`<${PathwayScreen} ...${common} />`;
    else if (tab === 'record') screen = html`<${RecordScreen} ...${common} />`;
    else if (tab === 'learn') screen = html`<${LearnScreen} ...${common} />`;
    else screen = html`<${EventsScreen} ...${common} />`;
    var hasNew = s.feed.some(function (f) { return f.athlete === a.id && f.kind === 'result' && f.date === TODAY; });
    return html`<div className="phone">
      <main className="phone-screen" key=${tab + profile + a.id}>${screen}</main>
      <${BottomNav} active=${profile ? '' : tab} onSelect=${function (id) { setProfile(false); setTab(id); window.scrollTo(0, 0); }}
        items=${TABS.map(function (t) { return t.id === 'record' && hasNew ? Object.assign({}, t, { badge: 'New result' }) : t; })} className="phone-nav" />
      ${signup ? html`<${Signup} act=${act} close=${function () { setSignup(false); setProfile(false); setTab('home'); }} />` : null}
    </div>`;
  }

  function ScreenHead(props) {
    return html`<header className="scr-head">
      <div className="scr-head-text">${props.eyebrow ? html`<p className="tr-label">${props.eyebrow}</p>` : null}<h1 className="scr-title tr-display">${props.title}</h1></div>
      ${props.right || null}</header>`;
  }

  function HomeScreen(p) {
    var s = p.s, a = p.a, m = medical(a);
    var reg = s.registrations.filter(function (r) { return r.athlete === a.id; }).map(function (r) { return Object.assign({}, r, { ev: s.events.filter(function (e) { return e.id === r.event; })[0] }); })
      .filter(function (r) { return r.ev && r.ev.date >= TODAY; }).sort(function (x, y) { return x.ev.date < y.ev.date ? -1 : 1; })[0];
    var skills = Object.keys(a.skills).map(function (k) { return a.skills[k]; });
    var strong = skills.filter(function (x) { return x.value >= 80; }).length;
    var pending = skills.filter(function (x) { return x.status === 'pending'; }).length;
    var feed = s.feed.filter(function (f) { return f.athlete === a.id; }).slice(0, 5);
    var grading = s.gradings.filter(function (g) { return g.athlete === a.id && g.status === 'recommended'; })[0];
    var KIND_ICON = { verified: 'check', result: 'card', medical: 'shield', review: 'clock' };
    var rec = recordOf(s, a.id);
    return html`<div className="stack">
      <header className="hero-card theme-dark">
        <${Ring} className="hero-ring" />
        <div className="hero-top">
          <p className="tr-label">${a.division} · ${a.weightClass}${a.nation ? ' · ' + a.nation : ''}</p>
          <button type="button" className="avatar-btn" onClick=${p.openProfile} aria-label="Open your profile"><${Face} a=${a} size=${48} /></button>
        </div>
        <h1 className="hero-name tr-display" style=${nameChars(a)}>${a.first}<br/>${isMinor(a) ? a.last.charAt(0) + '.' : a.last}</h1>
        <div className="hero-stats">
          <${Record} wins=${rec.wins} losses=${rec.losses} draws=${rec.draws} animate=${true} />
          <div className="hero-level"><span className="tr-label">Level</span><span className="hero-level-name"><${Icon} name="check" size=${16} strokeWidth=${3} />${LEVELS[a.level]}</span></div>
        </div>
      </header>
      <${ClearanceCard} status=${m.status} title=${medicalTitle(m)} until=${m.until ? fmt(m.until).toUpperCase() : null} issuedBy=${m.by}>
        ${m.status === 'suspended' ? html`<p className="small">${m.reason}. Your coach can't book you for contact sparring until then.</p>` : null}
        ${m.missing || m.status === 'pending' ? html`<p className="small">Book a pre-competition medical before your next registration closes.</p>` : null}
      <//>
      <section className="card">
        <div className="card-head"><h2 className="tr-label">Next event</h2>${reg ? html`<${Badge} status="cleared">Registered<//>` : null}</div>
        ${reg ? html`<div className="next-event"><${DateTile} date=${reg.ev.date} /><div className="next-event-text"><p className="headline tr-display">${reg.ev.name}</p><p className="muted small">${reg.ev.city} · ${reg.weightClass}</p></div>
          <div className="countdown"><span className="countdown-num">${days(TODAY, reg.ev.date)}</span><span className="tr-label">days</span></div></div>`
          : html`<p className="muted">You're not registered for anything yet.</p><${Button} size="sm" onClick=${function () { p.go('events'); }}>Browse events<//>`}
      </section>
      <section className="card">
        <div className="card-head"><h2 className="tr-label">Pathway</h2><button type="button" className="link-btn" onClick=${function () { p.go('pathway'); }}>Open</button></div>
        <${LevelLadder} levels=${LEVELS} current=${a.level} />
        <p className="small muted">${strong} of ${skills.length} skills verified at 80% or more${pending ? ' · ' + pending + ' awaiting your coach' : ''}.</p>
        ${grading ? html`<${Badge} status="pending">Recommended for ${LEVELS[grading.to]} · awaiting grading panel<//>` : null}
      </section>
      <section className="card">
        <h2 className="tr-label">On your record</h2>
        ${feed.length ? html`<ul className="feed">${feed.map(function (f) {
          return html`<li key=${f.id}><span className=${'feed-icon feed-' + f.kind}><${Icon} name=${KIND_ICON[f.kind] || 'check'} size=${16} /></span><div><p>${f.text}</p><p className="data muted">${fmt(f.date)}</p></div></li>`;
        })}</ul>` : html`<p className="muted">Nothing yet. Verified skills, results and medicals will appear here.</p>`}
      </section>
    </div>`;
  }

  function PathwayScreen(p) {
    var a = p.a, act = p.act;
    var minor = isMinor(a);
    return html`<div className="stack">
      <${ScreenHead} eyebrow=${'Level ' + (a.level + 1) + ' of ' + LEVELS.length} title="Pathway" />
      <${LevelLadder} levels=${LEVELS} current=${a.level} />
      <p className="note"><${Icon} name="lock" size=${16} /> Only ${coachName(a.coach)} can move these meters, after seeing the skill in person. Learn videos prepare you; they never change a meter.</p>
      ${D.AREAS.map(function (area) {
        return html`<section key=${area.id} className="card">
          <h2 className="tr-label">${area.name}${area.id === 'safety' && minor ? ' · junior ruleset' : ''}</h2>
          <div className="skills">${area.skills.map(function (pair) {
            var x = a.skills[pair[0]];
            return html`<div key=${pair[0]} className="skill-row">
              <${SkillMeter} skill=${pair[1]} value=${x.value} status=${x.status === 'pending' ? 'pending' : x.value >= 100 ? 'verified' : 'neutral'}
                verifiedBy=${x.by ? coachName(x.by) : null} date=${x.date ? fmt(x.date) : null} />
              ${x.status === 'pending' ? html`<p className="small muted">You asked for a check at ${x.requested}% on ${fmt(x.requestedOn)}.</p>`
                : x.value < 100 ? html`<${Button} size="sm" variant="quiet" icon="clock" onClick=${function () { act({ type: 'request', athlete: a.id, skill: pair[0] }, 'Check requested. ' + coachName(a.coach) + ' will see it on their roster.'); }}>Ask coach to check<//>` : null}
            </div>`;
          })}</div></section>`;
      })}
    </div>`;
  }

  function boutResultLabel(b) { return b.result === 'win' ? 'W' : b.result === 'loss' ? 'L' : 'D'; }
  function RecordScreen(p) {
    var s = p.s, a = p.a;
    var bs = useState(null), open = bs[0], setOpen = bs[1];
    var list = boutsOf(s, a.id), rec = recordOf(s, a.id);
    var bout = open ? list.filter(function (b) { return b.id === open; })[0] : null;
    return html`<div className="stack">
      <${ScreenHead} eyebrow="Verified record" title="Record" />
      <section className="card record-hero">
        <${Record} wins=${rec.wins} losses=${rec.losses} draws=${rec.draws} animate=${true} />
        <p className="small muted">${list.length} bouts. Every result here was written by the event's officials from a signed bout sheet. You can't add or edit one yourself.</p>
      </section>
      <${WinMethods} bouts=${list} />
      ${list.length ? html`<ul className="bouts">${list.map(function (b) {
        return html`<li key=${b.id}><button type="button" className="bout-row" onClick=${function () { setOpen(b.id); }}>
          <span className=${'res res-' + b.result}>${boutResultLabel(b)}</span>
          <span className="bout-main"><span className="bout-opp">vs ${b.opponent} <span className="muted">(${b.oppNation})</span></span>
            <span className="small muted">${b.event} · ${fmt(b.date)}</span>
            <span className="small">${b.method}${b.judges ? '' : ' · R' + b.round + ' ' + b.time}</span></span>
          <span className=${'corner-dot corner-' + b.corner} aria-label=${b.corner + ' corner'}></span></button></li>`;
      })}</ul>` : html`<p className="muted">No bouts yet. Your first result appears here after your first event.</p>`}
      ${bout ? html`<${Sheet} title=${bout.event} onClose=${function () { setOpen(null); }} wide=${true}>
        <p className="small muted">${bout.city} · ${fmt(bout.date)} · ${a.division} ${a.weightClass}</p>
        <${FaceOff} red=${bout.corner === 'red' ? nameOf(a) : bout.opponent} blue=${bout.corner === 'blue' ? nameOf(a) : bout.opponent}
          redNation=${bout.corner === 'red' ? a.nation : bout.oppNation} blueNation=${bout.corner === 'blue' ? a.nation : bout.oppNation} />
        ${bout.judges ? html`<${Scorecard} red=${bout.corner === 'red' ? nameOf(a) : bout.opponent} blue=${bout.corner === 'blue' ? nameOf(a) : bout.opponent}
            judges=${bout.judges} verifiedBy=${'Bout sheet signed · ' + bout.official} hideCorners=${true}
            result=${{ winner: bout.result === 'draw' ? null : (bout.result === 'win') === (bout.corner === 'red') ? 'red' : 'blue', method: bout.method }} />`
          : html`<div className="card"><div className="row-between"><${CornerTag} corner=${bout.corner}>${nameOf(a)}<//><span className=${'res res-' + bout.result}>${boutResultLabel(bout)}</span></div>
            <p className="headline tr-display">${bout.method}</p><p className="muted">Round ${bout.round} · ${bout.time}</p>
            <${Badge} status="verified">Bout sheet signed · ${bout.official}<//></div>`}
      <//>` : null}
    </div>`;
  }

  function LearnScreen(p) {
    var s = p.s, a = p.a, act = p.act;
    var us = useState(null), buying = us[0], setBuying = us[1];
    return html`<div className="stack">
      <${ScreenHead} eyebrow="Video library" title="Learn" />
      <p className="note"><${Icon} name="play" size=${16} /> Libraries open one level at a time. Watching prepares you for your coach; it never moves your pathway.</p>
      ${s.library.map(function (lib) {
        var unlocked = a.unlocked.indexOf(lib.level) >= 0;
        var reachable = lib.level <= a.level + 1;
        return html`<section key=${lib.level} className=${'card lib' + (unlocked ? '' : ' lib-locked')}>
          <div className="card-head"><div><p className="tr-label">Level ${lib.level + 1}</p><h2 className="headline tr-display">${LEVELS[lib.level]}</h2></div>
            ${unlocked ? html`<${Badge} status="cleared">Unlocked<//>` : reachable ? html`<${Button} size="sm" variant="primary" icon="lock" onClick=${function () { setBuying(lib); }}>Unlock · $${lib.price}<//>` : html`<${Badge}>Opens at ${LEVELS[lib.level - 1]}<//>`}</div>
          <ul className="videos">${lib.videos.map(function (v) {
            var watched = a.watched.indexOf(v[0]) >= 0;
            return html`<li key=${v[0]}><button type="button" className="video-row" disabled=${!unlocked} onClick=${function () { act({ type: 'watch', athlete: a.id, video: v[0] }, 'Marked as watched. Show ' + coachName(a.coach) + ' when you are ready.'); }}>
              <span className="video-play"><${Icon} name=${unlocked ? 'play' : 'lock'} size=${20} /></span>
              <span className="video-title">${v[1]}</span><span className="data muted">${watched ? 'Watched' : v[2]}</span></button></li>`;
          })}</ul></section>`;
      })}
      ${buying ? html`<${Confirm} title=${'Unlock the ' + LEVELS[buying.level] + ' library'} confirmLabel=${'Unlock for $' + buying.price + ' (demo)'}
        onCancel=${function () { setBuying(null); }}
        onConfirm=${function () { act({ type: 'unlock', athlete: a.id, level: buying.level }, LEVELS[buying.level] + ' library unlocked.'); setBuying(null); }}>
        One payment opens all ${buying.videos.length} videos for this level. This is a demo, so no payment is taken. In the real app, payment runs through Stripe Checkout and TrueRound never sees card details.<//>` : null}
    </div>`;
  }

  function EventsScreen(p) {
    var s = p.s, a = p.a, act = p.act;
    var cs = useState(null), checking = cs[0], setChecking = cs[1];
    var ev = checking ? s.events.filter(function (e) { return e.id === checking; })[0] : null;
    var checks = ev ? eligibility(a, ev) : [];
    var ok = checks.every(function (c) { return c.ok; });
    return html`<div className="stack">
      <${ScreenHead} eyebrow="Competitions" title="Events" />
      ${s.events.map(function (e) {
        var reg = s.registrations.some(function (r) { return r.event === e.id && r.athlete === a.id; });
        return html`<section key=${e.id} className="card event">
          <div className="card-head"><p className="tr-label">${e.scope} · ${e.divisions.join(' and ')}</p>${reg ? html`<${Badge} status="cleared">Registered · ${a.weightClass}<//>` : null}</div>
          <div className="event-row"><${DateTile} date=${e.date} /><div className="next-event-text"><h2 className="headline tr-display">${e.name}</h2>
          <p className="muted small">${e.city} · registration closes ${fmt(e.closes)}</p></div></div>
          <div className="btn-row">${reg ? html`<${Button} size="sm" variant="quiet" onClick=${function () { act({ type: 'withdraw', event: e.id, athlete: a.id }, 'Withdrawn from ' + e.name + '.'); }}>Withdraw<//>`
            : html`<${Button} size="sm" onClick=${function () { setChecking(e.id); }}>Check eligibility<//>`}</div>
        </section>`;
      })}
      ${ev ? html`<${Sheet} title=${ev.name} onClose=${function () { setChecking(null); }}>
        <p className="muted">${ev.city} · ${fmt(ev.date)} · ${isMinor(a) ? 'Junior' : 'Senior'} ${a.weightClass}</p>
        <ul className="checks">${checks.map(function (c, i) { return html`<li key=${i} className=${c.ok ? 'ok' : 'no'}><${Icon} name=${c.ok ? 'check' : 'ban'} size=${18} /><span>${c.label}</span></li>`; })}</ul>
        <div className="btn-row"><${Button} variant="primary" block=${true} disabled=${!ok}
          onClick=${function () { act({ type: 'register', event: ev.id, athlete: a.id }, 'Registered for ' + ev.name + '.', 'cleared'); setChecking(null); }}>${ok ? 'Register' : 'Not eligible yet'}<//></div>
      <//>` : null}
    </div>`;
  }

  function ProfileScreen(p) {
    var s = p.s, a = p.a, act = p.act;
    var minor = isMinor(a), rec = recordOf(s, a.id);
    var vs = useState(null), view = vs[0], setView = vs[1];
    var exportData = view === 'export' ? JSON.stringify({ athlete: a, bouts: boutsOf(s, a.id), registrations: s.registrations.filter(function (r) { return r.athlete === a.id; }), feed: s.feed.filter(function (f) { return f.athlete === a.id; }) }, null, 2) : '';
    function copy() {
      try { navigator.clipboard.writeText(exportData).then(function () { act({ type: 'noop' }, 'Copied to clipboard.'); }, function () { act({ type: 'noop' }, 'Select the text and copy it.'); }); }
      catch (e) { act({ type: 'noop' }, 'Select the text and copy it.'); }
    }
    return html`<div className="stack">
      <div className="row-between"><button type="button" className="link-btn" onClick=${p.back}>← Back</button><span className="tr-label">Profile</span></div>
      ${minor ? html`<${AthleteCard} name=${nameOf(a)} gym=${a.gym} level=${LEVELS[a.level]} footer="Under 18: name, gym and level only. Record, weight and nation stay private." />`
        : html`<${AthleteCard} name=${nameOf(a)} photo=${photoOf(a)} gym=${a.gym} coach=${coachName(a.coach)} record=${rec} level=${LEVELS[a.level]} weightClass=${a.weightClass} nation=${a.nation} verified=${rec.wins + rec.losses + rec.draws > 0} />`}
      <div className="btn-row"><${Button} block=${true} icon="user" disabled=${minor || !a.privacy.shareCards} onClick=${function () { setView('share'); }}>${minor ? 'Share cards are off for under-18s' : a.privacy.shareCards ? 'Preview share card' : 'Share cards are off'}<//></div>
      ${minor && a.guardian ? html`<section className="card"><h2 className="tr-label">Guardian</h2><p>Managed by <strong>${a.guardian.name}</strong> (${a.guardian.email}). Consent recorded ${fmt(a.guardian.consentOn)}.</p><p className="small muted">Your guardian can view, export or delete this account at any time.</p></section>` : null}
      <section className="card"><h2 className="tr-label">Privacy and sharing</h2>
        <${Toggle} id="pv-public" label="Public fighter page" hint=${minor ? 'Guardian-controlled while under 18. Off, and hidden from search engines.' : 'Your verified record on a page search engines can find.'}
          checked=${!minor && a.privacy.publicPage} disabled=${minor} onChange=${function (v) { act({ type: 'privacy', athlete: a.id, key: 'publicPage', value: v }, v ? 'Public page on.' : 'Public page off.'); }} />
        <${Toggle} id="pv-share" label="Share cards" hint="Auto-made cards when a promotion or result is verified." checked=${!minor && a.privacy.shareCards} disabled=${minor}
          onChange=${function (v) { act({ type: 'privacy', athlete: a.id, key: 'shareCards', value: v }); }} />
        <${Toggle} id="pv-mkt" label="News and offers" hint="Off unless you turn it on." checked=${a.privacy.marketing} onChange=${function (v) { act({ type: 'privacy', athlete: a.id, key: 'marketing', value: v }); }} />
      </section>
      <section className="card"><h2 className="tr-label">Your data</h2>
        <p className="small muted">TrueRound keeps your name, date of birth, gym, coach, verified skills and results, and the status and dates of your medicals. It never stores a diagnosis.</p>
        <div className="btn-row"><${Button} size="sm" onClick=${function () { setView('export'); }}>Download my data<//><${Button} size="sm" variant="danger" onClick=${function () { setView('delete'); }}>Delete account<//></div>
      </section>
      <section className="card"><h2 className="tr-label">Try it</h2><p className="small muted">See the sign-up flow a new athlete goes through, including the under-18 guardian step.</p>
        <${Button} size="sm" onClick=${p.startSignup}>Start sign-up flow<//></section>
      <p className="small muted about">TrueRound is a concept prototype prepared for a partnership proposal. It is not an official product of GAMMA or of any federation. Every athlete, coach, gym, official and event in it is fictional, except Mohammad Mortada, added on request; that profile's record is demo data too.</p>
      ${view === 'share' ? html`<${Sheet} title="Share card" onClose=${function () { setView(null); }}>
        <div className="share-card theme-dark">
          <div className="share-top"><${Mark} size=${28} /><span className="wordmark">TrueRound</span>${photoOf(a) ? html`<img className="share-photo" src=${photoOf(a)} alt="" width="64" height="64" />` : null}</div>
          <p className="tr-label share-kicker">Verified record</p>
          <p className="share-name tr-display" style=${nameChars(a)}>${a.first}<br/>${a.last}</p>
          <p className="share-sub">${a.gym} · ${LEVELS[a.level]} · ${a.weightClass}</p>
          <div className="share-rec"><${Record} wins=${rec.wins} losses=${rec.losses} draws=${rec.draws} /></div>
          <p className="data share-url">trueround.app/${(a.first + '-' + a.last).toLowerCase()}</p>
        </div>
        <p className="small muted">In the app this saves as an image sized for Instagram and links to the public page.</p><//>` : null}
      ${view === 'export' ? html`<${Sheet} title="Your data" onClose=${function () { setView(null); }} wide=${true}>
        <p className="small muted">Everything TrueRound holds about this account, as JSON.</p>
        <pre className="export" tabIndex="0">${exportData}</pre>
        <div className="btn-row"><${Button} size="sm" onClick=${copy}>Copy<//></div><//>` : null}
      ${view === 'delete' ? html`<${Confirm} title=${'Delete ' + nameOf(a) + "'s account?"} confirmLabel="Delete account" danger=${true}
        onCancel=${function () { setView(null); }} onConfirm=${function () { act({ type: 'delete', id: a.id }, 'Account and its data deleted.'); }}>
        This removes the profile, verified skills, results, registrations and the public page. In the real app it also asks search engines to drop the page. It can't be undone.<//>` : null}
    </div>`;
  }

  function Signup(props) {
    var act = props.act;
    var st = useState(0), step = st[0], setStep = st[1];
    var fs = useState({ first: '', last: '', email: '', dob: '', gName: '', gEmail: '', gConsent: false, federation: 'Lebanon', gym: 'Cedar Combat Club', weight: '61 kg', publicPage: false, shareCards: false, marketing: false });
    var f = fs[0], setF = fs[1];
    function set(k) { return function (e) { var v = e && e.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e; setF(Object.assign({}, f, (function () { var o = {}; o[k] = v; return o; })())); }; }
    var years = f.dob ? age(f.dob) : null;
    var minor = years !== null && years < 18;
    var tooYoung = years !== null && years < 8;
    var steps = ['Account', 'Age', 'Guardian', 'Club', 'Sharing'];
    function next() { if (step === 1 && !minor) setStep(3); else setStep(step + 1); }
    function back() { if (step === 3 && !minor) setStep(1); else setStep(Math.max(0, step - 1)); }
    function finish() {
      var id = (f.first + '-' + f.last).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + uid().slice(0, 3);
      var sk = {};
      Object.keys(SKILL_NAMES).forEach(function (k) { sk[k] = { value: 0, status: 'none', by: null, date: null }; });
      act({ type: 'create', athlete: { id: id, first: f.first.trim(), last: f.last.trim(), dob: f.dob, nation: f.federation.slice(0, 3).toUpperCase(), gym: f.gym, coach: 'hassan', weightClass: f.weight, division: (minor ? 'Junior' : 'Senior') + ' athlete', level: 0, email: minor ? f.gEmail : f.email,
        guardian: minor ? { name: f.gName, email: f.gEmail, consentOn: TODAY } : undefined, clearance: null, suspension: null,
        privacy: { publicPage: !minor && f.publicPage, shareCards: !minor && f.shareCards, marketing: f.marketing }, skills: sk, unlocked: [0], watched: [] } }, 'Welcome to TrueRound, ' + f.first.trim() + '.');
      props.close();
    }
    var valid = [f.first.trim() && f.last.trim() && /.+@.+\..+/.test(f.email), years !== null && !tooYoung && years < 100, f.gName.trim() && /.+@.+\..+/.test(f.gEmail) && f.gConsent, true, true][step];
    var body;
    if (step === 0) body = html`<div className="form"><p className="muted">Your verified pathway, record and medical status in one place.</p>
      <${Field} id="su-first" label="First name" value=${f.first} onChange=${set('first')} autoComplete="given-name" />
      <${Field} id="su-last" label="Last name" value=${f.last} onChange=${set('last')} autoComplete="family-name" />
      <${Field} id="su-email" label="Email" type="email" value=${f.email} onChange=${set('email')} autoComplete="email" /></div>`;
    else if (step === 1) body = html`<div className="form"><${Field} id="su-dob" label="Date of birth" type="date" value=${f.dob} onChange=${set('dob')} max=${TODAY}
        hint="We ask so we can apply the right protections for your age." error=${tooYoung ? 'Athletes must be at least 8 to join.' : null} />
      ${years !== null && !tooYoung ? html`<p className="note">${minor ? html`<${Icon} name="shield" size=${16} /> You're ${years}. A parent or guardian creates and manages your account, and your profile stays private.` : html`<${Icon} name="check" size=${16} /> You're ${years}. You manage your own account.`}</p>` : null}</div>`;
    else if (step === 2) body = html`<div className="form"><p className="muted">Under-18 accounts are created through a parent or guardian, who can view, export or delete the data at any time.</p>
      <${Field} id="su-gname" label="Guardian's full name" value=${f.gName} onChange=${set('gName')} />
      <${Field} id="su-gemail" label="Guardian's email" type="email" value=${f.gEmail} onChange=${set('gEmail')} hint="We send the consent request here." />
      <label className="check-line" htmlFor="su-gconsent"><input id="su-gconsent" type="checkbox" checked=${f.gConsent} onChange=${set('gConsent')} /> <span>I am the parent or guardian and I consent to this account being created.</span></label></div>`;
    else if (step === 3) body = html`<div className="form">
      <div className="tr-field"><label htmlFor="su-fed">National federation</label><select id="su-fed" value=${f.federation} onChange=${set('federation')}>${D.federations.map(function (x) { return html`<option key=${x}>${x}</option>`; })}</select></div>
      <div className="tr-field"><label htmlFor="su-gym">Gym</label><select id="su-gym" value=${f.gym} onChange=${set('gym')}>${D.gyms.map(function (g) { return html`<option key=${g.id} value=${g.name}>${g.name} · ${g.city}</option>`; })}</select></div>
      <div className="tr-field"><label htmlFor="su-wt">Weight class</label><select id="su-wt" value=${f.weight} onChange=${set('weight')}>${['48 kg', '52 kg', '57 kg', '61 kg', '66 kg', '70 kg', '77 kg', '84 kg', '93 kg', '120 kg'].map(function (x) { return html`<option key=${x}>${x}</option>`; })}</select></div>
      <p className="note"><${Icon} name="user" size=${16} /> Your coach at this gym, Hassan Jizzini, is the only person who can verify your skills.</p></div>`;
    else body = html`<div className="form"><p className="muted">Pathway tracking is required. Everything else is your choice and can change later.</p>
      <${Toggle} id="su-core" label="Pathway tracking" hint="Required: your coach verifies your skills here." checked=${true} disabled=${true} />
      <${Toggle} id="su-public" label="Public fighter page" hint=${minor ? 'Off for under-18s. Your guardian can choose later.' : 'Lets clubs and scouts find your verified record.'} checked=${!minor && f.publicPage} disabled=${minor} onChange=${set('publicPage')} />
      <${Toggle} id="su-share" label="Share cards" hint=${minor ? 'Off for under-18s.' : 'Auto-made cards for promotions and results.'} checked=${!minor && f.shareCards} disabled=${minor} onChange=${set('shareCards')} />
      <${Toggle} id="su-mkt" label="News and offers" hint="Off unless you turn it on." checked=${f.marketing} onChange=${set('marketing')} /></div>`;
    return html`<${Sheet} title="Join TrueRound" onClose=${props.close}>
      <ol className="steps">${steps.map(function (n, i) { var skip = i === 2 && years !== null && !minor; return html`<li key=${n} className=${(i < step ? 'done' : i === step ? 'on' : '') + (skip ? ' skip' : '')}><span></span>${n}</li>`; })}</ol>
      ${body}
      <div className="btn-row">${step > 0 ? html`<${Button} variant="quiet" onClick=${back}>Back<//>` : null}
        ${step < 4 ? html`<${Button} variant="primary" disabled=${!valid} onClick=${next}>Continue<//>` : html`<${Button} variant="primary" onClick=${finish}>Create account<//>`}</div>
    <//>`;
  }

  /* ---------- coach portal ---------- */
  function CoachPortal(props) {
    var s = props.s, act = props.act;
    var coach = D.coaches.hassan;
    var roster = Object.keys(s.athletes).map(function (k) { return s.athletes[k]; }).filter(function (a) { return a.coach === 'hassan'; });
    var requests = [];
    roster.forEach(function (a) { Object.keys(a.skills).forEach(function (k) { if (a.skills[k].status === 'pending') requests.push({ athlete: a, skill: k, x: a.skills[k] }); }); });
    var tab = props.tab, setTab = props.setTab;
    var suspended = roster.filter(function (a) { return medical(a).status === 'suspended'; }).length;
    var due = roster.filter(function (a) { var m = medical(a); return m.status === 'pending'; }).length;
    var tiles = [
      { label: 'Athletes', n: roster.length, go: 'roster' },
      { label: 'Checks waiting', n: requests.length, go: 'verify', tone: requests.length ? 'caution' : '' },
      { label: 'Suspended', n: suspended, go: 'sparring', tone: suspended ? 'stop' : '' },
      { label: 'Medical due', n: due, go: 'roster', tone: due ? 'caution' : '' }
    ];
    var body;
    if (tab === 'roster') body = html`<${CoachRoster} s=${s} roster=${roster} act=${act} />`;
    else if (tab === 'verify') body = html`<${CoachVerify} requests=${requests} act=${act} />`;
    else if (tab === 'sparring') body = html`<${CoachSparring} s=${s} roster=${roster} act=${act} />`;
    else body = html`<${Gradings} s=${s} mode="coach" act=${act} />`;
    return html`<div className="portal">
      <header className="portal-head"><div><p className="tr-label">Coach portal · synced with the app</p><h1 className="scr-title tr-display">${coach.name}</h1>
        <p className="muted">${coach.gym} · ${coach.licence}</p></div>
        <p className="small muted portal-scope"><${Icon} name="lock" size=${16} /> You see only athletes assigned to you.</p></header>
      <div className="tiles">${tiles.map(function (t) {
        return html`<button key=${t.label} type="button" className=${'tile' + (t.tone ? ' tile-' + t.tone : '')} onClick=${function () { setTab(t.go); }}>
          <span className="tile-num"><${Num} n=${t.n} /></span><span className="tr-label">${t.label}</span></button>`;
      })}</div>
      <${Seg} label="Coach sections" value=${tab} onChange=${setTab} options=${[['roster', 'Roster'], ['verify', 'Verify', requests.length || null], ['sparring', 'Sparring plan'], ['gradings', 'Gradings']]} />
      ${body}</div>`;
  }

  function CoachRoster(props) {
    var s = props.s, act = props.act;
    return html`<div className="table-wrap"><table className="data-table">
      <thead><tr><th scope="col">Athlete</th><th scope="col">Level</th><th scope="col">Medical</th><th scope="col">Checks</th><th scope="col">Record</th><th scope="col"><span className="sr">Actions</span></th></tr></thead>
      <tbody>${props.roster.map(function (a) {
        var m = medical(a), rec = recordOf(s, a.id);
        var pend = Object.keys(a.skills).filter(function (k) { return a.skills[k].status === 'pending'; }).length;
        var graded = s.gradings.some(function (g) { return g.athlete === a.id && g.status === 'recommended'; });
        return html`<tr key=${a.id}>
          <th scope="row"><div className="who"><span className="mini-avatar" aria-hidden="true"><${Face} a=${a} size=${36} /></span><div className="who-text"><span className="cell-name">${nameOf(a)}</span><span className="small muted">${a.division} · ${a.weightClass}${isMinor(a) ? ' · guardian-managed' : ''}</span></div></div></th>
          <td>${LEVELS[a.level]}</td><td>${medicalBadge(m)}</td>
          <td>${pend ? html`<${Badge} status="pending">${pend} waiting<//>` : html`<span className="muted">None</span>`}</td>
          <td className="mono">${rec.wins}-${rec.losses}-${rec.draws}</td>
          <td>${a.level >= LEVELS.length - 1 ? html`<span className="small muted">Top level</span>` : graded ? html`<${Badge} status="pending">At grading panel<//>`
            : html`<${Button} size="sm" variant="quiet" onClick=${function () { act({ type: 'recommend', athlete: a.id }, nameOf(a) + ' recommended for ' + LEVELS[a.level + 1] + '.'); }}>Recommend for ${LEVELS[a.level + 1]}<//>`}</td></tr>`;
      })}</tbody></table></div>`;
  }

  function CoachVerify(props) {
    var act = props.act, reqs = props.requests;
    var vs = useState({}), values = vs[0], setValues = vs[1];
    var ss = useState({}), sel = ss[0], setSel = ss[1];
    function key(r) { return r.athlete.id + ':' + r.skill; }
    function valueOf(r) { return values[key(r)] !== undefined ? values[key(r)] : r.x.requested; }
    var chosen = reqs.filter(function (r) { return sel[key(r)]; });
    if (!reqs.length) return html`<div className="card empty"><${Icon} name="check" size=${24} /><p>No checks waiting. Athletes ask for one from their Pathway screen after a session.</p></div>`;
    return html`<div className="stack">
      <div className="row-between"><p className="muted">Verify only what you have seen in person. Each verification is signed with your licence.</p>
        <${Button} variant="primary" icon="check" disabled=${!chosen.length}
          onClick=${function () { act({ type: 'verify', items: chosen.map(function (r) { return { athlete: r.athlete.id, skill: r.skill, value: valueOf(r) }; }) }, 'Verified ' + chosen.length + ' skill' + (chosen.length === 1 ? '' : 's') + '.', 'verified'); setSel({}); }}>Verify selected (${chosen.length})<//></div>
      <ul className="requests">${reqs.map(function (r) {
        var k = key(r);
        return html`<li key=${k} className="card request">
          <label className="request-pick" htmlFor=${'rq-' + k}><input id=${'rq-' + k} type="checkbox" checked=${!!sel[k]} onChange=${function (e) { var o = Object.assign({}, sel); o[k] = e.target.checked; setSel(o); }} /><span className="sr">Select</span></label>
          <div className="request-main"><p className="cell-name">${nameOf(r.athlete)} · ${SKILL_NAMES[r.skill]}</p>
            <p className="small muted">Now ${r.x.value}% · asked for ${r.x.requested}% on ${fmt(r.x.requestedOn)}</p></div>
          <div className="tr-field request-value"><label htmlFor=${'rv-' + k}>Verify at</label>
            <select id=${'rv-' + k} value=${valueOf(r)} onChange=${function (e) { var o = Object.assign({}, values); o[k] = Number(e.target.value); setValues(o); }}>
              ${[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].filter(function (v) { return v > r.x.value; }).map(function (v) { return html`<option key=${v} value=${v}>${v}%</option>`; })}</select></div>
          <div className="btn-row"><${Button} size="sm" variant="primary" onClick=${function () { act({ type: 'verify', items: [{ athlete: r.athlete.id, skill: r.skill, value: valueOf(r) }] }, 'Verified ' + SKILL_NAMES[r.skill] + ' for ' + r.athlete.first + '.', 'verified'); }}>Verify<//>
            <${Button} size="sm" variant="quiet" onClick=${function () { act({ type: 'notYet', athlete: r.athlete.id, skill: r.skill }, 'Sent back to ' + r.athlete.first + ': not yet.'); }}>Not yet<//></div>
        </li>`;
      })}</ul></div>`;
  }

  function CoachSparring(props) {
    var s = props.s, act = props.act;
    var ds = useState(addDays(TODAY, 3)), date = ds[0], setDate = ds[1];
    var ps = useState({}), picked = ps[0], setPicked = ps[1];
    var chosen = props.roster.filter(function (a) { return picked[a.id]; });
    return html`<div className="stack">
      <p className="muted">Plan a contact sparring session. Athletes who are suspended or have no valid medical on that date can't be added.</p>
      <div className="card"><div className="spar-top"><${Field} id="spar-date" label="Session date" type="date" value=${date} min=${TODAY} onChange=${function (e) { setDate(e.target.value); setPicked({}); }} /></div>
        <ul className="spar-list">${props.roster.map(function (a) {
          var m = medical(a, date), blocked = m.status === 'suspended' || m.missing;
          return html`<li key=${a.id} className=${blocked ? 'blocked' : ''}><label htmlFor=${'sp-' + a.id}>
            <input id=${'sp-' + a.id} type="checkbox" disabled=${blocked} checked=${!!picked[a.id]} onChange=${function (e) { var o = Object.assign({}, picked); o[a.id] = e.target.checked; setPicked(o); }} />
            <span className="cell-name">${nameOf(a)}</span>
            <span className="small muted">${m.status === 'suspended' ? 'Suspended: no contact until ' + fmt(m.until) : m.missing ? 'No valid medical on this date' : isMinor(a) ? 'Junior ruleset' : a.weightClass}</span></label></li>`;
        })}</ul>
        <div className="btn-row"><${Button} variant="primary" disabled=${!chosen.length} onClick=${function () { act({ type: 'book', date: date, athletes: chosen.map(function (a) { return a.id; }) }, 'Session booked for ' + fmt(date) + '.'); setPicked({}); }}>Book session (${chosen.length})<//></div></div>
      ${s.sparring.length ? html`<section className="card"><h2 className="tr-label">Booked</h2><ul className="plain">${s.sparring.map(function (x) {
        return html`<li key=${x.id}><span className="mono">${fmt(x.date)}</span> · ${x.athletes.map(function (id) { return s.athletes[id] ? nameOf(s.athletes[id]) : 'Removed athlete'; }).join(', ')}</li>`;
      })}</ul></section>` : null}
    </div>`;
  }

  function Gradings(props) {
    var s = props.s, act = props.act, official = props.mode === 'official';
    var list = s.gradings.filter(function (g) { return s.athletes[g.athlete]; });
    if (!list.length) return html`<div className="card empty"><p>No grading recommendations yet. Coaches recommend athletes from their roster.</p></div>`;
    return html`<ul className="requests">${list.map(function (g) {
      var a = s.athletes[g.athlete];
      return html`<li key=${g.id} className="card request">
        <div className="request-main"><p className="cell-name">${nameOf(a)} · ${LEVELS[g.from]} → ${LEVELS[g.to]}</p>
          <p className="small muted">Recommended by ${coachName(g.coach)} on ${fmt(g.on)}${g.decidedOn ? ' · decided ' + fmt(g.decidedOn) : ''}</p></div>
        ${g.status === 'recommended' ? (official ? html`<div className="btn-row"><${Button} size="sm" variant="primary" onClick=${function () { act({ type: 'grading', id: g.id, approve: true }, nameOf(a) + ' promoted to ' + LEVELS[g.to] + '.', 'verified'); }}>Approve promotion<//>
            <${Button} size="sm" variant="quiet" onClick=${function () { act({ type: 'grading', id: g.id, approve: false }, 'Returned to the coach.'); }}>Return to coach<//></div>`
          : html`<${Badge} status="pending">Awaiting grading panel<//>`)
          : g.status === 'approved' ? html`<${Badge} status="verified">Approved<//>` : html`<${Badge}>Returned<//>`}
      </li>`;
    })}</ul>`;
  }

  /* ---------- officials' desk ---------- */
  function OfficialDesk(props) {
    var s = props.s, act = props.act;
    var tab = props.tab, setTab = props.setTab;
    var ms = useState(null), medFor = ms[0], setMedFor = ms[1];
    var pending = s.gradings.filter(function (g) { return g.status === 'recommended' && s.athletes[g.athlete]; }).length;
    var body;
    if (tab === 'bout') body = html`<${BoutForm} s=${s} act=${act} needMedical=${function (id) { setMedFor(id); setTab('medical'); }} />`;
    else if (tab === 'medical') body = html`<${MedicalDesk} s=${s} act=${act} initial=${medFor} />`;
    else body = html`<${Gradings} s=${s} mode="official" act=${act} />`;
    return html`<div className="portal">
      <header className="portal-head"><div><p className="tr-label"><span className="live-dot" aria-hidden="true"></span>Officials' desk · today · ${TONIGHT.city}</p><h1 className="scr-title tr-display">${TONIGHT.name}</h1>
        <p className="muted">Bout sheets, medicals and gradings are written here, and only here.</p></div></header>
      <${Seg} label="Officials sections" value=${tab} onChange=${setTab} options=${[['bout', 'Bout result'], ['medical', 'Medical'], ['gradings', 'Grading panel', pending || null]]} />
      ${body}</div>`;
  }

  var TONIGHT = { name: 'Beirut Open 2026', city: 'Beirut' };
  var METHODS = ['Decision', 'Submission', 'Referee stops contest (strikes)', 'Referee stops contest (injury)', 'Disqualification'];
  function BoutForm(props) {
    var s = props.s, act = props.act;
    var athletes = Object.keys(s.athletes).map(function (k) { return s.athletes[k]; });
    var init = { event: TONIGHT.name, athlete: athletes[0] ? athletes[0].id : '', corner: 'red', opponent: 'Hana Ibrahim', oppNation: 'EGY', method: 'Decision', sub: 'rear-naked choke', winner: 'red', round: 3, time: '3:00', official: 'Official #A-118',
      judges: [[[10, 9], [10, 9], [9, 10]], [[10, 9], [9, 10], [10, 9]], [[10, 9], [10, 9], [10, 9]]] };
    var fs = useState(init), f = fs[0], setF = fs[1];
    var ds = useState(null), done = ds[0], setDone = ds[1];
    function set(k, v) { var o = Object.assign({}, f); o[k] = v; setF(o); }
    function setScore(j, r, c, v) { var js = JSON.parse(JSON.stringify(f.judges)); js[j][r][c] = Number(v); set('judges', js); }
    var a = s.athletes[f.athlete];
    var dec = f.method === 'Decision' ? decisionFrom(f.judges) : null;
    var winnerCorner = dec ? dec.winner : f.winner;
    var redName = f.corner === 'red' ? (a ? nameOf(a) : '') : f.opponent;
    var blueName = f.corner === 'blue' ? (a ? nameOf(a) : '') : f.opponent;
    function sign() {
      var result = !winnerCorner ? 'draw' : winnerCorner === f.corner ? 'win' : 'loss';
      var method = dec ? dec.method : f.method === 'Submission' ? 'Submission (' + f.sub + ')' : f.method;
      var bout = { id: uid(), athlete: a.id, event: f.event, city: TONIGHT.city, date: TODAY, corner: f.corner, opponent: f.opponent, oppNation: f.oppNation.toUpperCase(), result: result, method: method, round: dec ? 3 : Number(f.round), time: dec ? '3:00' : f.time, official: f.official };
      if (dec) bout.judges = f.judges;
      act({ type: 'bout', bout: bout }, 'Bout sheet signed. ' + a.first + "'s record is updated.", 'verified');
      setDone({ athlete: a, result: result, stoppage: result === 'loss' && /Referee stops/.test(method) });
    }
    if (!athletes.length) return html`<p className="muted">No athletes in the registry.</p>`;
    return html`<div className="bout-grid">
      <div className="card form">
        <div className="tr-field"><label htmlFor="bf-event">Event</label><select id="bf-event" value=${f.event} onChange=${function (e) { set('event', e.target.value); }}><option>${TONIGHT.name}</option></select></div>
        <div className="two"><div className="tr-field"><label htmlFor="bf-ath">Registered athlete</label><select id="bf-ath" value=${f.athlete} onChange=${function (e) { set('athlete', e.target.value); }}>${athletes.map(function (x) { return html`<option key=${x.id} value=${x.id}>${nameOf(x)}</option>`; })}</select></div>
          <div className="tr-field"><label htmlFor="bf-corner">Corner</label><select id="bf-corner" value=${f.corner} onChange=${function (e) { set('corner', e.target.value); }}><option value="red">Red</option><option value="blue">Blue</option></select></div></div>
        <div className="two"><${Field} id="bf-opp" label="Opponent" value=${f.opponent} onChange=${function (e) { set('opponent', e.target.value); }} />
          <${Field} id="bf-nat" label="Opponent nation" value=${f.oppNation} maxLength=${3} onChange=${function (e) { set('oppNation', e.target.value); }} /></div>
        <div className="tr-field"><label htmlFor="bf-method">Method</label><select id="bf-method" value=${f.method} onChange=${function (e) { set('method', e.target.value); }}>${METHODS.map(function (m) { return html`<option key=${m}>${m}</option>`; })}</select></div>
        ${f.method === 'Decision' ? html`<div><p className="tr-label">Judges' scores · red : blue</p>
          <div className="judge-grid" role="group" aria-label="Judges' scores">${[0, 1, 2].map(function (j) {
            return html`<div key=${j} className="judge-row"><span className="mono muted">J${j + 1}</span>${[0, 1, 2].map(function (r) {
              return html`<span key=${r} className="score-pair"><select aria-label=${'Judge ' + (j + 1) + ' round ' + (r + 1) + ' red'} className="sc-red" value=${f.judges[j][r][0]} onChange=${function (e) { setScore(j, r, 0, e.target.value); }}>${[10, 9, 8, 7].map(function (v) { return html`<option key=${v}>${v}</option>`; })}</select>
                <select aria-label=${'Judge ' + (j + 1) + ' round ' + (r + 1) + ' blue'} className="sc-blue" value=${f.judges[j][r][1]} onChange=${function (e) { setScore(j, r, 1, e.target.value); }}>${[10, 9, 8, 7].map(function (v) { return html`<option key=${v}>${v}</option>`; })}</select></span>`;
            })}</div>`;
          })}</div></div>`
          : html`<div className="two">${f.method === 'Submission' ? html`<${Field} id="bf-sub" label="Submission" value=${f.sub} onChange=${function (e) { set('sub', e.target.value); }} />` : null}
            <div className="tr-field"><label htmlFor="bf-win">Winner</label><select id="bf-win" value=${f.winner} onChange=${function (e) { set('winner', e.target.value); }}><option value="red">Red corner</option><option value="blue">Blue corner</option></select></div>
            <div className="tr-field"><label htmlFor="bf-round">Round</label><select id="bf-round" value=${f.round} onChange=${function (e) { set('round', e.target.value); }}>${[1, 2, 3].map(function (v) { return html`<option key=${v}>${v}</option>`; })}</select></div>
            <${Field} id="bf-time" label="Time" value=${f.time} onChange=${function (e) { set('time', e.target.value); }} /></div>`}
        <${Field} id="bf-official" label="Signed by" value=${f.official} onChange=${function (e) { set('official', e.target.value); }} hint="Your official ID. It is printed on the athlete's record." />
        <${Button} variant="primary" icon="check" disabled=${!a || !f.opponent.trim()} onClick=${sign}>Sign bout sheet<//>
      </div>
      <div className="stack">
        <p className="tr-label">Preview</p>
        ${dec ? html`<${Scorecard} red=${redName} blue=${blueName} judges=${f.judges} result=${{ winner: dec.winner, method: dec.method }} />`
          : html`<div className="card"><div className="row-between"><${CornerTag} corner="red">${redName}<//><${CornerTag} corner="blue">${blueName}<//></div>
            <p className="headline tr-display">${(f.winner === 'red' ? redName : blueName) || '—'} wins</p><p className="muted">${f.method === 'Submission' ? 'Submission (' + f.sub + ')' : f.method} · R${f.round} ${f.time}</p></div>`}
        ${done ? html`<div className="card"><${Badge} status="verified">Signed<//><p>${nameOf(done.athlete)}'s record now shows this ${done.result}. They see it on their Record tab.</p>
          ${done.stoppage ? html`<p className="note warn"><${Icon} name="shield" size=${16} /> This was a stoppage loss. The event doctor should record a medical suspension.</p>
            <${Button} size="sm" onClick=${function () { props.needMedical(done.athlete.id); }}>Open medical for ${done.athlete.first}<//>` : null}</div>` : null}
      </div></div>`;
  }

  function MedicalDesk(props) {
    var s = props.s, act = props.act;
    var athletes = Object.keys(s.athletes).map(function (k) { return s.athletes[k]; });
    var ids = useState(props.initial && s.athletes[props.initial] ? props.initial : (athletes[0] || {}).id), id = ids[0], setId = ids[1];
    var us = useState(addDays(TODAY, 180)), until = us[0], setUntil = us[1];
    var ss = useState(addDays(TODAY, 30)), suspUntil = ss[0], setSuspUntil = ss[1];
    var rs = useState('Mandatory rest after a stoppage'), reason = rs[0], setReason = rs[1];
    var a = s.athletes[id];
    if (!a) return html`<p className="muted">No athletes in the registry.</p>`;
    var m = medical(a);
    var by = 'Event doctor · Lic. MD-2291';
    return html`<div className="stack">
      <p className="note"><${Icon} name="lock" size=${16} /> TrueRound records the outcome of a medical, never the reason. There is no field for a diagnosis.</p>
      <div className="tr-field med-pick"><label htmlFor="md-ath">Athlete</label><select id="md-ath" value=${id} onChange=${function (e) { setId(e.target.value); }}>${athletes.map(function (x) { return html`<option key=${x.id} value=${x.id}>${nameOf(x)}</option>`; })}</select></div>
      <div className="med-grid">
        <${ClearanceCard} status=${m.status} title=${'Now: ' + medicalTitle(m)} until=${m.until ? fmt(m.until).toUpperCase() : null} issuedBy=${m.by} />
        <section className="card form"><h2 className="title">Record a pre-competition medical</h2>
          <${Field} id="md-until" label="Cleared to compete until" type="date" value=${until} min=${TODAY} onChange=${function (e) { setUntil(e.target.value); }} />
          <${Button} variant="primary" icon="shield" onClick=${function () { act({ type: 'clear', athlete: a.id, until: until, by: by }, nameOf(a) + ' cleared until ' + fmt(until) + '.', 'cleared'); }}>Record clearance<//></section>
        <section className="card form"><h2 className="title">Issue a suspension</h2>
          <${Field} id="md-susp" label="No contact until" type="date" value=${suspUntil} min=${TODAY} onChange=${function (e) { setSuspUntil(e.target.value); }} />
          <div className="tr-field"><label htmlFor="md-reason">Category</label><select id="md-reason" value=${reason} onChange=${function (e) { setReason(e.target.value); }}>
            <option>Mandatory rest after a stoppage</option><option>Event doctor's decision</option></select></div>
          <${Button} variant="danger" icon="ban" onClick=${function () { act({ type: 'suspend', athlete: a.id, until: suspUntil, reason: reason, by: by }, nameOf(a) + ' suspended until ' + fmt(suspUntil) + '. Their coach sees it now.', 'stop'); }}>Issue suspension<//></section>
      </div></div>`;
  }

  /* ---------- guided demo ---------- */
  var GUIDE = [
    { role: 'athlete', tab: 'pathway', title: 'Ask for a check', text: 'As Layla, open Pathway and tap “Ask coach to check” on any skill below 100%.' },
    { role: 'coach', tab: 'verify', title: 'Verify it as the coach', text: 'The request is waiting for Coach Hassan Jizzini. Pick a level and verify it.' },
    { role: 'official', tab: 'bout', title: 'Sign a bout sheet', text: 'Score three rounds as the officials. Signing writes the result to the athlete’s record.' },
    { role: 'official', tab: 'medical', title: 'Issue a suspension', text: 'Record a post-stoppage suspension. The coach’s sparring plan blocks that athlete at once.' },
    { role: 'athlete', tab: 'events', title: 'Check eligibility', text: 'Back as an athlete, try to register. Medical, suspension and level decide, not a form.' }
  ];
  function Guide(props) {
    return html`<div className="guide">
      <p className="tr-label guide-kicker">Guided demo · 2 minutes</p>
      <h2 className="guide-title tr-display">One record,<br/>three roles</h2>
      <p className="small muted">Every change you make here appears for the other roles straight away.</p>
      <ol className="guide-steps">${GUIDE.map(function (g, i) {
        var here = props.role === g.role && props.tab === g.tab;
        return html`<li key=${g.title} className=${here ? 'here' : ''}>
          <span className="guide-n" aria-hidden="true">${i + 1}</span>
          <div className="guide-body"><p className="guide-step">${g.title}</p><p className="small muted">${g.text}</p>
            <button type="button" className="link-btn" onClick=${function () { props.go(g.role, g.tab); }}>${here ? 'You are here' : 'Go there'} →</button></div>
        </li>`;
      })}</ol>
      <p className="small muted">Changes stay in this browser. “Reset demo” restores the starting data.</p>
    </div>`;
  }

  var TOAST_ICON = { verified: 'check', stop: 'ban', cleared: 'shield' };

  /* ---------- root ---------- */
  function App() {
    var st = useReducer(reducer, null, load), s = st[0], dispatch = st[1];
    var ts = useState(null), toast = ts[0], setToast = ts[1];
    var ns = useState({ athlete: 'home', coach: 'roster', official: 'bout' }), nav = ns[0], setNav = ns[1];
    var gs = useState(false), guideOpen = gs[0], setGuideOpen = gs[1];
    var timer = useRef(null);
    useEffect(function () { try { window.localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* storage blocked */ } }, [s]);
    function act(a, msg, kind) {
      if (a.type !== 'noop') dispatch(a);
      if (msg) { setToast({ msg: msg, kind: kind || '' }); clearTimeout(timer.current); timer.current = setTimeout(function () { setToast(null); }, 4000); }
    }
    function setTab(role) { return function (t) { setNav(function (cur) { var o = Object.assign({}, cur); o[role] = t; return o; }); }; }
    function go(role, tab) {
      if (role !== s.role) dispatch({ type: 'role', role: role });
      setTab(role)(tab); setGuideOpen(false); window.scrollTo(0, 0);
    }
    var view = s.role === 'coach' ? html`<${CoachPortal} s=${s} act=${act} tab=${nav.coach} setTab=${setTab('coach')} />`
      : s.role === 'official' ? html`<${OfficialDesk} s=${s} act=${act} tab=${nav.official} setTab=${setTab('official')} />`
      : html`<${AthleteApp} s=${s} act=${act} tab=${nav.athlete} setTab=${setTab('athlete')} />`;
    return html`<div className="shell">
      <${DemoBar} s=${s} act=${act} openGuide=${function () { setGuideOpen(true); }} />
      <div className=${'stage stage-' + s.role}>
        <div className="stage-main">${view}</div>
        ${s.role === 'athlete' ? html`<aside className="stage-guide" aria-label="Guided demo"><${Guide} role=${s.role} tab=${nav[s.role]} go=${go} /></aside>` : null}
      </div>
      ${guideOpen ? html`<${Sheet} title="How to demo" onClose=${function () { setGuideOpen(false); }}><${Guide} role=${s.role} tab=${nav[s.role]} go=${go} /><//>` : null}
      <div className="toast-zone" aria-live="polite">${toast ? html`<div className=${'toast toast-' + (toast.kind || 'plain')} role="status">
        ${TOAST_ICON[toast.kind] ? html`<span className="toast-icon"><${Icon} name=${TOAST_ICON[toast.kind]} size=${16} strokeWidth=${3} /></span>` : null}${toast.msg}</div>` : null}</div>
    </div>`;
  }

  ReactDOM.createRoot(document.getElementById('app')).render(h(App));
})();
