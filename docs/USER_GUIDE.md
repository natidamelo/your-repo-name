# User Guide & Operational Walkthrough

A practical walkthrough of the **Call Center Staff Scheduling & Management System** for Administrators, Managers, and Staff.

---

## 1. Accessing the System

1. Open your browser and navigate to:
   ```
   http://127.0.0.1:5173/
   ```
2. Log in using your role credentials:
   - **Administrator:** `admin` / `admin123`
   - **Manager:** `manager` / `manager123`
   - **Staff Member:** `staff` / `staff123`

---

## 2. Navigating the Interface

### Operations Dashboard
* Review today's active roster (working agents vs. off-duty agents).
* Check the **Upcoming Saturday Half-Day** card to see who is on AM vs. PM duty.
* Check the **Sunday Squad** card to confirm the 4-staff team.
* Inspect coverage levels across all 6 required time intervals.

### Calendar Roster
* View shifts across **Week**, **2 Weeks (14 Days)**, or **Month**.
* Shift badges indicate status:
  - `WORK` (Emerald): Full workday shift.
  - `OFF` (Slate): Scheduled day off.
  - `AM HALF` (Amber): Saturday morning half-day.
  - `PM HALF` (Purple): Saturday afternoon half-day.
  - `SUNDAY` (Indigo): Sunday 4-squad duty.
* **Editing a Shift:** Click on any shift badge. In the modal, modify shift type, hours, lunch times, or tasks, provide an audit reason, and click **Save & Re-validate**.

### Generating a New Schedule
1. Click **Generate Schedule** (sidebar or top right).
2. Choose your start date (e.g., `2026-09-28`) and duration (`1`, `2`, or `4` weeks).
3. Click **Generate & Validate Preview**.
4. Review the **6-Point Verification Checklist**:
   - 12 Employees Configured
   - Sunday Squad Valid (Exactly 4, Yordi/Obsa OFF, alternating duty)
   - Saturday Rotation Valid (Week A / Week B)
   - Days Off Valid (2 days off per employee)
   - Lunch Coverage Valid
   - Call Center Coverage Valid
5. Choose **Save Draft** or **Publish Schedule**. If any critical errors are detected, publishing is locked until resolved.

### Daily Staff View
* Use the date picker to inspect a specific day.
* Review each agent's working hours, lunch break, and primary/secondary assignments.
* View the 8:00 AM – 6:00 PM density timeline.

### Task & Channel Assignments
* Assign working staff to channels (Call Center, Telegram, GDS, Amadeus, 2839 phone, Email, ELMS, QUE).
* If an agent is assigned a task they lack qualification for, the system immediately flags a warning.

### Exporting & Printing
* **Export to Excel:** Click **Export Excel** in the top bar or calendar view. This downloads a professionally formatted `.xlsx` workbook containing 5 dedicated worksheets.
* **Print Notice:** Click **Print Schedule** in the sidebar. This displays an official print-optimized notice with managerial signature lines ready for physical office posting.
