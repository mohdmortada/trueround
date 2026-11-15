# TrueRound

TrueRound is the verified athlete platform for amateur mixed martial arts: a coach-verified training pathway, an official competition record written by the people who ran the bout, and medical clearance that travels with the athlete. It is being prepared as a partnership proposal for GAMMA (Global Association of Mixed Martial Arts). It is the sibling of Taegeuk, built on the same model for a different sport.

Tagline: **Train • Track • Improve.** Set in Montserrat SemiBold, widely tracked, with gold bullets.

## The idea the brand rests on

In amateur MMA, a record is only as good as the person who wrote it down. Screenshots, spreadsheets and self-reported fight histories are how most athletes prove themselves today. TrueRound turns that into a promise athletes can feel: **train, track, improve**, on a record nobody can fake. The brand is fight-night black and championship gold. The emblem is a broken ring, the rounds, with a gold check breaking out of it: the work, verified. Inside the product, the scorecard still sets the rules: ruled rows, tabular figures, red on the left and blue on the right, and a signature on every fact.

## Voice

The voice is the official's, not the promoter's. Factual, calm, exact.

- **Say who did it.** "Verified by Coach Hassan Jizzini, 4 Nov 2026." "Result written by Official #A-118." Never "Verified!" on its own.
- **Name the real thing.** Use the sport's own terms: weigh-in, bout sheet, unanimous decision, referee stops contest, medical suspension. Don't use gym-app slang like XP, "crushing it" or "beast mode".
- **Energy lives in the display lines.** Short, imperative, uppercase italic: TRAIN HARDER. TRACK SMARTER. Body copy stays calm and exact.
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

Four brand colours, from the brand sheet: **Gold `#E6B800`**, **White `#FFFFFF`**, **Gray `#4A4A4A`**, **Black `#0B0B0B`**. The product is dark first.

- **Black and white carry almost everything** (`canvas`, `surface`, `surface-sunken`, `line`, `rule`, `ink`, `ink-muted`). Cards are a step up from black (`surface #161616`), never gray boxes.
- **Gold is the brand and the proof** (`accent`, `gold`, `gold-soft`, `gold-mark`).
  - It fills every primary button: `accent`, with `on-accent` black text at 11:1.
  - It marks the active tab and the current step, fills the skill meters and draws the emblem's check.
  - On a verified badge it still means someone with authority signed this.
  - Use one gold focal point per area. Gold everywhere is no gold at all.
- **Red and blue belong to the corners** (`corner-red`, `corner-blue` and their tints). They identify the two athletes in a bout and never mean good, bad, error or brand.
- **Safety states** keep their own colours, always with a word and an icon:
  - `cleared`: green, shield.
  - `caution`: orange, clock. It moved off amber so it never reads as brand gold.
  - `stop`: raspberry, bar.
- **Glow:** the app icon's gold edge glow (`glow`) frames the device and one featured card per screen at most.
- **Focus** is a 2px gap in `canvas`, then 2px of `focus-ring`: gold in dark, corner blue in light.

Dark is the default for the app, coach portal, mockups and deck. The light theme exists for print and documents. There, gold text darkens to `#7A6200` and brand gray `#4A4A4A` carries secondary text.

## Type

- **One family: Montserrat**, from the brand sheet.
- **Display:** Montserrat Black and ExtraBold *Italic*, uppercase (`display-xl`, `display-l`, `headline`). It matches the wordmark's forward lean. Use it for athlete names, event names, screen titles and short calls to action, never for sentences. Apply it with the `tr-display` class.
- **Text:** Montserrat Medium for body copy, SemiBold and Bold for interface text (`title`, `body`, `body-sm`, `label`).
- **Data:** Montserrat with tabular figures (`stat-xl`, `stat`, `data`) for every score, record, weight, date and ID, so digits line up.

Montserrat loads from Google Fonts in `components/bundle.css`.

## Space, radius, lines

- **Space:** 4px base. Screens breathe (`space-4` gutters, `space-6` between cards); scorecards and rosters stay dense (`space-2`/`space-3` cells).
- **Radius:** rounded but firm, like the app icon. `radius-sm` (6px) on controls, `radius-md` (12px) on cards. Avatars, corner dots, toggles and the emblem are fully round.
- **Lines** separate, not boxes:
  - `stroke-hairline` between rows;
  - `stroke-rule` under headers and above totals;
  - `stroke-heavy` for the corner stripe on a bout card.

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

- **Ruled pattern:** black surfaces can carry one hairline every 32px at about 3% white, the ruled sheet of a scorecard. Use it on the page background and on hero blocks, never behind running text.
- **Ring watermark:** the emblem's broken ring can appear large and cropped, with three segments in faint white and the fourth in gold. Use it once per screen at most.
- **Gold stripes:** diagonal stripes, like the tagline banner on the brand sheet, may close a hero or a slide. They are never a background behind text.

## Logo

The emblem is a ring broken into four segments, the rounds. The gold segment turns into a check that breaks out of the ring: the work, verified, moving up. The wordmark is Montserrat Black Italic outlines: TRUE in white (or black on light), ROUND in gold. The tagline sits under it in tracked Montserrat SemiBold.

These are vector masters, rebuilt from the supplied brand sheet; the PNGs in the brand pack are reference extractions. Files ending `-light` are for white grounds.
- **Lockups:** `trueround-logo-horizontal.svg` (primary) and `trueround-logo-stacked.svg`.
- **Emblem:** `trueround-emblem.svg`, plus `-mono-white` and `-mono-gray` for single-colour uses such as embossing and watermarks.
- **Wordmark:** `trueround-wordmark.svg`, for where the emblem already appears nearby.
- **App icons:** `trueround-app-icon.svg` (black, primary), `-gold`, `-white` and `-outline` (black with a gold edge). All 1024 × 1024.

Rules:
- **Colour:** never recolour the check or ROUND. Both are always gold, except in the monochrome files.
- **Clear space:** the height of the T on every side.
- **Minimum size:** 24px for the emblem; 120px wide for the horizontal lockup.
- **Don't** rotate, outline, add effects or re-set the wordmark in live text.

## Iconography

Line icons on a 24px grid with a 2px stroke, from the `Icon` component. They follow the text colour: white by default, gold when active or selected, matching the linear/filled pairs on the brand sheet. No emoji, no mascots.

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
- Montserrat is the brand font (OFL). The wordmark is outlined from Montserrat Black Italic; a custom-drawn wordmark can replace it later without changing the rest of the system.
- The logo files are vector rebuilds of the supplied brand sheet. Compare them with the original artwork before printing at large sizes.
