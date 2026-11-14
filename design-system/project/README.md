# TrueRound

TrueRound is the verified athlete platform for amateur mixed martial arts: a coach-verified training pathway, an official competition record written by the people who ran the bout, and medical clearance that travels with the athlete. It is being prepared as a partnership proposal for GAMMA (Global Association of Mixed Martial Arts). It is the sibling of Taegeuk, built on the same model for a different sport.

Tagline: **Every round, on the record.**

## The idea the brand rests on

In amateur MMA, a record is only as good as the person who wrote it down. Screenshots, spreadsheets and self-reported fight histories are how most athletes prove themselves today. TrueRound's look is borrowed from the one document everyone in the sport already trusts: **the official scorecard**. Ruled rows, tabular figures, red on the left and blue on the right, a heavy rule above the total, and a signature at the bottom.

## Voice

The voice is the official's, not the promoter's. Factual, calm, exact.

- **Say who did it.** "Verified by Coach Hassan Jizzini, 4 Nov 2026." "Result written by Official #A-118." Never "Verified!" on its own.
- **Name the real thing.** Use the sport's own terms: weigh-in, bout sheet, unanimous decision, referee stops contest, medical suspension. Don't use gym-app slang like streaks, XP, "crushing it" or "beast mode".
- **No hype about violence.** No blood, no "war", no "destroy". Amateur MMA is chasing Olympic recognition, and the copy should read like it belongs there.
- **Sentence case** for everything except display lines, which are set uppercase by the display style itself.
- **Numbers stay plain.** "11-2-0", "29:28", "57 kg". No exclamation marks, no emoji.
- **Safety copy is direct.** "Suspended. No contact sparring until 12 Dec 2026." The date is always there.

| Do | Don't |
| --- | --- |
| Result written by the event's officials | Your win has been added! |
| Awaiting Coach Jizzini | Pending |
| No contact sparring until 12 Dec | You're on a break |
| Watching prepares you. Only your coach can move your progress. | Watch videos to level up |

## Colour

The palette is ink and paper with three jobs for colour. Every colour has one meaning and keeps it everywhere.

- **Ink and canvas** (`ink`, `canvas`, `surface`, `surface-sunken`, `line`, `rule`) carry almost everything. Primary actions are ink-filled buttons with `on-ink` text.
- **Gold means verified** (`gold`, `gold-soft`, `gold-mark`). It's the check in the logo, the badge on a signed-off skill, the current level on the pathway. If nobody with authority signed it, it isn't gold.
- **Red and blue belong to the corners** (`corner-red`, `corner-blue` and their `-soft` tints). They identify the two athletes in a bout: scorecard columns, corner tags, bout cards. They never mean good, bad, error or brand.
- **Safety states** have their own colours, always paired with a word and an icon: `cleared` (green, shield), `caution` (amber, clock), `stop` (deep raspberry, bar). `stop` is deliberately darker and pinker than `corner-red` so a suspended athlete in the red corner never reads as one signal.
- Focus is a 2px gap in `canvas`, then 2px of `focus-ring`.

Both themes are designed: light is the default for the app and the coach portal; dark is for fight nights, the share card and deck title slides. Every text token's note names the surfaces it passes 4.5:1 on. `ink-faint` is the one exception: icons and borders only.

## Type

- **Display: Archivo at 125% width**, heavy, uppercase (`display-xl`, `display-l`, `headline`). It reads like a broadcast caption or a fight poster. Use it for athlete names, event names and screen titles, never for sentences. Apply with the `tr-display` class, which also sets the width.
- **Text: IBM Plex Sans** (`title`, `body`, `body-sm`, `label`). It's institutional and plain, which is what an official form should look like.
- **Data: IBM Plex Mono** with tabular figures (`stat-xl`, `stat`, `data`) for every score, record, weight, date and ID. Digits always line up.

All three are Google Fonts and load from `components/bundle.css`. If the brand moves to licensed faces later, keep the roles: a wide display face, a plain sans and a tabular mono.

## Space, radius, lines

- 4px base. Screens breathe (`space-4` gutters, `space-6` between cards); scorecards and rosters stay dense (`space-2`/`space-3` cells).
- Corners are squared like printed cards: `radius-sm` on controls, `radius-md` on cards. Only round things are round: avatars, corner dots, toggles.
- Lines do the separating, not shadows: `stroke-hairline` between rows, `stroke-rule` under headers and above totals, `stroke-heavy` for the corner stripe on a bout card.

## Motion

The record reveals itself once, the way a result is read out:
- **Scorecard:** each judge's round scores tick in order, then the totals, then the result line, all within about a second.
- **Skill meters and level ladder:** meters fill segment by segment, and the current level draws in.
- **Records:** totals count up when `Record` gets `animate`. They always land on the real number, even in background tabs and thumbnails.

Rules:
- Motion plays on arrival and never loops.
- Durations are 150–300ms for interface feedback and up to 900ms for a reveal.
- Easing is a sharp ease-out (`cubic-bezier(.2, .8, .2, 1)`), never bouncy.
- With reduced motion turned on, nothing moves and every value shows at once.

## Texture

Surfaces can carry a faint ruled-paper pattern: one hairline every 32px at about 4% ink, like the ruled sheet of a scorecard. Use it on the page background and on dark header cards, never behind running text.

The three-round ring from the mark can appear large and cropped as a watermark: two arcs in faint ink, the third in gold. Use it once per screen at most.

## Logo

The mark is a ring cut into three arcs, the three rounds of an amateur bout, with a gold check inside: the round, verified. The wordmark is drawn on a grid of 6px strokes to echo the scorecard's rules.

- `trueround-lockup.svg` / `trueround-lockup-dark.svg`: the mark and wordmark together, for headers and title slides.
- `trueround-mark.svg` / `-dark`: app icon, favicon, avatar fallbacks. Tested at 32px.
- `trueround-wordmark.svg` / `-dark`: where the mark already appears nearby.
- Use the light files on `canvas`/`surface` and the dark files on ink or photography. Never recolour the check: it is always gold.
- Clear space is the height of the wordmark on every side. Don't rotate, outline or add effects.

## Iconography

Line icons on a 24px grid with a 2px stroke, square caps and mitred joins, so they share the wordmark's squared-off construction. They come from the `Icon` component and follow the text colour. No emoji, no filled illustration icons, no mascots.

## Components

All components live in `components/bundle.js` as `window.TrueRound` and expect React 18 on the page. Load tokens.css, then `components/bundle.css`, then the bundle.

| Group | Components |
| --- | --- |
| Actions | `Button` |
| Status | `Badge`, `CornerTag` |
| Competition | `Scorecard`, `Record` |
| Progression | `LevelLadder`, `SkillMeter` |
| Safety | `ClearanceCard` |
| Profiles | `AthleteCard` |
| Forms | `Field`, `Toggle` |
| Navigation | `BottomNav` |
| Foundations | `Icon` |

## Product rules the design enforces

These are product decisions, not just styling. The components are built so the right thing is the easy thing.

1. **Only an authorised person moves a record.** Coaches verify skills; officials write results; event doctors issue clearance. Athletes can request, never edit.
2. **Watching is preparation, not progress.** Learn content never changes a skill meter.
3. **Medical status, not medical data.** `ClearanceCard` stores a status, a date and who issued it. It has no field for a diagnosis.
4. **Minors are private by default.** `AthleteCard` for an under-18 shows first name and last initial, gym and level only.
5. **Corners are identity, not judgement.** Red and blue never signal success or failure.

## Assumptions to confirm

- The name **TrueRound** passed a first screen (WIPO Global Brand Database, USPTO search, app stores), but it still needs a formal clearance search in classes 9, 41 and 42 before any filing.
- The level names (Foundation → Elite) are placeholders for GAMMA's own syllabus.
- The fonts are Google Fonts stand-ins; there are no licensed brand faces yet.
