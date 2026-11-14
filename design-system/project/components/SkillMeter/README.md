# SkillMeter

One skill's progress in ten segments, with who verified it and when. Progress only moves when a coach signs it off after seeing it in person; watching a video never moves it.

- `status="pending"` when the athlete has asked for a check and the coach has not answered.
- `verifiedBy` and `date` are required whenever the value is above zero.
