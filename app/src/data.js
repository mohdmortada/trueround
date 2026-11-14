/* TrueRound demo data. Every person, gym and event here is fictional, except Mohammad Mortada,
   added on request with a real photo. The record, level and medical on that profile are still demo values. */
window.TR_DATA = (function () {
  var TODAY = '2026-11-14';
  var LEVELS = ['Foundation', 'Novice', 'Intermediate', 'Advanced', 'Elite'];
  var AREAS = [
    { id: 'striking', name: 'Striking', skills: [['jab-cross', 'Jab-cross combinations'], ['low-kick', 'Low kick and check'], ['footwork', 'Defensive footwork'], ['counters', 'Counter striking']] },
    { id: 'clinch', name: 'Clinch', skills: [['collar-tie', 'Collar-tie control'], ['clinch-strikes', 'Strikes in the clinch'], ['fence-escape', 'Fence escapes']] },
    { id: 'takedowns', name: 'Takedowns', skills: [['double-leg', 'Double-leg takedown'], ['single-leg', 'Single-leg finish'], ['sprawl', 'Sprawl and recovery']] },
    { id: 'ground', name: 'Ground', skills: [['guard-retention', 'Guard retention'], ['escapes', 'Positional escapes'], ['top-control', 'Top control'], ['sub-defence', 'Submission defence']] },
    { id: 'safety', name: 'Safety and rules', skills: [['tapping', 'Tapping and signalling'], ['legal-targets', 'Legal targets by division'], ['weigh-in', 'Weigh-in and hydration protocol']] }
  ];

  function skills(values, pending, dates) {
    var out = {}, i = 0;
    AREAS.forEach(function (a) {
      a.skills.forEach(function (s) {
        var v = values[i % values.length];
        out[s[0]] = { value: v, status: v > 0 ? 'verified' : 'none', by: v > 0 ? 'hassan' : null, date: v > 0 ? (dates ? dates[i % dates.length] : '2026-10-28') : null };
        i++;
      });
    });
    (pending || []).forEach(function (p) { out[p[0]].status = 'pending'; out[p[0]].requested = p[1]; out[p[0]].requestedOn = p[2] || '2026-11-12'; });
    return out;
  }

  var athletes = {
    layla: { id: 'layla', first: 'Layla', last: 'Haddad', dob: '2001-05-14', nation: 'LBN', gym: 'Cedar Combat Club', coach: 'hassan', weightClass: '57 kg', division: 'Senior women', level: 3, email: 'layla.haddad@example.com',
      clearance: { until: '2027-03-30', issuedBy: 'Event doctor · Lic. MD-2291', issuedOn: '2026-09-30' }, suspension: null, privacy: { publicPage: true, shareCards: true, marketing: false },
      skills: skills([100, 90, 80, 70, 100, 80, 60, 80, 90, 100, 70, 60, 90, 80, 100, 100, 90], [['guard-retention', 80, '2026-11-12'], ['counters', 80, '2026-11-13']], ['2026-11-04', '2026-10-28', '2026-10-21', '2026-09-30']),
      unlocked: [0, 1, 2, 3], watched: ['adv-1', 'adv-2'] },
    mohammad: { id: 'mohammad', first: 'Mohammad', last: 'Mortada', photo: 'mohammad-mortada.jpg', dob: '1990-01-01', nation: 'LBN', gym: 'Cedar Combat Club', coach: 'hassan', weightClass: '84 kg', division: 'Senior men', level: 2, email: 'mohammad.mortada@example.com',
      clearance: { until: '2027-05-20', issuedBy: 'Event doctor · Lic. MD-2291', issuedOn: '2026-05-20' }, suspension: null, privacy: { publicPage: true, shareCards: true, marketing: false },
      skills: skills([90, 80, 70, 60, 80, 70, 50, 70, 60, 50, 60, 50, 60, 70, 100, 90, 90], [['single-leg', 70, '2026-11-12']], ['2026-11-06', '2026-10-24', '2026-10-10']),
      unlocked: [0, 1, 2], watched: ['int-1'] },
    omar: { id: 'omar', first: 'Omar', last: 'Saleh', dob: '2009-08-02', nation: 'LBN', gym: 'Cedar Combat Club', coach: 'hassan', weightClass: '66 kg', division: 'Junior men', level: 1, email: 'r.saleh@example.com', guardian: { name: 'Rana Saleh', email: 'r.saleh@example.com', consentOn: '2025-09-01' },
      clearance: { until: '2027-01-20', issuedBy: 'Event doctor · Lic. MD-2291', issuedOn: '2026-01-20' }, suspension: null, privacy: { publicPage: false, shareCards: false, marketing: false },
      skills: skills([60, 40, 30, 0, 50, 20, 0, 40, 30, 20, 30, 0, 20, 30, 100, 80, 70], [['sprawl', 40, '2026-11-11']]),
      unlocked: [0, 1], watched: ['nov-1'] },
    nour: { id: 'nour', first: 'Nour', last: 'Khalil', dob: '2004-02-09', nation: 'LBN', gym: 'Cedar Combat Club', coach: 'hassan', weightClass: '52 kg', division: 'Senior women', level: 2, email: 'nour.k@example.com',
      clearance: { until: '2027-06-02', issuedBy: 'Event doctor · Lic. MD-1847', issuedOn: '2026-06-02' }, suspension: null, privacy: { publicPage: true, shareCards: true, marketing: true },
      skills: skills([80, 70, 60, 50, 70, 60, 40, 70, 60, 50, 60, 50, 40, 60, 100, 90, 80], [['top-control', 70, '2026-11-10']]),
      unlocked: [0, 1, 2], watched: [] },
    tariq: { id: 'tariq', first: 'Tariq', last: 'Mansour', dob: '1998-11-30', nation: 'LBN', gym: 'Cedar Combat Club', coach: 'hassan', weightClass: '77 kg', division: 'Senior men', level: 4, email: 'tariq.m@example.com',
      clearance: { until: '2027-02-15', issuedBy: 'Event doctor · Lic. MD-2291', issuedOn: '2026-02-15' }, suspension: { until: '2026-12-12', reason: 'Mandatory rest after a stoppage', issuedBy: 'Event doctor · Lic. MD-3305', issuedOn: '2026-11-08' }, privacy: { publicPage: true, shareCards: true, marketing: false },
      skills: skills([100, 100, 90, 90, 100, 90, 90, 100, 100, 90, 90, 100, 90, 90, 100, 100, 100]),
      unlocked: [0, 1, 2, 3, 4], watched: [] },
    sami: { id: 'sami', first: 'Sami', last: 'Aoun', dob: '2006-04-18', nation: 'LBN', gym: 'Cedar Combat Club', coach: 'hassan', weightClass: '61 kg', division: 'Senior men', level: 1, email: 'sami.aoun@example.com',
      clearance: { until: '2026-11-28', issuedBy: 'Event doctor · Lic. MD-1847', issuedOn: '2025-11-28' }, suspension: null, privacy: { publicPage: true, shareCards: true, marketing: false },
      skills: skills([50, 40, 40, 20, 40, 30, 20, 50, 40, 30, 30, 20, 30, 20, 100, 70, 60], [['low-kick', 50, '2026-11-13'], ['double-leg', 60, '2026-11-13']]),
      unlocked: [0, 1], watched: [] }
  };

  // Fighter-page details: nickname, stance, hometown, when they joined, licence, and the date each level was reached.
  var profiles = {
    layla: { nickname: 'Lightning', stance: 'Orthodox', hometown: 'Byblos', since: '2023-09-02', licence: 'LBN-A-0457', history: ['2023-09-02', '2024-03-09', '2025-01-25', '2026-01-24'] },
    mohammad: { nickname: '', stance: 'Orthodox', hometown: '', since: '2024-10-19', licence: 'LBN-A-0912', history: ['2024-10-19', '2025-05-17', '2026-02-21'] },
    omar: { nickname: '', stance: 'Orthodox', hometown: 'Beirut', since: '2025-09-01', licence: 'LBN-J-0133', history: ['2025-09-01', '2026-06-13'] },
    nour: { nickname: 'Quiet Storm', stance: 'Southpaw', hometown: 'Zahle', since: '2024-02-10', licence: 'LBN-A-0688', history: ['2024-02-10', '2024-12-07', '2025-11-15'] },
    tariq: { nickname: 'The Wall', stance: 'Orthodox', hometown: 'Tripoli', since: '2022-06-15', licence: 'LBN-A-0201', history: ['2022-06-15', '2023-01-21', '2023-11-18', '2024-10-26', '2025-12-13'] },
    sami: { nickname: '', stance: 'Switch', hometown: 'Sidon', since: '2025-11-20', licence: 'LBN-A-1040', history: ['2025-11-20', '2026-09-12'] }
  };
  Object.keys(profiles).forEach(function (k) { Object.assign(athletes[k], profiles[k], { notify: { push: true, events: true } }); });

  function D(red, blue) { return [red, blue]; }
  var bouts = [
    { id: 'b1', athlete: 'layla', event: 'Levant Open 2026', city: 'Amman', date: '2026-10-12', corner: 'red', opponent: 'Mira Sokolova', oppNation: 'KAZ', result: 'win', method: 'Unanimous decision', round: 3, time: '3:00', judges: [[D(10, 9), D(10, 9), D(9, 10)], [D(10, 9), D(10, 9), D(10, 9)], [D(10, 9), D(9, 10), D(10, 9)]], official: 'Official #A-118' },
    { id: 'b2', athlete: 'layla', event: 'Cedar Cup Summer 2026', city: 'Beirut', date: '2026-08-23', corner: 'blue', opponent: 'Elif Kaya', oppNation: 'TUR', result: 'win', method: 'Submission (rear-naked choke)', round: 2, time: '2:41', official: 'Official #A-102' },
    { id: 'b3', athlete: 'layla', event: 'Gulf Invitational 2026', city: 'Doha', date: '2026-05-30', corner: 'red', opponent: 'Ayu Lestari', oppNation: 'IDN', result: 'loss', method: 'Split decision', round: 3, time: '3:00', judges: [[D(10, 9), D(9, 10), D(9, 10)], [D(10, 9), D(10, 9), D(9, 10)], [D(9, 10), D(10, 9), D(9, 10)]], official: 'Official #G-021' },
    { id: 'b4', athlete: 'layla', event: 'National Championships 2026', city: 'Beirut', date: '2026-03-14', corner: 'red', opponent: 'Rima Fares', oppNation: 'LBN', result: 'win', method: 'Referee stops contest (strikes)', round: 1, time: '1:12', official: 'Official #A-118' },
    { id: 'b5', athlete: 'layla', event: 'National Championships 2026', city: 'Beirut', date: '2026-03-13', corner: 'blue', opponent: 'Carla Mattar', oppNation: 'LBN', result: 'win', method: 'Unanimous decision', round: 3, time: '3:00', judges: [[D(9, 10), D(9, 10), D(10, 9)], [D(9, 10), D(9, 10), D(9, 10)], [D(9, 10), D(10, 9), D(9, 10)]], official: 'Official #A-118' },
    { id: 'b6', athlete: 'layla', event: 'Levant Open 2025', city: 'Amman', date: '2025-10-18', corner: 'red', opponent: 'Dana Qasem', oppNation: 'JOR', result: 'win', method: 'Submission (armbar)', round: 1, time: '2:05', official: 'Official #J-044' },
    { id: 'b7', athlete: 'layla', event: 'Levant Open 2025', city: 'Amman', date: '2025-10-17', corner: 'red', opponent: 'Zeynep Arslan', oppNation: 'TUR', result: 'loss', method: 'Unanimous decision', round: 3, time: '3:00', judges: [[D(9, 10), D(9, 10), D(10, 9)], [D(9, 10), D(9, 10), D(9, 10)], [D(9, 10), D(10, 9), D(9, 10)]], official: 'Official #J-044' },
    { id: 'b8', athlete: 'layla', event: 'Cedar Cup 2025', city: 'Beirut', date: '2025-06-07', corner: 'blue', opponent: 'Maya Azar', oppNation: 'LBN', result: 'win', method: 'Unanimous decision', round: 3, time: '3:00', judges: [[D(9, 10), D(9, 10), D(9, 10)], [D(9, 10), D(10, 9), D(9, 10)], [D(9, 10), D(9, 10), D(9, 10)]], official: 'Official #A-102' },
    { id: 'b9', athlete: 'layla', event: 'National Championships 2025', city: 'Beirut', date: '2025-03-22', corner: 'red', opponent: 'Lea Haddad', oppNation: 'LBN', result: 'win', method: 'Referee stops contest (strikes)', round: 2, time: '0:48', official: 'Official #A-118' },
    { id: 'b10', athlete: 'layla', event: 'National Championships 2025', city: 'Beirut', date: '2025-03-21', corner: 'red', opponent: 'Joelle Rizk', oppNation: 'LBN', result: 'win', method: 'Submission (triangle choke)', round: 2, time: '1:37', official: 'Official #A-118' },
    { id: 'b11', athlete: 'layla', event: 'Cedar Cup 2024', city: 'Beirut', date: '2024-11-09', corner: 'blue', opponent: 'Sara Daher', oppNation: 'LBN', result: 'win', method: 'Unanimous decision', round: 3, time: '3:00', judges: [[D(9, 10), D(9, 10), D(10, 9)], [D(9, 10), D(9, 10), D(9, 10)], [D(9, 10), D(9, 10), D(9, 10)]], official: 'Official #A-102' },
    { id: 'b12', athlete: 'layla', event: 'Cedar Cup 2024', city: 'Beirut', date: '2024-06-15', corner: 'red', opponent: 'Hiba Nasr', oppNation: 'LBN', result: 'win', method: 'Submission (rear-naked choke)', round: 1, time: '2:52', official: 'Official #A-102' },
    { id: 'b13', athlete: 'layla', event: 'Novice Open 2024', city: 'Beirut', date: '2024-02-24', corner: 'red', opponent: 'Rita Khoury', oppNation: 'LBN', result: 'win', method: 'Unanimous decision', round: 3, time: '3:00', judges: [[D(10, 9), D(10, 9), D(10, 9)], [D(10, 9), D(10, 9), D(10, 9)], [D(10, 9), D(9, 10), D(10, 9)]], official: 'Official #A-102' },
    { id: 'b40', athlete: 'mohammad', event: 'Cedar Cup Autumn 2026', city: 'Beirut', date: '2026-11-08', corner: 'red', opponent: 'Yusuf Demir', oppNation: 'TUR', result: 'win', method: 'Unanimous decision', round: 3, time: '3:00', judges: [[D(10, 9), D(10, 9), D(10, 9)], [D(10, 9), D(9, 10), D(10, 9)], [D(10, 9), D(10, 9), D(9, 10)]], official: 'Official #A-118' },
    { id: 'b41', athlete: 'mohammad', event: 'Levant Open 2026', city: 'Amman', date: '2026-10-11', corner: 'blue', opponent: 'Zaid Haddadin', oppNation: 'JOR', result: 'win', method: 'Submission (guillotine choke)', round: 2, time: '1:48', official: 'Official #J-044' },
    { id: 'b42', athlete: 'mohammad', event: 'Cedar Cup Summer 2026', city: 'Beirut', date: '2026-08-22', corner: 'red', opponent: 'Ruslan Abenov', oppNation: 'KAZ', result: 'loss', method: 'Split decision', round: 3, time: '3:00', judges: [[D(10, 9), D(10, 9), D(9, 10)], [D(9, 10), D(10, 9), D(9, 10)], [D(9, 10), D(9, 10), D(10, 9)]], official: 'Official #A-102' },
    { id: 'b43', athlete: 'mohammad', event: 'National Championships 2026', city: 'Beirut', date: '2026-03-14', corner: 'red', opponent: 'Marc Azzi', oppNation: 'LBN', result: 'win', method: 'Referee stops contest (strikes)', round: 1, time: '2:20', official: 'Official #A-118' },
    { id: 'b44', athlete: 'mohammad', event: 'Cedar Cup 2025', city: 'Beirut', date: '2025-06-07', corner: 'blue', opponent: 'Fadi Nehme', oppNation: 'LBN', result: 'win', method: 'Unanimous decision', round: 3, time: '3:00', judges: [[D(9, 10), D(9, 10), D(10, 9)], [D(9, 10), D(9, 10), D(9, 10)], [D(10, 9), D(9, 10), D(9, 10)]], official: 'Official #A-102' },
    { id: 'b20', athlete: 'tariq', event: 'Cedar Cup Autumn 2026', city: 'Beirut', date: '2026-11-08', corner: 'red', opponent: 'Bekzat Nurlan', oppNation: 'KAZ', result: 'loss', method: 'Referee stops contest (strikes)', round: 2, time: '1:55', official: 'Official #A-118' },
    { id: 'b21', athlete: 'tariq', event: 'Levant Open 2026', city: 'Amman', date: '2026-10-11', corner: 'blue', opponent: 'Hamza Odeh', oppNation: 'JOR', result: 'win', method: 'Unanimous decision', round: 3, time: '3:00', judges: [[D(9, 10), D(9, 10), D(9, 10)], [D(9, 10), D(10, 9), D(9, 10)], [D(9, 10), D(9, 10), D(9, 10)]], official: 'Official #J-044' },
    { id: 'b30', athlete: 'nour', event: 'Cedar Cup Summer 2026', city: 'Beirut', date: '2026-08-22', corner: 'red', opponent: 'Yara Saad', oppNation: 'LBN', result: 'win', method: 'Unanimous decision', round: 3, time: '3:00', judges: [[D(10, 9), D(10, 9), D(10, 9)], [D(10, 9), D(9, 10), D(10, 9)], [D(10, 9), D(10, 9), D(10, 9)]], official: 'Official #A-102' },
    { id: 'b31', athlete: 'omar', event: 'Junior Open 2026', city: 'Beirut', date: '2026-09-27', corner: 'blue', opponent: 'Karl Sfeir', oppNation: 'LBN', result: 'draw', method: 'Split draw', round: 3, time: '2:00', judges: [[D(10, 9), D(9, 10), D(10, 10)], [D(10, 9), D(9, 10), D(9, 10)], [D(9, 10), D(10, 9), D(10, 9)]], official: 'Official #A-118' }
  ];

  var events = [
    { id: 'ev1', name: 'Cedar Cup Winter 2026', city: 'Beirut', date: '2026-12-19', closes: '2026-12-05', scope: 'National', minLevel: 1, divisions: ['Senior', 'Junior'] },
    { id: 'ev2', name: 'Levant Open 2027', city: 'Amman', date: '2027-02-13', closes: '2027-01-23', scope: 'Regional', minLevel: 2, divisions: ['Senior'] },
    { id: 'ev3', name: 'Continental Championships 2027', city: 'Jakarta', date: '2027-05-08', closes: '2027-03-31', scope: 'Continental', minLevel: 3, divisions: ['Senior', 'Junior'] }
  ];

  var library = [
    { level: 0, price: 0, videos: [['fnd-1', 'Stance, guard and basic movement', '6:10'], ['fnd-2', 'How to tap, and when the referee steps in', '4:45'], ['fnd-3', 'Breakfall basics', '5:30']] },
    { level: 1, price: 15, videos: [['nov-1', 'Jab-cross and resetting your stance', '7:20'], ['nov-2', 'Collar-tie entries', '6:05'], ['nov-3', 'Sprawl timing drills', '5:50']] },
    { level: 2, price: 20, videos: [['int-1', 'Checking the low kick', '6:40'], ['int-2', 'Fence escapes from the underhook', '8:15'], ['int-3', 'Holding guard against posture', '7:05']] },
    { level: 3, price: 25, videos: [['adv-1', 'Counter striking off the slip', '9:10'], ['adv-2', 'Chain wrestling: single to double', '8:30'], ['adv-3', 'Guard retention under pressure', '7:45']] },
    { level: 4, price: 30, videos: [['eli-1', 'Round management and scoring', '10:20'], ['eli-2', 'Top control to submission chains', '9:40'], ['eli-3', 'Weight cut and rehydration protocol', '8:00']] }
  ];

  var feed = [
    { id: 'f1', athlete: 'layla', date: '2026-11-04', kind: 'verified', text: 'Coach Hassan Jizzini verified Double-leg takedown at 80%.' },
    { id: 'f2', athlete: 'layla', date: '2026-10-12', kind: 'result', text: 'Result written by Official #A-118: win by unanimous decision at Levant Open 2026.' },
    { id: 'f3', athlete: 'layla', date: '2026-09-30', kind: 'medical', text: 'Pre-competition medical recorded. Cleared to compete until 30 Mar 2027.' },
    { id: 'f5', athlete: 'mohammad', date: '2026-11-08', kind: 'result', text: 'Result written by Official #A-118: win by unanimous decision at Cedar Cup Autumn 2026.' },
    { id: 'f6', athlete: 'mohammad', date: '2026-11-06', kind: 'verified', text: 'Coach Hassan Jizzini verified Jab-cross combinations at 90%.' },
    { id: 'f4', athlete: 'tariq', date: '2026-11-08', kind: 'medical', text: 'Medical suspension issued. No contact sparring until 12 Dec 2026.' }
  ];

  return {
    TODAY: TODAY, LEVELS: LEVELS, AREAS: AREAS,
    coaches: { hassan: { id: 'hassan', name: 'Hassan Jizzini', gym: 'Cedar Combat Club', licence: 'Coach Level 2 · LBN-C-0193' } },
    gyms: [{ id: 'cedar', name: 'Cedar Combat Club', city: 'Beirut', coach: 'hassan', athletes: 38 }, { id: 'harbour', name: 'Harbour MMA', city: 'Tripoli', coach: 'hassan', athletes: 21 }],
    federations: [['LBN', 'Lebanon'], ['IDN', 'Indonesia'], ['TUR', 'Türkiye'], ['JOR', 'Jordan'], ['KAZ', 'Kazakhstan'], ['EGY', 'Egypt'], ['UAE', 'United Arab Emirates']],
    seed: function () {
      return JSON.parse(JSON.stringify({ v: 1, role: 'athlete', viewAs: 'layla', athletes: athletes, bouts: bouts, events: events, registrations: [{ event: 'ev1', athlete: 'layla', weightClass: '57 kg', on: '2026-11-02' }, { event: 'ev1', athlete: 'mohammad', weightClass: '84 kg', on: '2026-11-09' }], library: library, feed: feed, gradings: [{ id: 'g1', athlete: 'nour', from: 2, to: 3, coach: 'hassan', status: 'recommended', on: '2026-11-10' }], sparring: [] }));
    }
  };
})();
