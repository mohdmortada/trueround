(function () {
  var R = window.React, h = R.createElement, html = window.htm.bind(h);
  var useState = R.useState, useReducer = R.useReducer, useEffect = R.useEffect, useRef = R.useRef;
  var T = window.TrueRound, D = window.TR_DATA;
  var Button = T.Button, Badge = T.Badge, CornerTag = T.CornerTag, Icon = T.Icon, Scorecard = T.Scorecard, Record = T.Record,
    LevelLadder = T.LevelLadder, SkillMeter = T.SkillMeter, ClearanceCard = T.ClearanceCard, AthleteCard = T.AthleteCard,
    Field = T.Field, Toggle = T.Toggle, BottomNav = T.BottomNav;
  var STORE_KEY = 'trueround-demo-v4';
  var TODAY = D.TODAY, LEVELS = D.LEVELS;
  // The app is a bright design with dark hero blocks, whatever the system theme.
  document.documentElement.setAttribute('data-theme', 'light');
  // First visit: open on the onboarding welcome instead of the demo athlete.
  var FIRST_VISIT = (function () { try { return !window.localStorage.getItem(STORE_KEY); } catch (e) { return false; } })();

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
          if (a.approve) { ath = n.athletes[g.athlete]; ath.level = g.to; (ath.history = ath.history || [])[g.to] = TODAY; feedItem(n, g.athlete, 'verified', 'Promoted to ' + LEVELS[g.to] + ' by the federation grading panel.'); }
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
      case 'notify': ath = n.athletes[a.athlete]; ath.notify = Object.assign({ push: true, events: true }, ath.notify); ath.notify[a.key] = a.value; break;
      case 'create': n.athletes[a.athlete.id] = a.athlete; n.viewAs = a.athlete.id; n.role = 'athlete'; feedItem(n, a.athlete.id, 'review', 'Join request sent to Coach ' + coachName(a.athlete.coach) + ' at ' + a.athlete.gym + '.'); break;
      case 'accept':
        ath = n.athletes[a.athlete]; ath.joinStatus = 'active';
        feedItem(n, a.athlete, 'verified', 'Coach ' + coachName(ath.coach) + ' accepted you onto the ' + ath.gym + ' roster.');
        break;
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
  // A photo is either a key into TR_PHOTOS or one the athlete uploaded during onboarding.
  function photoOf(a) {
    if (!a.photo || isMinor(a)) return null;
    return a.photo.indexOf('data:image/') === 0 ? a.photo : (window.TR_PHOTOS || {})[a.photo] || null;
  }
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

  // Sheets can stack (a scorecard over a fighter page); Escape closes only the top one.
  var openSheets = [];
  function Sheet(props) {
    var ref = useRef(null), idRef = useRef(uid());
    useEffect(function () {
      var id = idRef.current;
      openSheets.push(id);
      function onKey(e) { if (e.key === 'Escape' && openSheets[openSheets.length - 1] === id) props.onClose(); }
      document.addEventListener('keydown', onKey);
      if (ref.current) ref.current.focus();
      return function () { openSheets = openSheets.filter(function (x) { return x !== id; }); document.removeEventListener('keydown', onKey); };
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
        <select id="view-as" value=${s.viewAs} onChange=${function (e) { props.closeOnboarding(); act({ type: 'viewAs', id: e.target.value }); }}>
          ${athletes.map(function (a) { return html`<option key=${a.id} value=${a.id}>${nameOf(a)}${isMinor(a) ? ' (under 18)' : ''}</option>`; })}
        </select></label>` : null}
      <button type="button" className="link-btn" onClick=${props.startOnboarding}>New athlete</button>
      <span className="demobar-date">Demo date ${fmt(TODAY)}</span>
      <button type="button" className="link-btn guide-btn" onClick=${props.openGuide}>How to demo</button>
      <button type="button" className="link-btn" onClick=${function () { setConfirming(true); }}>Reset demo</button>
      ${confirming ? html`<${Confirm} title="Reset the demo?" confirmLabel="Reset" danger=${true}
        onCancel=${function () { setConfirming(false); }} onConfirm=${function () { setConfirming(false); act({ type: 'reset' }, 'Demo data restored.'); }}>
        Every change you made in this browser goes back to the starting data.<//>` : null}
    </div>`;
  }

  /* ---------- athlete app: a phone, with a device frame on wide screens ---------- */
  var TABS = [{ id: 'home', label: 'Home', icon: 'home' }, { id: 'pathway', label: 'Pathway', icon: 'ladder' }, { id: 'learn', label: 'Learn', icon: 'play' }, { id: 'events', label: 'Events', icon: 'calendar' }, { id: 'profile', label: 'Profile', icon: 'user' }];

  function StatusBar() {
    return html`<div className="phone-status" aria-hidden="true"><span>9:41</span><span className="phone-island"></span>
      <span className="phone-icons"><span className="sig"></span><span className="bat"></span></span></div>`;
  }

  function AthleteApp(props) {
    var s = props.s, act = props.act;
    var a = s.athletes[s.viewAs];
    var tab = props.tab, setTab = props.setTab;
    var ss = useState(false), settings = ss[0], setSettings = ss[1];
    useEffect(function () { setSettings(false); }, [s.viewAs, tab]);
    if (props.onboarding) return html`<div className="phone"><${StatusBar} />
      <main className="phone-screen phone-onb"><${Onboarding} act=${act} close=${props.closeOnboarding} /></main></div>`;
    if (!a) return null;
    var screen;
    var common = { s: s, a: a, act: act, go: setTab, openProfile: function () { setTab('profile'); } };
    if (tab === 'profile') screen = settings ? html`<${SettingsScreen} ...${common} back=${function () { setSettings(false); }} startOnboarding=${props.startOnboarding} />`
      : html`<${FighterPage} s=${s} a=${a} act=${act} viewer="self" onSettings=${function () { setSettings(true); }} goPathway=${function () { setTab('pathway'); }} />`;
    else if (tab === 'pathway') screen = html`<${PathwayScreen} ...${common} />`;
    else if (tab === 'learn') screen = html`<${LearnScreen} ...${common} />`;
    else if (tab === 'events') screen = html`<${EventsScreen} ...${common} />`;
    else screen = html`<${HomeScreen} ...${common} />`;
    var hasNew = s.feed.some(function (f) { return f.athlete === a.id && f.kind === 'result' && f.date === TODAY; });
    return html`<div className="phone"><${StatusBar} />
      <main className="phone-screen" key=${tab + settings + a.id}>${screen}</main>
      <${BottomNav} active=${tab} onSelect=${function (id) { setTab(id); window.scrollTo(0, 0); }}
        items=${TABS.map(function (t) { return t.id === 'profile' && hasNew ? Object.assign({}, t, { badge: 'New result' }) : t; })} className="phone-nav" />
    </div>`;
  }

  function ScreenHead(props) {
    return html`<header className="scr-head">
      <div className="scr-head-text">${props.eyebrow ? html`<p className="tr-label">${props.eyebrow}</p>` : null}<h1 className="scr-title tr-display">${props.title}</h1></div>
      ${props.right || null}</header>`;
  }

  function LevelPill(props) {
    return html`<span className="level-pill"><${Icon} name="check" size=${14} strokeWidth=${3} />${LEVELS[props.level]}</span>`;
  }

  function HomeScreen(p) {
    var s = p.s, a = p.a, m = medical(a);
    var reg = s.registrations.filter(function (r) { return r.athlete === a.id; }).map(function (r) { return Object.assign({}, r, { ev: s.events.filter(function (e) { return e.id === r.event; })[0] }); })
      .filter(function (r) { return r.ev && r.ev.date >= TODAY; }).sort(function (x, y) { return x.ev.date < y.ev.date ? -1 : 1; })[0];
    var skills = Object.keys(a.skills).map(function (k) { return Object.assign({ id: k }, a.skills[k]); });
    var strong = skills.filter(function (x) { return x.value >= 80; }).length;
    var pending = skills.filter(function (x) { return x.status === 'pending'; }).length;
    // The skills nearest a check: anything waiting on the coach first, then the highest meters below 100.
    var focus = skills.filter(function (x) { return x.value < 100; })
      .sort(function (x, y) { return (y.status === 'pending') - (x.status === 'pending') || y.value - x.value; }).slice(0, 3);
    var feed = s.feed.filter(function (f) { return f.athlete === a.id; }).slice(0, 4);
    var grading = s.gradings.filter(function (g) { return g.athlete === a.id && g.status === 'recommended'; })[0];
    var KIND_ICON = { verified: 'check', result: 'card', medical: 'shield', review: 'clock' };
    var rec = recordOf(s, a.id), last = boutsOf(s, a.id)[0];
    return html`<div className="stack">
      <header className="home-top">
        <button type="button" className="avatar-btn" onClick=${p.openProfile} aria-label="Open your fighter page"><${Face} a=${a} size=${48} /></button>
        <div className="home-hello"><p className="small muted">${a.since === TODAY ? 'Welcome' : 'Welcome back'}</p><h1 className="home-name tr-display">${a.first}</h1></div>
        <${LevelPill} level=${a.level} />
      </header>
      ${a.joinStatus === 'pending' ? html`<p className="note"><${Icon} name="clock" size=${16} /> Your join request is with Coach ${coachName(a.coach)}. Skill checks open once you're on the roster.</p>` : null}
      <section className="next-up theme-dark">
        <${Ring} className="next-ring" />
        <p className="tr-label next-kicker">Next up</p>
        ${reg ? html`<div className="next-event"><${DateTile} date=${reg.ev.date} /><div className="next-event-text"><p className="headline tr-display">${reg.ev.name}</p><p className="small muted">${reg.ev.city} · ${reg.weightClass} · registered</p></div>
          <div className="countdown"><span className="countdown-num"><${Num} n=${days(TODAY, reg.ev.date)} /></span><span className="tr-label">days</span></div></div>`
          : html`<div className="next-empty"><p className="headline tr-display">No event yet</p><p className="small muted">Pick one and the app checks your eligibility before you register.</p></div>`}
        <div className="btn-row"><${Button} size="sm" variant=${reg ? 'secondary' : 'primary'} onClick=${function () { p.go('events'); }}>${reg ? 'All events' : 'Browse events'}<//></div>
      </section>
      <${ClearanceCard} status=${m.status} title=${medicalTitle(m)} until=${m.until ? fmt(m.until).toUpperCase() : null} issuedBy=${m.by}>
        ${m.status === 'suspended' ? html`<p className="small">${m.reason}. Your coach can't book you for contact sparring until then.</p>` : null}
        ${m.missing || m.status === 'pending' ? html`<p className="small">Book a pre-competition medical before your next registration closes.</p>` : null}
      <//>
      <section className="card">
        <div className="card-head"><div><p className="tr-label">Pathway · level ${a.level + 1} of ${LEVELS.length}</p><h2 className="card-title">${LEVELS[a.level]}</h2></div>
          <button type="button" className="link-btn" onClick=${function () { p.go('pathway'); }}>Open</button></div>
        <${LevelLadder} levels=${LEVELS} current=${a.level} />
        ${focus.length ? html`<div className="focus"><p className="tr-label">Closest to the next check</p>
          ${focus.map(function (x) { return html`<${SkillMeter} key=${x.id} skill=${SKILL_NAMES[x.id]} value=${x.value} status=${x.status === 'pending' ? 'pending' : 'neutral'} />`; })}</div>` : null}
        <p className="small muted">${strong} of ${skills.length} skills verified at 80% or more${pending ? ' · ' + pending + ' awaiting your coach' : ''}.</p>
        ${grading ? html`<${Badge} status="pending">Recommended for ${LEVELS[grading.to]} · awaiting grading panel<//>` : null}
      </section>
      <button type="button" className="card record-strip" onClick=${p.openProfile}>
        <span className="record-strip-rec"><span className="tr-label">Verified record</span><${Record} wins=${rec.wins} losses=${rec.losses} draws=${rec.draws} size="sm" /></span>
        <span className="record-strip-last">${last ? html`<span className="small">Last: <strong>${boutResultLabel(last)}</strong> vs ${last.opponent}</span><span className="small muted">${last.event}</span>`
          : html`<span className="small muted">No bouts yet</span>`}<span className="link-like">Fighter page →</span></span>
      </button>
      <section className="card">
        <h2 className="card-title">On your record</h2>
        ${feed.length ? html`<ul className="feed">${feed.map(function (f) {
          return html`<li key=${f.id}><span className=${'feed-icon feed-' + f.kind}><${Icon} name=${KIND_ICON[f.kind] || 'check'} size=${16} /></span><div><p>${f.text}</p><p className="data muted">${fmt(f.date)}</p></div></li>`;
        })}</ul>` : html`<p className="muted">Nothing yet. Verified skills, results and medicals will appear here.</p>`}
      </section>
    </div>`;
  }

  function PathwayScreen(p) {
    var a = p.a, act = p.act;
    var minor = isMinor(a), waiting = a.joinStatus === 'pending';
    return html`<div className="stack">
      <${ScreenHead} eyebrow=${'Level ' + (a.level + 1) + ' of ' + LEVELS.length} title="Pathway" />
      <${LevelLadder} levels=${LEVELS} current=${a.level} />
      <p className="note"><${Icon} name="lock" size=${16} /> Only ${coachName(a.coach)} can move these meters, after seeing the skill in person. Learn videos prepare you; they never change a meter.</p>
      ${D.AREAS.map(function (area) {
        return html`<section key=${area.id} className="card">
          <h2 className="card-title">${area.name}${area.id === 'safety' && minor ? ' · junior ruleset' : ''}</h2>
          <div className="skills">${area.skills.map(function (pair) {
            var x = a.skills[pair[0]];
            return html`<div key=${pair[0]} className="skill-row">
              <${SkillMeter} skill=${pair[1]} value=${x.value} status=${x.status === 'pending' ? 'pending' : x.value >= 100 ? 'verified' : 'neutral'}
                verifiedBy=${x.by ? coachName(x.by) : null} date=${x.date ? fmt(x.date) : null} />
              ${x.status === 'pending' ? html`<p className="small muted">You asked for a check at ${x.requested}% on ${fmt(x.requestedOn)}.</p>`
                : x.value < 100 ? html`<${Button} size="sm" variant="quiet" icon="clock" disabled=${waiting} onClick=${function () { act({ type: 'request', athlete: a.id, skill: pair[0] }, 'Check requested. ' + coachName(a.coach) + ' will see it on their roster.'); }}>${waiting ? 'Opens when your coach accepts you' : 'Ask coach to check'}<//>` : null}
            </div>`;
          })}</div></section>`;
      })}
    </div>`;
  }

  function boutResultLabel(b) { return b.result === 'win' ? 'W' : b.result === 'loss' ? 'L' : 'D'; }

  function BoutSheet(props) {
    var a = props.a, bout = props.bout;
    return html`<${Sheet} title=${bout.event} onClose=${props.onClose} wide=${true}>
      <p className="small muted">${bout.city} · ${fmt(bout.date)} · ${a.division} ${a.weightClass}</p>
      <${FaceOff} red=${bout.corner === 'red' ? nameOf(a) : bout.opponent} blue=${bout.corner === 'blue' ? nameOf(a) : bout.opponent}
        redNation=${bout.corner === 'red' ? a.nation : bout.oppNation} blueNation=${bout.corner === 'blue' ? a.nation : bout.oppNation} />
      ${bout.judges ? html`<${Scorecard} red=${bout.corner === 'red' ? nameOf(a) : bout.opponent} blue=${bout.corner === 'blue' ? nameOf(a) : bout.opponent}
          judges=${bout.judges} verifiedBy=${'Bout sheet signed · ' + bout.official} hideCorners=${true}
          result=${{ winner: bout.result === 'draw' ? null : (bout.result === 'win') === (bout.corner === 'red') ? 'red' : 'blue', method: bout.method }} />`
        : html`<div className="card"><div className="row-between"><${CornerTag} corner=${bout.corner}>${nameOf(a)}<//><span className=${'res res-' + bout.result}>${boutResultLabel(bout)}</span></div>
          <p className="headline tr-display">${bout.method}</p><p className="muted">Round ${bout.round} · ${bout.time}</p>
          <${Badge} status="verified">Bout sheet signed · ${bout.official}<//></div>`}
    <//>`;
  }

  function ShareSheet(props) {
    var a = props.a, rec = props.rec, photo = photoOf(a);
    return html`<${Sheet} title="Share card" onClose=${props.onClose}>
      <div className="share-card theme-dark">
        <div className="share-top"><${Mark} size=${28} /><span className="wordmark">TrueRound</span>${photo ? html`<img className="share-photo" src=${photo} alt="" width="64" height="64" />` : null}</div>
        <p className="tr-label share-kicker">Verified record</p>
        <p className="share-name tr-display" style=${nameChars(a)}>${a.first}<br/>${a.last}</p>
        <p className="share-sub">${a.gym} · ${LEVELS[a.level]} · ${a.weightClass}</p>
        <div className="share-rec"><${Record} wins=${rec.wins} losses=${rec.losses} draws=${rec.draws} /></div>
        <p className="data share-url">trueround.app/${(a.first + '-' + a.last).toLowerCase()}</p>
      </div>
      <p className="small muted">In the app this saves as an image sized for Instagram and links to the public page.</p>
    <//>`;
  }

  /* ---------- fighter page: the full profile, for the athlete and their coach ---------- */
  function finishOf(b) { return b.result === 'win' && !/decision/i.test(b.method); }
  function roundsOf(b) { return b.judges ? b.judges[0].length : b.round; }
  function secsOf(t) { var x = String(t).split(':'); return Number(x[0]) * 60 + Number(x[1]); }
  function methodShort(b) {
    if (/draw/i.test(b.method)) return 'Draw';
    var dec = /^(\w+) decision/i.exec(b.method);
    if (dec) return dec[1] + ' dec.';
    return (/submission/i.test(b.method) ? 'Submission' : 'Stoppage') + ' · R' + b.round;
  }
  // Fighter facts from the bout list (newest first).
  function factsOf(list) {
    var wins = list.filter(function (b) { return b.result === 'win'; });
    var fin = wins.filter(finishOf);
    var run = 0, best = 0, cur = 0;
    list.slice().reverse().forEach(function (b) { run = b.result === 'win' ? run + 1 : 0; best = Math.max(best, run); });
    while (cur < list.length && list[cur].result === list[0].result) cur++;
    return {
      wins: wins, finishes: fin, best: best, current: list.length ? boutResultLabel(list[0]) + cur : 'None yet',
      fastest: fin.slice().sort(function (x, y) { return x.round - y.round || secsOf(x.time) - secsOf(y.time); })[0],
      rounds: list.reduce(function (t, b) { return t + roundsOf(b); }, 0), debut: list[list.length - 1]
    };
  }
  function fedName(code) { var f = D.federations.filter(function (x) { return x[0] === code; })[0]; return f ? f[1] : code; }

  function Gauge(props) {
    var C = 2 * Math.PI * 26;
    return html`<figure className=${'gauge' + (props.lead ? ' lead' : '')}>
      <div className="ring-box"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" className="ring-track"/>
        <circle cx="32" cy="32" r="26" className="ring-val" style=${{ strokeDasharray: (C * props.pct / 100).toFixed(1) + ' ' + C.toFixed(1) }} transform="rotate(-90 32 32)"/></svg>
        <span className="ring-num"><span>${props.pct}<small>%</small></span></span></div>
      <figcaption><span className="ring-name">${props.label}</span><span className="data muted">${props.sub}</span></figcaption></figure>`;
  }

  // rows: [label, value, display]; bars are scaled to `max`, or to the largest value.
  function Bars(props) {
    var max = props.max || Math.max.apply(null, props.rows.map(function (r) { return r[1]; }).concat([1]));
    return html`<ul className="bars">${props.rows.map(function (r) {
      return html`<li key=${r[0]}><span className="bar-label">${r[0]}</span><span className="bar-track"><span className="bar-fill" style=${{ width: Math.round(r[1] / max * 100) + '%' }}></span></span><span className="data bar-val">${r[2]}</span></li>`;
    })}</ul>`;
  }

  function KV(props) {
    return html`<dl className="kv">${props.rows.map(function (r) { return html`<div key=${r[0]}><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`; })}</dl>`;
  }

  function FighterPage(p) {
    var s = p.s, a = p.a, self = p.viewer === 'self';
    var os = useState(null), open = os[0], setOpen = os[1];
    var ts = useState('bio'), tab = ts[0], setTab = ts[1];
    var ss = useState(false), sharing = ss[0], setSharing = ss[1];
    var list = boutsOf(s, a.id), rec = recordOf(s, a.id), f = factsOf(list), m = medical(a), minor = isMinor(a);
    var bout = open ? list.filter(function (b) { return b.id === open; })[0] : null;
    var last = list[0], coach = D.coaches[a.coach] || { name: 'Unassigned' };
    var winRate = list.length ? Math.round(rec.wins / list.length * 100) : 0;
    var finishRate = f.wins.length ? Math.round(f.finishes.length / f.wins.length * 100) : 0;
    var methods = WIN_METHODS.map(function (mm) { var n = f.wins.filter(function (b) { return mm[1].test(b.method); }).length; return [mm[0], n, n + (n === 1 ? ' win' : ' wins')]; });
    var areas = D.AREAS.map(function (ar) {
      var v = Math.round(ar.skills.reduce(function (t, sk) { return t + a.skills[sk[0]].value; }, 0) / ar.skills.length);
      return [ar.name, v, v + '%'];
    });
    var status = a.joinStatus === 'pending' ? 'Join request pending' : m.status === 'suspended' ? 'Suspended' : 'Active';
    var upcoming = s.registrations.filter(function (r) { return r.athlete === a.id; })
      .map(function (r) { return s.events.filter(function (e) { return e.id === r.event; })[0]; }).filter(function (e) { return e && e.date >= TODAY; });
    var canShare = !minor && a.privacy.shareCards;
    var details;
    if (tab === 'facts') details = html`<${KV} rows=${[
      ['Bouts', String(list.length)], ['Rounds fought', String(f.rounds)], ['Finishes', String(f.finishes.length)],
      ['Fastest finish', f.fastest ? 'R' + f.fastest.round + ' ' + f.fastest.time + ' vs ' + f.fastest.opponent : 'None yet'],
      ['Current streak', f.current], ['Longest win streak', String(f.best)],
      ['Debut', f.debut ? f.debut.event + ' · ' + fmt(f.debut.date) : 'Not yet']]} />`;
    else if (tab === 'fed') details = html`<div className="stack">
      <${KV} rows=${[['Federation', fedName(a.nation)], ['Licence', a.licence || 'Issued after the first grading'], ['Current level', LEVELS[a.level]]]} />
      <div><p className="tr-label">Level history</p>
        <ol className="timeline">${(a.history || []).map(function (d, i) { return { level: LEVELS[i], date: d }; }).filter(function (x) { return x.date; }).reverse().map(function (x) {
          return html`<li key=${x.level}><span className="tl-dot"></span><span>${x.level}</span><span className="data muted">${fmt(x.date)}</span></li>`;
        })}</ol></div>
      ${upcoming.length ? html`<div><p className="tr-label">Registered for</p><${KV} rows=${upcoming.map(function (e) { return [e.name, fmt(e.date)]; })} /></div>` : null}
    </div>`;
    else details = html`<${KV} rows=${[
      ['Status', status], ['Division', a.division], ['Weight class', a.weightClass], ['Stance', a.stance || 'Not set'], ['Nation', fedName(a.nation)],
      ['Hometown', minor ? 'Private' : a.hometown || 'Not shared'], ['Trains at', a.gym], ['Coach', coach.name], ['On TrueRound since', fmt(a.since || TODAY)]]} />`;
    return html`<article className="fp">
      <header className="fp-hero theme-dark dark-top">
        <${Ring} className="fp-ring" />
        <div className="fp-bar"><span className="tr-label">${self ? 'Your fighter page' : 'Fighter page'}</span>
          <div className="fp-actions">
            ${canShare ? html`<button type="button" className="icon-btn" onClick=${function () { setSharing(true); }} aria-label="Share fighter page"><${Icon} name="share" size=${18} /></button>` : null}
            ${self ? html`<button type="button" className="icon-btn" onClick=${p.onSettings} aria-label="Settings"><${Icon} name="settings" size=${18} /></button>` : null}
          </div></div>
        <div className="fp-tags">${[a.division + ' · ' + a.weightClass, status, 'Coach-verified pathway'].map(function (t, i) {
          return html`<span key=${t} className=${'pill' + (i === 1 && status !== 'Active' ? ' pill-warn' : '')}>${t}</span>`;
        })}</div>
        <div className="fp-id">
          <span className="fp-photo"><${Face} a=${a} size=${88} /></span>
          <div className="fp-names">${a.nickname && !minor ? html`<p className="fp-nick">“${a.nickname}”</p>` : null}
            <h1 className="fp-name tr-display" style=${nameChars(a)}>${a.first}<br/>${minor ? a.last.charAt(0) + '.' : a.last}</h1>
            <p className="fp-sub">${a.gym} · ${a.nation}</p></div>
        </div>
        <div className="fp-stats">
          <div className="fp-stat"><span className="fp-stat-num">${rec.wins}-${rec.losses}-${rec.draws}</span><span className="fp-stat-label">Record</span></div>
          <div className="fp-stat"><span className="fp-stat-num">${f.finishes.length}</span><span className="fp-stat-label">Finishes</span></div>
          <div className="fp-stat"><span className="fp-stat-num">${a.level + 1}<small>/${LEVELS.length}</small></span><span className="fp-stat-label">${LEVELS[a.level]}</span></div>
        </div>
        <div className="fp-meta">
          <div className="fp-coach"><span className="mini-avatar" aria-hidden="true">${coach.name.split(' ').map(function (w) { return w.charAt(0); }).join('').slice(0, 2)}</span>
            <span><span className="fp-meta-k">Coach</span><span className="fp-meta-v">${coach.name}</span></span></div>
          ${last ? html`<button type="button" className="fp-last" onClick=${function () { setOpen(last.id); }}>
            <span className="fp-meta-k">Last bout</span><span className="fp-meta-v">${boutResultLabel(last)} vs ${last.opponent}</span><span className="fp-last-link">Scorecard →</span></button>`
            : html`<div className="fp-last"><span className="fp-meta-k">Last bout</span><span className="fp-meta-v">No bouts yet</span></div>`}
        </div>
      </header>
      <div className="fp-body">
        ${minor ? html`<p className="note"><${Icon} name="lock" size=${16} /> Private profile. Only ${self ? 'you, your guardian' : 'the athlete, their guardian'} and the coach see this page. No public page or photo until 18.</p>` : null}
        <section className="card"><div className="card-head"><h2 className="card-title">Performance</h2><span className="data muted">from signed bout sheets</span></div>
          ${list.length ? html`<div className="gauges">
            <${Gauge} label="Win rate" pct=${winRate} sub=${rec.wins + ' of ' + list.length + ' bouts'} lead=${true} />
            <${Gauge} label="Finish rate" pct=${finishRate} sub=${f.finishes.length + ' of ' + f.wins.length + ' wins'} /></div>`
            : html`<p className="small muted">No bouts yet. These fill in after the first signed bout sheet.</p>`}
        </section>
        ${f.wins.length ? html`<section className="card"><h2 className="card-title">Result by method</h2><${Bars} rows=${methods} /></section>` : null}
        <section className="card"><div className="card-head"><h2 className="card-title">Skills by area</h2><span className="data muted">coach-verified</span></div>
          <${Bars} rows=${areas} max=${100} />
          ${self ? html`<button type="button" className="link-btn" onClick=${p.goPathway}>Open pathway →</button>` : null}</section>
        <section className="card"><div className="card-head"><h2 className="card-title">Fight record</h2><span className="data muted">${list.length} ${list.length === 1 ? 'bout' : 'bouts'}</span></div>
          ${list.length ? html`<ul className="fights">${list.map(function (b) {
            return html`<li key=${b.id}><button type="button" className="fight-row" onClick=${function () { setOpen(b.id); }}>
              <span className=${'res res-' + b.result}>${boutResultLabel(b)}</span>
              <span className="bout-main"><span className="bout-opp">vs ${b.opponent} <span className="muted">${b.oppNation}</span></span><span className="small muted">${b.event} · ${fmt(b.date)}</span></span>
              <span className=${'method-pill pill-' + b.result}>${methodShort(b)}</span></button></li>`;
          })}</ul>` : html`<p className="small muted">No bouts yet. The first result appears here after the first event.</p>`}
          <p className="small muted">Every result was written by the event's officials from a signed bout sheet. Tap one for the scorecard.</p>
        </section>
        <section className="card fp-details">
          <${Seg} label="Fighter details" value=${tab} onChange=${setTab} options=${[['bio', 'Bio'], ['facts', 'Fighter facts'], ['fed', 'Federation']]} />
          ${details}
        </section>
        ${canShare ? html`<div className="fp-share"><${Button} variant="primary" block=${true} icon="share" onClick=${function () { setSharing(true); }}>Share fighter page<//>
          <p className="small muted">Public by choice. Under-18s stay private.</p></div>` : null}
      </div>
      ${bout ? html`<${BoutSheet} a=${a} bout=${bout} onClose=${function () { setOpen(null); }} />` : null}
      ${sharing ? html`<${ShareSheet} a=${a} rec=${rec} onClose=${function () { setSharing(false); }} />` : null}
    </article>`;
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

  /* ---------- settings: account, notifications, privacy, data ---------- */
  function SettingsScreen(p) {
    var s = p.s, a = p.a, act = p.act;
    var minor = isMinor(a), notify = Object.assign({ push: true, events: true }, a.notify);
    var vs = useState(null), view = vs[0], setView = vs[1];
    var exportData = view === 'export' ? JSON.stringify({
      athlete: Object.assign({}, a, { photo: a.photo && a.photo.indexOf('data:') === 0 ? '(uploaded photo)' : a.photo }),
      bouts: boutsOf(s, a.id), registrations: s.registrations.filter(function (r) { return r.athlete === a.id; }), feed: s.feed.filter(function (f) { return f.athlete === a.id; })
    }, null, 2) : '';
    function copy() {
      try { navigator.clipboard.writeText(exportData).then(function () { act({ type: 'noop' }, 'Copied to clipboard.'); }, function () { act({ type: 'noop' }, 'Select the text and copy it.'); }); }
      catch (e) { act({ type: 'noop' }, 'Select the text and copy it.'); }
    }
    return html`<div className="stack">
      <div className="row-between"><button type="button" className="link-btn" onClick=${p.back}>← Fighter page</button><span className="tr-label">Settings</span></div>
      <section className="card account-card">
        <span className="mini-avatar account-face" aria-hidden="true"><${Face} a=${a} size=${56} /></span>
        <div className="who-text"><span className="cell-name">${nameOf(a)}</span><span className="small muted">${a.email}</span>
          <span className="small muted">${a.gym} · since ${fmt(a.since || TODAY)}</span></div>
        <${LevelPill} level=${a.level} />
      </section>
      ${minor && a.guardian ? html`<section className="card"><h2 className="card-title">Guardian</h2><p>Managed by <strong>${a.guardian.name}</strong> (${a.guardian.email}). Consent recorded ${fmt(a.guardian.consentOn)}.</p><p className="small muted">Your guardian can view, export or delete this account at any time.</p></section>` : null}
      <section className="card"><h2 className="card-title">Notifications</h2>
        <${Toggle} id="nt-push" label="Push notifications" hint="Verified skills, results and medical changes." checked=${notify.push} onChange=${function (v) { act({ type: 'notify', athlete: a.id, key: 'push', value: v }); }} />
        <${Toggle} id="nt-events" label="Event reminders" hint="Registration deadlines, medicals and weigh-ins." checked=${notify.events} onChange=${function (v) { act({ type: 'notify', athlete: a.id, key: 'events', value: v }); }} />
      </section>
      <section className="card"><h2 className="card-title">Privacy and sharing</h2>
        <${Toggle} id="pv-public" label="Public fighter page" hint=${minor ? 'Guardian-controlled while under 18. Off, and hidden from search engines.' : 'Your verified record on a page search engines can find.'}
          checked=${!minor && a.privacy.publicPage} disabled=${minor} onChange=${function (v) { act({ type: 'privacy', athlete: a.id, key: 'publicPage', value: v }, v ? 'Public page on.' : 'Public page off.'); }} />
        <${Toggle} id="pv-share" label="Share cards" hint="Auto-made cards when a promotion or result is verified." checked=${!minor && a.privacy.shareCards} disabled=${minor}
          onChange=${function (v) { act({ type: 'privacy', athlete: a.id, key: 'shareCards', value: v }); }} />
        <${Toggle} id="pv-mkt" label="News and offers" hint="Off unless you turn it on." checked=${a.privacy.marketing} onChange=${function (v) { act({ type: 'privacy', athlete: a.id, key: 'marketing', value: v }); }} />
      </section>
      <section className="card"><h2 className="card-title">Your data</h2>
        <p className="small muted">TrueRound keeps your name, date of birth, gym, coach, verified skills and results, and the status and dates of your medicals. It never stores a diagnosis.</p>
        <div className="btn-row"><${Button} size="sm" onClick=${function () { setView('export'); }}>Download my data<//><${Button} size="sm" variant="danger" onClick=${function () { setView('delete'); }}>Delete account<//></div>
      </section>
      <section className="card"><h2 className="card-title">New to TrueRound?</h2><p className="small muted">Walk through the onboarding a new athlete sees, including the under-18 guardian step.</p>
        <${Button} size="sm" onClick=${p.startOnboarding}>Start onboarding<//></section>
      <p className="small muted about">TrueRound is a concept prototype prepared for a partnership proposal. It is not an official product of GAMMA or of any federation. Every athlete, coach, gym, official and event in it is fictional, except Mohammad Mortada, added on request; that profile's record is demo data too.</p>
      ${view === 'export' ? html`<${Sheet} title="Your data" onClose=${function () { setView(null); }} wide=${true}>
        <p className="small muted">Everything TrueRound holds about this account, as JSON.</p>
        <pre className="export" tabIndex="0">${exportData}</pre>
        <div className="btn-row"><${Button} size="sm" onClick=${copy}>Copy<//></div><//>` : null}
      ${view === 'delete' ? html`<${Confirm} title=${'Delete ' + nameOf(a) + "'s account?"} confirmLabel="Delete account" danger=${true}
        onCancel=${function () { setView(null); }} onConfirm=${function () { act({ type: 'delete', id: a.id }, 'Account and its data deleted.'); }}>
        This removes the profile, verified skills, results, registrations and the public page. In the real app it also asks search engines to drop the page. It can't be undone.<//>` : null}
    </div>`;
  }

  /* ---------- onboarding: the full join journey ---------- */
  var WEIGHTS = ['48 kg', '52 kg', '57 kg', '61 kg', '66 kg', '70 kg', '77 kg', '84 kg', '93 kg', '120 kg'];
  var ONB = {
    account: ['Account', 'Create your account', 'Your verified pathway, record and medical status in one place. We email you a sign-in link, so there is no password to remember.'],
    age: ['Age', 'Your date of birth', 'We ask so we can apply the right protections for your age.'],
    guardian: ['Guardian', 'Parent or guardian', 'Under-18 accounts are created through a parent or guardian, who can view, export or delete the data at any time.'],
    club: ['Club', 'Federation and gym', 'Your coach at this gym is the only person who can verify your skills.'],
    fighter: ['Fighter', 'Fighter details', 'This sets your division and the events you can enter. You can change weight class later.'],
    photo: ['Photo', 'Add a photo', 'It appears on your fighter page and share cards. You can change or remove it at any time.'],
    safety: ['Safety', 'Safety comes first', 'Medical clearance and suspensions are written by doctors and officials, never by you or your coach.'],
    sharing: ['Sharing', 'Choose what to share', 'Pathway tracking is required. Everything else is your choice and can change later.'],
    coach: ['Coach', 'Join your coach’s roster', 'Your coach accepts you before anything is verified.']
  };

  // Crop an uploaded image to a 288px square (biased up a little, where faces usually are) as a JPEG data URL.
  function squarePhoto(file, done) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var side = Math.min(img.width, img.height), c = document.createElement('canvas');
        c.width = c.height = 288;
        c.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) * 0.3, side, side, 0, 0, 288, 288);
        done(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function () { done(null); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function Onboarding(p) {
    var act = p.act;
    var ss = useState('welcome'), step = ss[0], setStep = ss[1];
    var fs = useState({ first: '', last: '', email: '', dob: '', gName: '', gEmail: '', gConsent: false, federation: 'LBN', gym: 'cedar', sex: '', weight: '', stance: 'Orthodox',
      nickname: '', hometown: '', photo: null, medReminder: true, rulesAck: false, publicPage: false, shareCards: false, marketing: false });
    var f = fs[0], setF = fs[1];
    var cs = useState(null), created = cs[0], setCreated = cs[1];
    function set(k, v) { setF(function (cur) { var o = Object.assign({}, cur); o[k] = v; return o; }); }
    function bind(k) { return function (e) { set(k, e.target.type === 'checkbox' ? e.target.checked : e.target.value); }; }
    var years = f.dob ? age(f.dob) : null;
    var minor = years !== null && years < 18, tooYoung = years !== null && years < 8;
    var flow = ['account', 'age'].concat(minor ? ['guardian'] : [], ['club', 'fighter'], minor ? [] : ['photo'], ['safety', 'sharing', 'coach']);
    var idx = flow.indexOf(step);
    var gym = D.gyms.filter(function (g) { return g.id === f.gym; })[0];
    var EMAIL = /.+@.+\..+/;
    var valid = {
      account: f.first.trim() && f.last.trim() && EMAIL.test(f.email), age: years !== null && !tooYoung && years < 100,
      guardian: f.gName.trim() && EMAIL.test(f.gEmail) && f.gConsent, club: !!gym, fighter: f.sex && f.weight,
      photo: true, safety: f.rulesAck, sharing: true, coach: true
    }[step];
    function go(to) { setStep(to); var el = document.querySelector('.phone-onb'); if (el) el.scrollTop = 0; window.scrollTo(0, 0); }
    function back() { go(idx <= 0 ? 'welcome' : flow[idx - 1]); }
    function finish() {
      var sk = {};
      Object.keys(SKILL_NAMES).forEach(function (k) { sk[k] = { value: 0, status: 'none', by: null, date: null }; });
      var athlete = {
        id: (f.first + '-' + f.last).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + uid().slice(0, 3),
        first: f.first.trim(), last: f.last.trim(), dob: f.dob, nation: f.federation, gym: gym.name, coach: gym.coach, weightClass: f.weight,
        division: (minor ? 'Junior ' : 'Senior ') + f.sex, level: 0, email: minor ? f.gEmail : f.email,
        nickname: minor ? '' : f.nickname.trim(), hometown: f.hometown.trim(), stance: f.stance, photo: minor ? null : f.photo,
        since: TODAY, history: [TODAY], joinStatus: 'pending', notify: { push: true, events: f.medReminder },
        guardian: minor ? { name: f.gName.trim(), email: f.gEmail, consentOn: TODAY } : undefined, clearance: null, suspension: null,
        privacy: { publicPage: !minor && f.publicPage, shareCards: !minor && f.shareCards, marketing: f.marketing }, skills: sk, unlocked: [0], watched: []
      };
      act({ type: 'create', athlete: athlete });
      setCreated(athlete); go('done');
    }

    if (step === 'welcome') return html`<div className="onb onb-hero-screen theme-dark dark-top">
      <${Ring} className="onb-ring" />
      <div className="onb-brand"><${Mark} size=${34} /><span className="wordmark">TrueRound</span></div>
      <h1 className="onb-hero tr-display">Your fight record.<br/>Verified.</h1>
      <ul className="onb-points">
        <li><span className="onb-ico"><${Icon} name="ladder" size=${20} /></span><span><strong>A pathway your coach signs off</strong><span>Skills move only after your coach has seen them in person.</span></span></li>
        <li><span className="onb-ico"><${Icon} name="card" size=${20} /></span><span><strong>Results from the officials</strong><span>Every bout comes from a signed bout sheet, with the judges’ scores.</span></span></li>
        <li><span className="onb-ico"><${Icon} name="shield" size=${20} /></span><span><strong>Clearance you can show</strong><span>Medical status and dates, ready at weigh-in. Never a diagnosis.</span></span></li>
      </ul>
      <div className="onb-cta"><${Button} variant="primary" block=${true} onClick=${function () { go('account'); }}>Create your account<//>
        <button type="button" className="link-btn" onClick=${function () { p.close(); }}>Skip to the demo</button></div>
      <p className="onb-fine">Concept prototype for GAMMA. Nothing you type leaves this browser.</p>
    </div>`;

    if (step === 'done') return html`<div className="onb onb-hero-screen theme-dark dark-top">
      <${Ring} className="onb-ring" />
      <span className="fp-photo onb-done-face"><${Face} a=${created} size=${88} /></span>
      <p className="tr-label onb-gold">Account created</p>
      <h1 className="onb-hero tr-display">You’re in,<br/>${created.first}.</h1>
      <p className="muted">Your join request is with Coach ${coachName(created.coach)} at ${created.gym}.</p>
      <ol className="next-steps">
        <li className="now"><span className="ns-dot"><${Icon} name="clock" size=${14} strokeWidth=${2.5} /></span><span><strong>Coach accepts you</strong><span>Usually after your next session.</span></span></li>
        <li><span className="ns-dot">2</span><span><strong>Ask for your first skill check</strong><span>From Pathway, after a session.</span></span></li>
        <li><span className="ns-dot">3</span><span><strong>Book a pre-competition medical</strong><span>Every event needs one on file.</span></span></li>
        <li><span className="ns-dot">4</span><span><strong>Pick your first event</strong><span>The app checks your eligibility for you.</span></span></li>
      </ol>
      <div className="onb-cta"><${Button} variant="primary" block=${true} onClick=${function () { p.close('home'); }}>Go to my home<//></div>
      <p className="onb-fine">Demo tip: switch to Coach to accept the join request.</p>
    </div>`;

    var body;
    if (step === 'account') body = html`<div className="form">
      <${Field} id="onb-first" label="First name" value=${f.first} onChange=${bind('first')} autoComplete="given-name" />
      <${Field} id="onb-last" label="Last name" value=${f.last} onChange=${bind('last')} autoComplete="family-name" />
      <${Field} id="onb-email" label="Email" type="email" value=${f.email} onChange=${bind('email')} autoComplete="email" hint="We send your sign-in link here." /></div>`;
    else if (step === 'age') body = html`<div className="form">
      <${Field} id="onb-dob" label="Date of birth" type="date" value=${f.dob} onChange=${bind('dob')} max=${TODAY} error=${tooYoung ? 'Athletes must be at least 8 to join.' : null} />
      ${years !== null && !tooYoung ? html`<p className="note">${minor ? html`<${Icon} name="shield" size=${16} /> You’re ${years}. A parent or guardian creates and manages your account, and your profile stays private with no photo.` : html`<${Icon} name="check" size=${16} /> You’re ${years}. You manage your own account.`}</p>` : null}</div>`;
    else if (step === 'guardian') body = html`<div className="form">
      <${Field} id="onb-gname" label="Guardian’s full name" value=${f.gName} onChange=${bind('gName')} />
      <${Field} id="onb-gemail" label="Guardian’s email" type="email" value=${f.gEmail} onChange=${bind('gEmail')} hint="We send the consent request here." />
      <label className="check-line" htmlFor="onb-gconsent"><input id="onb-gconsent" type="checkbox" checked=${f.gConsent} onChange=${bind('gConsent')} /> <span>I am the parent or guardian and I consent to this account being created.</span></label></div>`;
    else if (step === 'club') body = html`<div className="form">
      <div className="tr-field"><label htmlFor="onb-fed">National federation</label><select id="onb-fed" value=${f.federation} onChange=${bind('federation')}>${D.federations.map(function (x) { return html`<option key=${x[0]} value=${x[0]}>${x[1]}</option>`; })}</select></div>
      <fieldset className="choice-list"><legend className="field-label">Gym</legend>
        ${D.gyms.map(function (g) { return html`<label key=${g.id} className=${'choice' + (f.gym === g.id ? ' on' : '')}>
          <input type="radio" name="onb-gym" value=${g.id} checked=${f.gym === g.id} onChange=${bind('gym')} />
          <span className="choice-main"><strong>${g.name}</strong><span className="small muted">${g.city} · Coach ${coachName(g.coach)} · ${g.athletes} athletes</span></span>
          <${Icon} name="check" size=${18} strokeWidth=${3} /></label>`; })}
      </fieldset>
      <p className="small muted">Gym not listed? Gyms join through the national federation; ask your coach to apply.</p></div>`;
    else if (step === 'fighter') body = html`<div className="form">
      <div className="field-group"><p className="field-label">Division</p><${Seg} label="Division" value=${f.sex} onChange=${function (v) { set('sex', v); }}
        options=${[['women', minor ? 'Junior women' : 'Women'], ['men', minor ? 'Junior men' : 'Men']]} /></div>
      <div className="tr-field"><label htmlFor="onb-wt">Weight class</label><select id="onb-wt" value=${f.weight} onChange=${bind('weight')}>
        <option value="">Choose your weight class</option>${WEIGHTS.map(function (x) { return html`<option key=${x}>${x}</option>`; })}</select></div>
      <div className="field-group"><p className="field-label">Stance</p><${Seg} label="Stance" value=${f.stance} onChange=${function (v) { set('stance', v); }}
        options=${[['Orthodox', 'Orthodox'], ['Southpaw', 'Southpaw'], ['Switch', 'Switch']]} /></div>
      ${minor ? null : html`<${Field} id="onb-nick" label="Nickname (optional)" value=${f.nickname} onChange=${bind('nickname')} hint="Shown in quotes on your fighter page." />`}
      <${Field} id="onb-home" label="Hometown (optional)" value=${f.hometown} onChange=${bind('hometown')} /></div>`;
    else if (step === 'photo') body = html`<div className="photo-pick">
      <span className=${'photo-preview' + (f.photo ? ' has-photo' : '')}>${f.photo ? html`<img src=${f.photo} alt="Your photo" />` : html`<${Icon} name="camera" size=${36} />`}</span>
      <label className="tr-btn tr-btn-secondary photo-btn" htmlFor="onb-photo"><${Icon} name="camera" size=${18} />${f.photo ? 'Choose another' : 'Choose a photo'}</label>
      <input id="onb-photo" className="sr" type="file" accept="image/*" onChange=${function (e) { var file = e.target.files && e.target.files[0]; if (file) squarePhoto(file, function (url) { if (url) set('photo', url); }); }} />
      <p className="small muted">A clear, front-facing head-and-shoulders photo works best. It’s cropped to a circle.</p></div>`;
    else if (step === 'safety') body = html`<div className="form">
      <ul className="safety-list">
        <li><span className="onb-ico"><${Icon} name="shield" size=${20} /></span><span><strong>Medical clearance</strong><span>An event doctor records it before you compete. It shows a status and dates only, never a diagnosis.</span></span></li>
        <li><span className="onb-ico"><${Icon} name="ban" size=${20} /></span><span><strong>Suspensions</strong><span>After a stoppage the doctor can set a rest period. Your coach’s sparring plan blocks contact until it ends.</span></span></li>
        <li><span className="onb-ico"><${Icon} name="whistle" size=${20} /></span><span><strong>${minor ? 'Junior ruleset' : 'Rules of your division'}</strong><span>${minor ? 'Junior divisions use a restricted ruleset set by your federation. Your Safety and rules skills cover it.' : 'Legal targets, tapping and the weigh-in protocol are part of your pathway under Safety and rules.'}</span></span></li>
      </ul>
      <${Toggle} id="onb-med" label="Remind me to book a medical" hint="Before your first registration closes." checked=${f.medReminder} onChange=${function (v) { set('medReminder', v); }} />
      <label className="check-line" htmlFor="onb-rules"><input id="onb-rules" type="checkbox" checked=${f.rulesAck} onChange=${bind('rulesAck')} /> <span>I understand that only doctors and officials can clear or suspend me.</span></label></div>`;
    else if (step === 'sharing') body = html`<div className="form">
      <${Toggle} id="onb-core" label="Pathway tracking" hint="Required: your coach verifies your skills here." checked=${true} disabled=${true} />
      <${Toggle} id="onb-public" label="Public fighter page" hint=${minor ? 'Off for under-18s. Your guardian can choose later.' : 'Lets clubs and scouts find your verified record.'} checked=${!minor && f.publicPage} disabled=${minor} onChange=${function (v) { set('publicPage', v); }} />
      <${Toggle} id="onb-share" label="Share cards" hint=${minor ? 'Off for under-18s.' : 'Auto-made cards for promotions and results.'} checked=${!minor && f.shareCards} disabled=${minor} onChange=${function (v) { set('shareCards', v); }} />
      <${Toggle} id="onb-mkt" label="News and offers" hint="Off unless you turn it on." checked=${f.marketing} onChange=${function (v) { set('marketing', v); }} /></div>`;
    else if (step === 'coach') body = html`<div className="form">
      <${AthleteCard} name=${f.first.trim() + ' ' + (minor ? f.last.trim().charAt(0) + '.' : f.last.trim())} photo=${minor ? null : f.photo} gym=${gym.name} coach=${coachName(gym.coach)}
        level=${LEVELS[0]} weightClass=${minor ? null : f.weight} nation=${minor ? null : f.federation} />
      <div className="join-lists">
        <div><p className="tr-label">Your coach sees</p><ul className="plain"><li>Your pathway and checks</li><li>Medical status and dates</li><li>Your results and level</li></ul></div>
        <div><p className="tr-label">Your coach doesn’t see</p><ul className="plain"><li>Your email${minor ? ' or your guardian’s' : ''}</li><li>Your date of birth</li><li>Anything you keep private</li></ul></div>
      </div></div>`;

    var meta = ONB[step];
    return html`<div className="onb">
      <div className="onb-top">
        <button type="button" className="link-btn onb-back" onClick=${back}><${Icon} name="back" size=${16} />Back</button>
        <ol className="onb-progress" aria-label=${'Step ' + (idx + 1) + ' of ' + flow.length}>${flow.map(function (k, i) { return html`<li key=${k} className=${i < idx ? 'done' : i === idx ? 'on' : ''}></li>`; })}</ol>
        <button type="button" className="icon-btn" onClick=${function () { p.close(); }} aria-label="Leave sign-up">✕</button>
      </div>
      <div className="onb-head" key=${step}><p className="tr-label">Step ${idx + 1} of ${flow.length} · ${meta[0]}</p>
        <h1 className="onb-title tr-display">${meta[1]}</h1><p className="muted onb-lede">${meta[2]}</p></div>
      <div className="onb-body" key=${step + '-body'}>${body}</div>
      <div className="onb-foot">
        <${Button} variant="primary" block=${true} disabled=${!valid} onClick=${step === 'coach' ? finish : function () { go(flow[idx + 1]); }}>${step === 'coach' ? 'Send join request' : step === 'photo' && !f.photo ? 'Skip for now' : 'Continue'}<//>
      </div>
    </div>`;
  }

  /* ---------- coach portal ---------- */
  function CoachPortal(props) {
    var s = props.s, act = props.act;
    var coach = D.coaches.hassan;
    var roster = Object.keys(s.athletes).map(function (k) { return s.athletes[k]; }).filter(function (a) { return a.coach === 'hassan'; });
    var requests = [];
    roster.forEach(function (a) { Object.keys(a.skills).forEach(function (k) { if (a.skills[k].status === 'pending') requests.push({ athlete: a, skill: k, x: a.skills[k] }); }); });
    var tab = props.tab, setTab = props.setTab;
    var vs = useState(null), viewing = vs[0], setViewing = vs[1];
    var joins = roster.filter(function (a) { return a.joinStatus === 'pending'; });
    var suspended = roster.filter(function (a) { return medical(a).status === 'suspended'; }).length;
    var due = roster.filter(function (a) { var m = medical(a); return m.status === 'pending'; }).length;
    var tiles = [
      { label: 'Athletes', n: roster.length, go: 'roster' },
      { label: 'Checks waiting', n: requests.length, go: 'verify', tone: requests.length ? 'caution' : '' },
      { label: 'Suspended', n: suspended, go: 'sparring', tone: suspended ? 'stop' : '' },
      { label: 'Medical due', n: due, go: 'roster', tone: due ? 'caution' : '' }
    ];
    var body;
    if (tab === 'roster') body = html`<${CoachRoster} s=${s} roster=${roster} act=${act} open=${setViewing} />`;
    else if (tab === 'verify') body = html`<${CoachVerify} requests=${requests} act=${act} />`;
    else if (tab === 'sparring') body = html`<${CoachSparring} s=${s} roster=${roster} act=${act} />`;
    else body = html`<${Gradings} s=${s} mode="coach" act=${act} />`;
    return html`<div className="portal">
      <header className="portal-head"><div><p className="tr-label">Coach portal · synced with the app</p><h1 className="scr-title tr-display">${coach.name}</h1>
        <p className="muted">${coach.gym} · ${coach.licence}</p></div>
        <p className="small muted portal-scope"><${Icon} name="lock" size=${16} /> You see only athletes assigned to you.</p></header>
      ${joins.length ? html`<section className="card join-requests">
        <div className="card-head"><h2 className="card-title">Join requests</h2><${Badge} status="pending">${joins.length} new<//></div>
        <ul className="join-list">${joins.map(function (a) {
          return html`<li key=${a.id}><div className="who"><span className="mini-avatar" aria-hidden="true"><${Face} a=${a} size=${36} /></span>
            <div className="who-text"><span className="cell-name">${nameOf(a)}</span><span className="small muted">${a.division} · ${a.weightClass} · ${a.gym}${isMinor(a) ? ' · guardian consent recorded' : ''}</span></div></div>
            <div className="btn-row"><${Button} size="sm" variant="quiet" onClick=${function () { setViewing(a.id); }}>View profile<//>
              <${Button} size="sm" variant="primary" icon="check" onClick=${function () { act({ type: 'accept', athlete: a.id }, nameOf(a) + ' is on your roster.', 'verified'); }}>Accept<//></div></li>`;
        })}</ul></section>` : null}
      <div className="tiles">${tiles.map(function (t) {
        return html`<button key=${t.label} type="button" className=${'tile' + (t.tone ? ' tile-' + t.tone : '')} onClick=${function () { setTab(t.go); }}>
          <span className="tile-num"><${Num} n=${t.n} /></span><span className="tr-label">${t.label}</span></button>`;
      })}</div>
      <${Seg} label="Coach sections" value=${tab} onChange=${setTab} options=${[['roster', 'Roster'], ['verify', 'Verify', requests.length || null], ['sparring', 'Sparring plan'], ['gradings', 'Gradings']]} />
      ${body}
      ${viewing && s.athletes[viewing] ? html`<${Sheet} title=${nameOf(s.athletes[viewing])} onClose=${function () { setViewing(null); }}>
        <${FighterPage} s=${s} a=${s.athletes[viewing]} act=${act} viewer="coach" /><//>` : null}</div>`;
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
          <th scope="row"><div className="who"><span className="mini-avatar" aria-hidden="true"><${Face} a=${a} size=${36} /></span><div className="who-text"><button type="button" className="cell-link" onClick=${function () { props.open(a.id); }}>${nameOf(a)}</button><span className="small muted">${a.division} · ${a.weightClass}${isMinor(a) ? ' · guardian-managed' : ''}${a.joinStatus === 'pending' ? ' · join request' : ''}</span></div></div></th>
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
    { role: 'athlete', tab: 'onboarding', title: 'Join as a new athlete', text: 'Sign up: age check, guardian consent for under-18s, gym, fighter details, photo and a join request to the coach.' },
    { role: 'athlete', tab: 'pathway', title: 'Ask for a check', text: 'As Layla, open Pathway and tap “Ask coach to check” on any skill below 100%.' },
    { role: 'coach', tab: 'verify', title: 'Verify it as the coach', text: 'The request is waiting for Coach Hassan Jizzini. Pick a level and verify it.' },
    { role: 'official', tab: 'bout', title: 'Sign a bout sheet', text: 'Score three rounds as the officials. Signing writes the result to the athlete’s record.' },
    { role: 'official', tab: 'medical', title: 'Issue a suspension', text: 'Record a post-stoppage suspension. The coach’s sparring plan blocks that athlete at once.' },
    { role: 'athlete', tab: 'events', title: 'Check eligibility', text: 'Back as an athlete, try to register. Medical, suspension and level decide, not a form.' },
    { role: 'athlete', tab: 'profile', title: 'Open the fighter page', text: 'Profile shows the full fighter page: record, finishes, skills by area, every bout with its scorecard, and level history.' }
  ];
  function Guide(props) {
    return html`<div className="guide">
      <p className="tr-label guide-kicker">Guided demo · 3 minutes</p>
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
    var os = useState(FIRST_VISIT), onboarding = os[0], setOnboarding = os[1];
    var timer = useRef(null);
    useEffect(function () { try { window.localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* storage blocked */ } }, [s]);
    function act(a, msg, kind) {
      if (a.type !== 'noop') dispatch(a);
      if (msg) { setToast({ msg: msg, kind: kind || '' }); clearTimeout(timer.current); timer.current = setTimeout(function () { setToast(null); }, 4000); }
    }
    function setTab(role) { return function (t) { setNav(function (cur) { var o = Object.assign({}, cur); o[role] = t; return o; }); }; }
    function go(role, tab) {
      if (role !== s.role) dispatch({ type: 'role', role: role });
      if (tab === 'onboarding') setOnboarding(true);
      else { setOnboarding(false); setTab(role)(tab); }
      setGuideOpen(false); window.scrollTo(0, 0);
    }
    function startOnboarding() { go('athlete', 'onboarding'); }
    function closeOnboarding(tab) { setOnboarding(false); if (tab) setTab('athlete')(tab); window.scrollTo(0, 0); }
    var here = s.role === 'athlete' && onboarding ? 'onboarding' : nav[s.role];
    var view = s.role === 'coach' ? html`<${CoachPortal} s=${s} act=${act} tab=${nav.coach} setTab=${setTab('coach')} />`
      : s.role === 'official' ? html`<${OfficialDesk} s=${s} act=${act} tab=${nav.official} setTab=${setTab('official')} />`
      : html`<${AthleteApp} s=${s} act=${act} tab=${nav.athlete} setTab=${setTab('athlete')}
          onboarding=${onboarding} startOnboarding=${startOnboarding} closeOnboarding=${closeOnboarding} />`;
    return html`<div className="shell">
      <${DemoBar} s=${s} act=${act} openGuide=${function () { setGuideOpen(true); }} startOnboarding=${startOnboarding} closeOnboarding=${closeOnboarding} />
      <div className=${'stage stage-' + s.role}>
        <div className="stage-main">${view}</div>
        ${s.role === 'athlete' ? html`<aside className="stage-guide" aria-label="Guided demo"><${Guide} role=${s.role} tab=${here} go=${go} /></aside>` : null}
      </div>
      ${guideOpen ? html`<${Sheet} title="How to demo" onClose=${function () { setGuideOpen(false); }}><${Guide} role=${s.role} tab=${here} go=${go} /><//>` : null}
      <div className="toast-zone" aria-live="polite">${toast ? html`<div className=${'toast toast-' + (toast.kind || 'plain')} role="status">
        ${TOAST_ICON[toast.kind] ? html`<span className="toast-icon"><${Icon} name=${TOAST_ICON[toast.kind]} size=${16} strokeWidth=${3} /></span>` : null}${toast.msg}</div>` : null}</div>
    </div>`;
  }

  ReactDOM.createRoot(document.getElementById('app')).render(h(App));
})();
