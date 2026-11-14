# ClearanceCard

Medical status for competing and contact training. It holds a status and a date, never a diagnosis: the event doctor decides, the app records only the outcome.

- `cleared`: a valid pre-competition medical, with its expiry.
- `pending`: no valid medical on file, or one expiring within 30 days.
- `suspended`: a mandatory rest period after a stoppage or a doctor's decision. Coaches see it on their roster and cannot book the athlete for contact sparring until the date passes.
- `issuedBy` names the role and licence number, not a person's medical details.
