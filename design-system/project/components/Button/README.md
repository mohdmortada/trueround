# Button

One button per decision. `primary` (ink fill) is the single action a screen exists for; `secondary` is everything else; `quiet` sits in toolbars and rows; `danger` is for removing data or ending something.

- Label with a verb that says what happens: "Verify 3 skills", "Register", "Issue suspension".
- One primary per screen. Never two ink buttons side by side.
- `block` fills the width on mobile sheets and forms.
- Consumer provides: `onClick`, and `disabled` while a decision is incomplete.
