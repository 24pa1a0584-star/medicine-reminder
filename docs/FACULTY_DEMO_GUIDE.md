# DOSEBLOOM — Faculty Evaluation & Viva Demonstration Guide

> **Project Title:** DOSEBLOOM — Smart Medicine Reminder & Daily Dose Tracking System  
> **Course:** Full-Stack Web Development (FSD) Capstone Project  
> **Architecture:** Modern MERN (MongoDB Atlas, Express.js, React 18, Node.js v24) with End-to-End TypeScript  

---

## 1. Project Information & Presentation Roles

| Role | Details |
|---|---|
| **Student / Presenter Name** | `[DEVELOPER_NAME]` |
| **Roll / Register Number** | `[ROLL_NUMBER]` |
| **Department / Degree** | `[DEGREE_AND_BRANCH]` |
| **Institution** | `[COLLEGE_OR_UNIVERSITY_NAME]` |
| **Faculty Mentor** | `[FACULTY_MENTOR_NAME]` |
| **Academic Term** | 2026 Academic Session |

---

## 2. 5-Minute Live Viva Walkthrough Script

### **Minute 0:00 - 1:00 | Project Context, Problem Statement & Aesthetic Demo**
1. **Open Landing Page:** Navigate to `http://localhost:5000/`.
2. **Talking Points:**
   - *"Medication non-adherence accounts for over 50% of treatment failures in chronic condition management. Patients struggle with irregular schedules, complex regimens, and running out of stock unexpectedly."*
   - *"DOSEBLOOM solves this with a colorful, animated, highly intuitive healthcare dashboard featuring Space Grotesk and Plus Jakarta Sans typography, glassmorphism UI, and dark mode support."*
   - *"Critical healthcare boundary: DOSEBLOOM is strictly a reminder and self-reporting companion. It never prescribes medications, alters dosages, or replaces professional medical guidance."*

### **Minute 1:00 - 2:00 | Seamless Login & Dashboard Experience**
1. Click **"Sign In"** or go to `http://localhost:5000/login`.
2. Click the quick demo button: **"Priya Sharma (Patient)"** (or enter `priya@dosebloom.app` / `DemoPass123!`).
3. Point out the interactive elements:
   - **Daily Progress Bloom Ring:** Animated Framer Motion circular progress indicator displaying percentage completed today.
   - **Chronological Time Slots:** Morning, Afternoon, Evening, and Night dose groupings.
   - **Adherence Streak:** Live calculated streak counter encouraging consistent habits.

### **Minute 2:00 - 3:00 | Dose Action Idempotency & Automatic Inventory Coupling**
1. Locate an upcoming or pending dose card (e.g., *Calcirol D3* or *Metformin*).
2. Click **"Mark Taken"**:
   - Notice the confetti burst animation!
   - Status updates instantly to "Taken" with a verified timestamp.
   - Click it again to demonstrate **idempotency** — no duplicate requests or erroneous double deductions occur.
3. Navigate to **"Refills"** (`/refills`):
   - Show how the current stock of the medication automatically decremented by the dose quantity.
   - Click **"Log Refill"**, add 30 units with cost (₹120) and pharmacy ("Apollo Pharmacy").
   - Watch the inventory gauge replenish in real time.

### **Minute 3:00 - 3:45 | Safe Schedule Versioning & Calendar Adherence**
1. Navigate to **"Calendar"** (`/calendar`):
   - Monthly adherence grid with interactive date selection.
   - Demonstrates past dose history table with filter options.
2. Navigate to **"Medicines"** (`/medicines`) -> Select a medicine -> **"Edit Schedule"**:
   - Explain the system architecture: *"When a patient updates a schedule time from 08:00 to 09:00, our recurrence engine preserves past taken/skipped doses in `ScheduleVersions` while recalculating future occurrences."*

### **Minute 3:45 - 4:30 | Caregiver Sharing & Web Push Notifications**
1. Navigate to **"Caregivers"** (`/caregivers`):
   - Demonstrate the cryptographically tokenized invitation system with granular permissions (`view_history`, `receive_alerts`).
2. Navigate to **"Notifications"** (`/notifications`):
   - Display registered PWA push subscriptions (Windows Desktop, Android Mobile).
   - Click **"Send Test Push"** to illustrate the W3C Web Push VAPID delivery mechanism.
   - Highlight **Lock-Screen Privacy**: Medication names are redacted on public lock-screens.

### **Minute 4:30 - 5:00 | Admin Panel & DPDP Act Compliance**
1. Log in as **Admin** (`admin@dosebloom.app` / `AdminPass123!`) and navigate to `/admin`.
   - Real-time system health metrics, MongoDB connection status, and background worker monitor.
   - Manually trigger on-demand Reminder Worker cycle.
2. In **Settings** (`/settings`):
   - Demonstrate **Data Portability (DPDP Act Section 12)**: Click **"Export Health Data"** to download complete JSON records.
   - Review **Account Erasure**: Explains the single-click cryptographic purge of user data.

---

## 3. Potential Viva Questions & Model Answers

### **Q1: Why did you implement an atomic lease in the background worker instead of a standard `setInterval`?**
> **Answer:**  
> *"In production environments like Render or AWS ECS, multiple server instances or worker processes run concurrently. A naive `setInterval` would cause race conditions where multiple workers query the same pending reminders and dispatch duplicate push notifications to the patient. By using MongoDB's atomic `findOneAndUpdate` with a lease expiration (`leaseExpiresAt`), only one worker can claim a job at any millisecond, providing guaranteed idempotency and fault tolerance even if a worker crashes mid-delivery."*

---

### **Q2: Why use Luxon instead of JavaScript native `Date` for recurrence?**
> **Answer:**  
> *"JavaScript native `Date` relies on the host machine's system clock and local timezone, which causes severe errors during Daylight Saving Time transitions, UTC cross-midnight shifts, and regional deployments. Luxon allows us to parse, compute, and format occurrences strictly within the patient's explicit timezone (e.g. `Asia/Kolkata`), while storing a canonical UTC ISO string for unambiguous indexing and querying."*

---

### **Q3: What happens to dose history when a patient modifies their prescription schedule?**
> **Answer:**  
> *"In clinical applications, modifying a future schedule must never alter or invalidate historical records. DOSEBLOOM implements Safe Schedule Versioning: when an update occurs, the active schedule is version-incremented and archived into `ScheduleVersions`. Existing `taken` and `skipped` occurrences remain permanently frozen, while only future un-actioned occurrences are superseded and regenerated."*

---

### **Q4: How does the application safeguard patient data privacy under the Indian DPDP Act 2023?**
> **Answer:**  
> *"DOSEBLOOM adheres strictly to the Digital Personal Data Protection Act:  
> 1. Purpose limitation and consent-driven caregiver sharing via tokenized opt-in.  
> 2. Lock-screen notification privacy masking sensitive medication names.  
> 3. Section 12 Right to Data Portability via a one-click full JSON export.  
> 4. Section 13 Right to Erasure via permanent cascading deletion of patient accounts and medical records."*

---

### **Q5: How does DOSEBLOOM work offline on mobile devices as a PWA?**
> **Answer:**  
> *"DOSEBLOOM ships with a dedicated Service Worker (`sw.js`) and a web app manifest (`manifest.webmanifest`). Static assets are pre-cached, and when network connectivity drops, the custom `OfflineBanner` informs the user while cached UI components continue to render seamlessly. Push notifications are received even when the browser tab is closed."*
