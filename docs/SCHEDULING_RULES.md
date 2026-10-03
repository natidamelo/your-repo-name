# Scheduling Engine & Operational Constraint Rules

This document outlines the operational scheduling rules enforced by the Constraint Engine (`backend/app/engine/`).

---

## 1. Sunday Operating Squad Rules

* **Exact Staff Count:** On every Sunday, **exactly 4 staff members** are scheduled in the office. Never more, never less.
* **Sunday Restricted Staff:**
  * **Yordi** is strictly `OFF` on Sunday.
  * **Obsa** is strictly `OFF` on Sunday.
* **Alternating Sunday Duty:**
  * **Hebron** and **Beti** alternate Sunday duty every week.
  * **Week 1 (Anchor):** Beti works Sunday duty; Hebron is `OFF`.
  * **Week 2:** Hebron works Sunday duty; Beti is `OFF`.
  * **Mutual Presence:** Hebron and Beti must **NEVER** both be `OFF` on Sunday.
* **Compensatory Monday Off:**
  * If Beti works Sunday &rarr; Beti is automatically `OFF` the following Monday.
  * If Hebron works Sunday &rarr; Hebron is automatically `OFF` the following Monday.
* **Sunday Squad Support:** The remaining 3 Sunday squad members alternate fairly among eligible staff (Shalom, Biruk, Luam, Feruza, Tirsit, Rediet, Hermela, Yeab).

---

## 2. Saturday Half-Day Rotation Rules

Hebron and Beti alternate Saturday half-day shifts weekly:

### Week A (Even Weeks, starting September 28, 2026)
* **Beti:** Morning Half (`AM_HALF`, 09:00 AM – 02:00 PM)
* **Hebron:** Afternoon Half (`PM_HALF`, 01:00 PM – 05:00 PM)

### Week B (Odd Weeks)
* **Hebron:** Morning Half (`AM_HALF`, 08:00 AM – 12:00 PM)
* **Beti:** Afternoon Half (`PM_HALF`, 02:00 PM – 06:00 PM)

> [!IMPORTANT]
> The engine prohibits assigning both Hebron and Beti to the same Saturday half-day.

---

## 3. Mutual Presence Rule (Hebron & Beti)

* **Hebron and Beti can NEVER both be OFF on the same calendar day** (Monday through Sunday).
* When one takes an approved day off, the other must be scheduled to work.

---

## 4. Days Off Rules

* Every regular employee receives **exactly 2 days off per 7-day week**.
* For employees working Sunday duty, Sunday is counted as a work shift, and their 2 days off are taken during weekdays (including the mandatory post-Sunday Monday off for Beti/Hebron).

---

## 5. Beti Coverage by Yeab

* **Yeab** covers the Call Center channel whenever Beti is `OFF`.
* **Yeab** covers Beti's Call Center responsibilities during Beti's lunch break (**02:00 PM – 03:00 PM**). Yeab's lunch is scheduled from 01:00 PM – 02:00 PM so he is active during Beti's lunch.

---

## 6. Lunch Breaks & Channel Coverage

Lunch breaks are staggered to guarantee continuous coverage across all 6 time slots:
* **Slot 1 (08:00 – 09:00):** Hebron, Shalom, Tirsit, Rediet.
* **Slot 2 (09:00 – 12:00):** Full peak team coverage (Shalom, Biruk, Luam, Obsa, Beti, Yeab).
* **Slot 3 (12:00 – 01:00):** Feruza, Yordi, Hermela cover Call Center while Hebron, Tirsit, Rediet take lunch.
* **Slot 4 (01:00 – 02:00):** Hebron, Tirsit, Rediet return from lunch to cover Call Center while Shalom, Biruk, Luam, Obsa take lunch.
* **Slot 5 (02:00 – 05:00):** Biruk, Luam, Obsa, Shalom, Yeab (covering Beti's lunch at 2–3), Beti (working 3–6).
* **Slot 6 (05:00 – 06:00):** Biruk, Luam, Feruza, Yordi, Hermela, Obsa, Beti, Yeab (all working until 6:00 PM).

### Coverage Thresholds
* **GREEN:** Adequate coverage (&ge; 2 agents active on Call Center).
* **YELLOW:** Limited coverage (1 agent active).
* **RED:** Coverage problem (0 agents active — blocks publishing).
