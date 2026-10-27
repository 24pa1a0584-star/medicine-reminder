# DOSEBLOOM — REST API Reference & Specification

All API endpoints are prefixed with `/api`.  
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
Error response envelope:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable explanation",
    "details": [ ... ]
  }
}
```

---

## 1. Authentication & User Profile (`/api/auth`)

### `POST /api/auth/register`
Create a new user account.
- **Access:** Public
- **Request Body:**
  ```json
  {
    "name": "Priya Sharma",
    "email": "priya@dosebloom.app",
    "password": "Password123!",
    "timezone": "Asia/Kolkata"
  }
  ```
- **Response:** `201 Created` with JWT token and user profile object.

### `POST /api/auth/login`
Authenticate existing user.
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "priya@dosebloom.app",
    "password": "Password123!"
  }
  ```
- **Response:** `200 OK` with JWT token and user profile object.

### `GET /api/auth/me`
Retrieve currently authenticated user session.
- **Access:** Protected (`Bearer <token>`)
- **Response:** `200 OK` with user details and preferences.

### `PUT /api/auth/profile`
Update user display name, phone, emergency contact, or notification preferences.
- **Access:** Protected (`Bearer <token>`)

### `POST /api/auth/change-password`
Rotate password with old password verification.
- **Access:** Protected (`Bearer <token>`)

### `GET /api/auth/export-data`
Export complete personal data portfolio under Section 12 of the DPDP Act 2023.
- **Access:** Protected (`Bearer <token>`)
- **Response:** `200 OK` JSON bundle containing all medications, schedules, dose actions, and history.

### `DELETE /api/auth/account`
Permanently delete user account and associated medical records (Section 13, DPDP Act).
- **Access:** Protected (`Bearer <token>`)

---

## 2. Medications & Prescriptions (`/api/medicines`)

### `POST /api/medicines`
Add a new medication with schedule and optional inventory configuration.
- **Access:** Protected (`Bearer <token>`)
- **Request Body:**
  ```json
  {
    "name": "Metformin Hydrochloride",
    "genericName": "Metformin",
    "formulation": "tablet",
    "strength": "500 mg",
    "instructions": "Take after meals with water",
    "colorTag": "emerald",
    "schedule": {
      "recurrenceType": "daily",
      "doseTimes": ["08:00", "20:00"],
      "doseQuantity": 1,
      "startDate": "2026-10-27"
    },
    "inventory": {
      "initialStock": 60,
      "lowStockThreshold": 10
    }
  }
  ```
- **Response:** `201 Created` with created medicine, schedule, and first batch of occurrences.

### `GET /api/medicines`
List all active medications for current user.
- **Access:** Protected (`Bearer <token>`)

### `GET /api/medicines/:id`
Retrieve details of a single medication, its active schedule, and inventory record.
- **Access:** Protected (`Bearer <token>`)

### `PUT /api/medicines/:id`
Update medication descriptive metadata (instructions, doctor info, notes).
- **Access:** Protected (`Bearer <token>`)

### `DELETE /api/medicines/:id`
Archive medication and pause pending reminder jobs.
- **Access:** Protected (`Bearer <token>`)

---

## 3. Schedules & Recurrence (`/api/schedules`)

### `GET /api/schedules/:medicineId`
Retrieve current active schedule and historical versions for a medication.
- **Access:** Protected (`Bearer <token>`)

### `PUT /api/schedules/:id`
Safely update an active schedule.
- **Access:** Protected (`Bearer <token>`)
- **Behavior:** Archives current version to `ScheduleVersions`, supersedes un-actioned future occurrences, and recalculates future doses. Past taken/skipped doses remain untouched.

### `POST /api/schedules/:id/pause`
Pause active schedule. Prevents reminder dispatches until resumed.

### `POST /api/schedules/:id/resume`
Resume paused schedule and regenerate future reminder slots.

---

## 4. Daily Doses & Action History (`/api/doses`)

### `GET /api/doses/today`
Retrieve all scheduled doses for the current day organized by time slots (`morning`, `afternoon`, `evening`, `night`).
- **Access:** Protected (`Bearer <token>`)

### `GET /api/doses/calendar?month=2026-10`
Retrieve monthly adherence matrix and daily occurrence counts for calendar view.
- **Access:** Protected (`Bearer <token>`)

### `POST /api/doses/:occurrenceId/take`
Mark a scheduled dose occurrence as Taken.
- **Access:** Protected (`Bearer <token>`)
- **Behavior:** Idempotent. Decrements medication stock units and records timestamp.

### `POST /api/doses/:occurrenceId/skip`
Mark a scheduled dose occurrence as Skipped.
- **Access:** Protected (`Bearer <token>`)
- **Request Body:**
  ```json
  {
    "reason": "Doctor instructed pause due to lab tests"
  }
  ```

### `POST /api/doses/:occurrenceId/snooze`
Snooze dose notification for 15, 30, or 60 minutes.
- **Access:** Protected (`Bearer <token>`)
- **Request Body:**
  ```json
  {
    "snoozeMinutes": 15
  }
  ```

### `POST /api/doses/:occurrenceId/correct`
Perform an audited correction on a previously logged dose action.
- **Access:** Protected (`Bearer <token>`)
- **Request Body:**
  ```json
  {
    "targetState": "skipped",
    "reason": "Marked taken by mistake; medication was not available"
  }
  ```

---

## 5. Inventory & Refill Management (`/api/inventory`)

### `GET /api/inventory`
Retrieve stock levels, days of medication remaining, and low-stock alerts.
- **Access:** Protected (`Bearer <token>`)

### `POST /api/inventory/:medicineId/refill`
Log a refill transaction and increase available stock units.
- **Access:** Protected (`Bearer <token>`)
- **Request Body:**
  ```json
  {
    "quantityAdded": 30,
    "cost": 150.00,
    "pharmacy": "Apollo Pharmacy, Hyderabad",
    "notes": "Strip of 30 tablets"
  }
  ```

### `GET /api/inventory/history`
List audit log of all refill transactions.
- **Access:** Protected (`Bearer <token>`)

---

## 6. Push Notifications (`/api/notifications`)

### `GET /api/notifications/vapid-key`
Retrieve server public VAPID key for browser `PushManager.subscribe()`.
- **Access:** Protected (`Bearer <token>`)

### `POST /api/notifications/subscribe`
Register or refresh browser Web Push subscription.
- **Access:** Protected (`Bearer <token>`)
- **Request Body:** Standard W3C PushSubscription object + device identifier.

### `DELETE /api/notifications/unsubscribe`
Unregister push subscription for current device.

### `POST /api/notifications/test-push`
Dispatch an immediate test push notification to verify device receipt.

---

## 7. Caregiver Sharing (`/api/caregivers`)

### `POST /api/caregivers/invite`
Invite a family member or caregiver via email.
- **Access:** Protected (`Bearer <token>`)

### `POST /api/caregivers/accept`
Accept invitation token and establish caregiver link.
- **Access:** Public or Authenticated

### `GET /api/caregivers`
List authorized caregivers and granted permissions.

### `DELETE /api/caregivers/:permissionId`
Immediately revoke caregiver access.

---

## 8. Analytics & Adherence (`/api/analytics`)

### `GET /api/analytics/summary`
Retrieve adherence percentage (7-day, 30-day, all-time) and streak statistics.

### `GET /api/analytics/trends`
Retrieve day-by-day adherence timeline for Recharts visual trends.

---

## 9. Admin Operations (`/api/admin`)

### `GET /api/admin/metrics`
Retrieve system-wide user counts, active schedules, reminder delivery rate, and database statistics.
- **Access:** Admin Role Only

### `POST /api/admin/trigger-worker`
Manually trigger an on-demand cycle of the background Reminder Worker.
- **Access:** Admin Role Only

### `GET /api/admin/audit-logs`
Inspect system audit logs and critical operational events.
- **Access:** Admin Role Only
