# Nexora Market — Read-Only Data Audit (Both Deployments)

**Date:** 2026-09-10
**Method:** 100% read-only. Dev (`usable-fish-616`) inspected with `bun convex data` (read-only export). Prod (`hallowed-firefly-322`) inspected exclusively via its public `/api/query` endpoints (queries can never write) using existing public functions. **No data was created, modified, deleted, migrated, or merged. No env vars, URLs, or deployments were changed.**

---

## 1. The two deployments

| | **PROD (source of truth)** | **DEV (scratch)** |
|---|---|---|
| Convex deployment | `hallowed-firefly-322` | `usable-fish-616` |
| Frontend using it | `nexoramarketplace.freebuff.app` (published site) | `quiet-bobcats-arrive.freebuff.dev` (dev preview) |
| CLI binding | NOT bound (deploy key is dev-scoped — prod audit done via public API) | Current `CONVEX_DEPLOY_KEY` target |

---

## 2. Prod-only data (exists ONLY in `hallowed-firefly-322`)

**Users (11 people with no dev account), including:**

| Identity | Role | Evidence |
|---|---|---|
| **"Furniture"** (businessName + name) | seller | user `m9789qdpm9pd97ejjjq22amqax8e00vy`, created **2026-09-08 19:07 UTC**; phone `0706116043` |
| **"Startech"** | seller | user `m97789n8gbwctqp8b5wezfm99n8dg6yw`, created **2026-08-31 21:39 UTC**; phone `0713391371` |
| ~9 more users | mixed | prod total 16 users vs 6 on dev; 5 emails overlap (see §4), so 11 are prod-only |

**Products/listings (2):**

| Listing | Seller | Price | Created | Images |
|---|---|---|---|---|
| "Mahogany" bed (home-living/bedroom, Chuka, Eastern) | **Furniture** | KES 15,000 | **2026-09-10 15:18 UTC (today)** | 2 files, verified live (HTTP 200) |
| "HP" laptop (computers-laptops) | **Startech** | KES 45,000 | 2026-09-06 12:18 UTC | 1+ file, verified live (HTTP 200); 298,605 views |

**Financial records:**
- **2 PENDING `walletTransactions`** on prod. These are consistent with M-Pesa deposit attempts (`NX-DEP-*` refs are created as "pending" in `wallet.depositFunds`). ⚠️ See §7 for the M-Pesa risk.
- No completed payments, no escrows on either deployment (see §5) — **no payment has ever completed anywhere**.

**Storage:** all prod image files referenced by the 2 listings are live (HTTP 200). Full `_storage` listing on prod requires auth and was not readable — nothing indicates missing files (no broken image references found).

---

## 3. Dev-only data (exists ONLY in `usable-fish-616`)

| Record | Detail |
|---|---|
| User `anoldmurimikinyua@gmail.com` | pending buyer (no role, `pendingRole: buyer`), created 2026-09-07 — does **not** exist on prod by email |
| Listing "Dell Latitude 5400 Core i5 Laptop" | seller `zeliosoftware.com` (karubiunaomi), KES 35,000, created 2026-09-08, 2 views |
| 21 storage files | image/avif thumbnails etc. belonging to the Dell listing (dev's own file store) |
| 2 listingViews | view records for dev listings |
| 18 auth sessions, 304 refresh tokens, 6 authAccounts, 7 authVerifiers, 1 verification code | dev auth traffic |

**Empty on dev (0 docs):** escrows, walletTransactions, disputes, KYC, messages, conversations, reviews, notifications, deliveries, jobPosts, jobApplications, productCategories, platformSettings, auditLogs, AI tables (all), freelance tables (all), supportTickets.

---

## 4. Data in BOTH deployments (separate records, same humans)

The same people registered on both sites. Verified by `checkDuplicateUser` (read-only):

| Email (dev record) | Exists on prod? | Shared phone also on prod? |
|---|---|---|
| murimiedwin227@gmail.com (owner/admin) | ✅ yes | ✅ 0703680415 |
| karubiunaomi@gmail.com (zeliosoftware.com, seller) | ✅ yes | ✅ 0118074191 |
| murimieduh6@gmail.com (Ells, buyer) | ✅ yes | ✅ 0706116043 |
| brunogrumps@gmail.com (bruno, freelancer) | ✅ yes | ✅ 0118074191 |
| tutorassignment6@gmail.com (Caro, freelancer) | ✅ yes | ✅ 0706116043 |
| anoldmurimikinyua@gmail.com (pending buyer) | ❌ no | — |

Notes:
- **"Furniture" on prod shares phone `0706116043` with dev's "Caro"/"Ells" records** — same person registered on prod under a different (seller) account. Different account, same human.
- **Prod currently has 0 users with `role: admin`.** This is expected and self-healing: the moment the owner opens `/admin` on the **published** site, `ensureAdminAccess` promotes the owner's prod record server-side. No manual data fix is needed (and per instructions, none was made).

---

## 5. Critical financial tables — both deployments

| Table | Dev | Prod |
|---|---|---|
| escrows (orders) | **0** | **0** |
| walletTransactions | **0** | **2, both `pending`** |
| completed payments | 0 | 0 |
| disputes | 0 | 0 |
| withdrawals | 0 | 0 |
| KYC applications | 0 | 0 pending (dashboard aggregate) |

**Conclusion: no real money has moved on either deployment.** There are no completed M-Pesa payments, no funded escrows, no withdrawals on either side. The only financial records anywhere are 2 pending (likely incomplete/abandoned) M-Pesa deposit attempts on prod. There is **nothing to lose and nothing to duplicate** financially.

---

## 6. Were any records deleted? — NO

- Every "missing" record was found intact in the other deployment (the Furniture seller + Mahogany bed on prod; the Dell listing on dev).
- No delete trails exist anywhere: `auditLogs` is empty on dev, and prod's dashboard reports no audit/AI activity. Deletion is admin-gated and would log.
- Overlap analysis (§4) shows registration duplicates, not moves — the same users re-registered on the other site, which is normal for dev/prod splits.
- **Nothing was genuinely deleted.** All observed "loss" is deployment split, 100% explained.

---

## 7. ⚠️ M-Pesa / payment risk to verify LATER (no action taken)

`MPESA_CALLBACK_URL` on the **dev** deployment is `https://usable-fish-616.convex.site/mpesa/callback` — i.e. pointing at **dev**. Prod's env vars could not be read with current read-only credentials. If prod's `MPESA_CALLBACK_URL` is not set to `https://hallowed-firefly-322.convex.site/mpesa/callback`, Safaricom callbacks for prod STK pushes land on the wrong deployment and prod deposits would stay `pending` forever — which matches the 2 stuck pending transactions on prod. **This must be verified and fixed (env change only) before enabling real payments.** Flagged only; nothing changed.

---

## 8. Freshness — which deployment is newer?

- Prod latest activity: Furniture listing created **2026-09-10 15:18 UTC** (today) — prod is in active live use by real sellers.
- Dev latest activity: latest auth session **2026-09-10 08:27 UTC** (today, karubiunaomi) — also in use, but only by the dev test cohort.
- Prod holds the business-critical data (real public marketplace); dev holds test data.

---

## 9. Recommendation — source of truth

**`hallowed-firefly-322` (prod) is and must remain the source of truth.** It has 16 users incl. both real sellers, the live public listings, and the published frontend already points at it.

- Dev (`usable-fish-616`) is disposable scratch data (test registrations, 1 test listing, 21 test images). It never needs migrating.
- The 5 duplicated users need **no merge**: their prod registrations are their real accounts; dev copies are duplicates.
- The only prod-only financial records are 2 pending deposit attempts — verify M-Pesa callback routing (§7) before enabling payments; decide whether to leave or let them expire.
- When the owner next opens `/admin` on the published site, their prod record self-promotes to admin (by design). Do not hand-edit roles.

**No migration, merge, deletion, or re-pointing is necessary for data integrity. The split explains everything.**
