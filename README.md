# DoseCheck 🛡️
### Pre-Dispensing Quality Gate for Prescriptions

> **"Code for certainty. Gemma 4 for context. A human for accountability."**

DoseCheck is a safety-critical decision-support prototype designed for pharmacy dispensing workflows. It sits between electronic prescribing and the physical dispensing of medications to intercept catastrophic errors before they reach patients.

---

## 🏛️ Core Principles & The Three Roles

| Role | Provider | Responsibility | Guarantees |
| :--- | :--- | :--- | :--- |
| **Certainty** | **Deterministic Code** (TypeScript) | Verifies mathematical doses, per-kg maximums, single/daily caps, weekly-only schedules, concentration plausibility, and risky decimal notation (`5.0` or `.5`). | 100% deterministic, zero hallucinations, fast, pure functions. |
| **Context** | **Gemma 4** (via Gemini API) | Analyzes free-text clinical notes, uncovers contradictions between text instructions and structured fields, checks stated allergies, and provides bilingual clinical explanations in English & Urdu. | Grounded by an evidence guard (only verbatim quotes accepted); never decides pass/fail; never invents numerical limits. |
| **Accountability** | **Pharmacist / Reviewer** (Human) | Inspects findings, decides whether to accept, escalate, or correct the prescription with mandatory clinical rationales. | Every action is signed into an immutable audit trail; the release gate is cryptographically locked until all findings are resolved. |

---

## 📐 Architecture

```
                    +------------------------------------+
                    |       Browser (Next.js 15 UI)      |
                    |  - Queue (/), Entry (/new)         |
                    |  - Review (/review/[id])           |
                    |  - Audit Trail (/audit)            |
                    +-----------------+------------------+
                                      |
                                      | HTTPS (Zero client-side secrets)
                                      v
                    +------------------------------------+
                    |        Next.js API Layer           |
                    |  - Zod Input & Payload Validation  |
                    |  - Sliding-Window Rate Limiting    |
                    +---------+----------------+---------+
                              |                |
             +----------------+                +---------------+
             v                                                 v
  +----------------------+                          +----------------------+
  |    lib/checks.ts     |                          |     lib/gemma.ts     |
  | Deterministic Math   |                          | Gemma 4 LLM Review   |
  | - Dose calculations  |                          | - Note vs field check|
  | - Pediatric rules    |                          | - Bilingual (EN/UR)  |
  | - Decimal formatting |                          | - Verbatim evidence  |
  +----------+-----------+                          +----------+-----------+
             |                                                 |
             +----------------+               +----------------+
                              |               |
                              v               v
                    +------------------------------------+
                    |           lib/merge.ts             |
                    |  Deduplicate, prioritize & sort    |
                    +-----------------+------------------+
                                      |
                                      v
                    +------------------------------------+
                    |           lib/store.ts             |
                    |  Supabase Postgres Store           |
                    |  (RLS Enabled, Security-Definer    |
                    |   Functions & Append-Only Audit)   |
                    +------------------------------------+
```

---

## ✦ How Gemma 4 is Visibly Used

DoseCheck uses Google's **Gemma 4** model through the official `@google/genai` SDK:
1. **Contextual Contradiction Detection**: Catches discrepancies that numbers cannot catch (e.g., structured field says "daily", but prescriber note states *"to be taken once weekly on Sundays"*).
2. **Allergy & Condition Conflicts**: Identifies contraindications documented in clinical notes (e.g., penicillin cross-sensitivity with amoxicillin).
3. **Verbatim Evidence Guard**: Every finding from Gemma must quote directly from the note or patient context. Any finding with a non-verbatim quote is automatically stripped before reaching the pharmacist, preventing AI hallucinations.
4. **Bilingual Explanations (Urdu + English)**: Generates localized Urdu explanations rendered in Nastaliq font alongside English text for diverse healthcare environments.
5. **Transparency & Inspection Panel**: The UI includes an expandable **Gemma 4 Audit Panel** showing the exact sanitized payload sent (zero PII), latency in milliseconds, model name, and evidence guard metrics.

---

## ⚙️ Environment Variables

Create `.env.local` based on `.env.example`:

```bash
# Gemini API Key (Server-side only — never exposed to client)
GEMINI_API_KEY=your_gemini_api_key_here

# Gemma 4 Model Identifier (e.g. gemma-4-it, gemini-1.5-flash or custom instruction-tuned ID)
GEMMA_MODEL=gemma-4-it

# Supabase Postgres Configuration (Service Role Key bypasses RLS on server only)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Rate Limiting
RATE_LIMIT_PER_MIN=20

# Admin Key to protect demo reset endpoint (/api/demo/reset)
DEMO_ADMIN_KEY=your_secure_admin_key_here
```

> **Security Guarantee:** Secrets never leak into client bundles. `import "server-only"` protects all Supabase and Gemma integration modules.

---

## 🚀 Setup & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database (Supabase)
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the entire contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
4. Go to **Project Settings** → **API** and copy:
   - Project URL (`SUPABASE_URL`)
   - `service_role` secret key (`SUPABASE_SERVICE_ROLE_KEY`)
5. Paste them into `.env.local`.

### 3. Run Automated Tests
```bash
# Run unit & release gate test suite (87 tests)
npm test

# Check TypeScript types
npm run typecheck
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 90-Second Demo Script

1. **Load Demo Cases**: On the home page (`/`), click **"Load Synthetic Demo Cases"** to populate the 8 clinical test cases.
2. **Demo Case 2 (10x Pediatric Overdose - Code Catches)**:
   - Open the 6-year-old child prescribed 1500 mg paracetamol.
   - Code immediately flags `PER_KG_EXCEEDED` and `DAILY_DOSE_EXCEEDED` with exact arithmetic in the evidence.
3. **Demo Case 5 (Subtle Schedule Mismatch - Gemma Catches)**:
   - Open the Methotrexate prescription. Structured fields indicate "daily".
   - Deterministic checks find no calculation error, but **Gemma 4** flags `NOTE_ENTRY_MISMATCH`, highlighting verbatim *"to be taken once weekly on Sundays"* in the note, with an Urdu translation.
4. **Inspect Gemma 4 Context Panel**:
   - Expand the **"Gemma 4 Audit & Context Inspector"** to view latency, model ID, and the zero-PII sanitized payload.
5. **Resolve & Enforce Release Gate**:
   - The **"Sign & Release"** button is strictly disabled with a tooltip indicating open findings.
   - Click **"Correct Prescription"**, adjust the frequency, and save.
   - Click **"Accept"** with a rationale (≥ 5 characters).
   - Once all findings are resolved, sign and release.
6. **Verify Immutable Audit Trail**:
   - Navigate to `/audit` to inspect the permanent log record with timestamp, reviewer name, action, and clinical rationales.

---

## ⚠️ Data Accuracy & Medical Disclaimer

- **Prototype Only:** DoseCheck is a hackathon decision-support demonstration and **NOT** a certified medical device (SaMD).
- **Synthetic Data Only:** Real patient identifiable data (PII/PHI) must never be entered.
- **Drug Formulary Verification:** All dosage boundaries in [`data/drugs.json`](data/drugs.json) are starter figures (`"verified": false`) and must be validated against official national formularies (BNF, WHO) before clinical consideration.

---

## 🔒 Limitations

1. **In-Memory Rate Limiting:** The sliding-window rate limiter in `/api/check` is in-memory and best-effort on serverless platforms. In multi-region deployments, use Redis (e.g. Upstash).
2. **Graceful Fallback:** If Gemma 4 encounters an API timeout or quota limit, DoseCheck marks the AI status as `unavailable` and gracefully falls back to deterministic code rules without interrupting the dispensing queue.
3. **Authentication:** The MVP relies on reviewer name tagging. Enterprise deployment requires SSO/Supabase Auth (see stretch goals).

---

---

## 👥 Authors & Contributors

- **Muhammad Bilal**
- **Zulnorain Sayed Kayani**

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

- **DoseCheck Application & Deterministic Engine**: MIT License © 2025 Muhammad Bilal and Zulnorain Sayed Kayani.
- **Gemma 4 Models**: Subject to the [Google Gemma Terms of Use](https://ai.google.dev/gemma/terms) and Apache 2.0.

