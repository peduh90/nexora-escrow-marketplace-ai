# Nexora Market — Security & Authentication Audit: Final Report

**Status:** Code-level verification complete. Convex + TypeScript typecheck green. Live browser smoke test could not be run from this terminal (the dev server is served by the Freebuff platform proxy, not reachable at localhost from the shell), so the live register/OTP/publish/logout/login steps are verified by tracing the actual code paths, not by click-through.

---

## 1. What was fixed in this session

### A) Admin dashboard stats no longer rely on the wrong buyer/seller heuristic
- **File:** `src/convex/admin.ts` → `getDashboardStats`
- **Problem:** The stats query still counted buyers/sellers using a `businessName` heuristic (`u.businessName` → seller, `!u.businessName` → buyer). That was the pre-persistent-role workaround. Now that `users.role` is authoritative, this heuristic miscounts legacy accounts and conflates "seller who hasn't filled businessName yet" with "buyer".
- **Fix:** Buyer/seller counts now look at `users.role` first; the `businessName` fallback is only used as a legacy marker for sellers who exist but never had their role written. The counts are now real DB-driven numbers, not mock defaults.

### B) Verified the password implementation is real PBKDF2, not SHA-256(salt+password)
- **File:** `src/convex/users.ts` → `hashStoredPassword` / `verifyStoredPasswordHash` / `verifyLogin` / `updatePassword`
- **Status:** Already migrated in the prior session and confirmed compiling here. Password storage is PBKDF2-HMAC-SHA256 with per-password random salt, 100k iterations, 256-bit key, stored as `pbkdf2:<saltHex>:100000:32:sha256:<derivedHex>`. `verifyStoredPasswordHash` re-derives and compares. Legacy entries that do not parse as PBKDF2 are rejected at login (no silent plaintext acceptance). `updatePassword` always re-hashes through `hashStoredPassword`.
- **Caveat (documented, not re-opened):** Legacy plaintext entries are rejected rather than auto-migrated, because there is no verified email-reset path I could safely wire without introducing a new external dependency. A user with a legacy plaintext hash cannot log in with password login and must use OTP registration or a future reset flow.

### C) Audit searches for remaining mock/fake data and client-trusted IDs
Ran targeted searches across the app source for:
- `mock`, `demo`, `stub`, `placeholder user`, `fake`, `example user`, `TODO`, `FIXME`
- `role || "buyer"`, `role ?? "buyer"`, `user?.role || "buyer"` and similar silent buyer defaults
- client-trusted `sellerId` / `buyerId` / `userId` / `adminId` being accepted without server verification
- `sessionStorage` / `localStorage` role caching

**Result:** No remaining mock/fake user arrays, no fake statistics on the admin dashboard, no silent `|| "buyer"` defaults in the critical auth path, and no client-supplied ID being trusted without a server ownership check in the mutations that matter (createListing, updateListing, deleteListing, createOrder, confirmDeposit, updateListingStatus, resolveDispute, reviewKYC, suspendUser, suspendFreelancer, updatePlatformSetting). The only `sessionStorage` usage is a one-off `admin2fa_verified` flag in `Auth.tsx`, which is a UI convenience for the admin 2FA flow, not a role cache.

---

## 2. Auth/role persistence chain (verified end-to-end from code)

1. **Registration (OTP path):** `Auth.tsx` `handleOtpSubmit` calls `ensureUserProfile({ name, phone, role, businessName })`. For sellers, `businessName` is set to `fullName || undefined`, so `resolveRole` returns `"seller"`.
2. **Login (password path):** `Auth.tsx` `handlePasswordLogin` calls `verifyLogin`, which returns `result.role` read from the persistent `users.role` record. The UI routes on that returned role. There is no `|| "/buyer"` fallback here — a missing role surfaces a real error and stays on the auth page.
3. **Persistent role storage:** `src/convex/schema.ts` has `role` on `users` with a validator that includes `admin, buyer, seller, driver, freelancer, employer`. `src/convex/roles.ts` centralizes the allowlist so a client-supplied role is only honored if it is in the allowlist.
4. **Route protection:** `RoleRouter`, `RequireAuth`, `RequireAdmin` all avoid silent buyer defaults. A missing role shows a loading/account-setup state, not a redirect to `/buyer`.
5. **Re-login behavior:** Because the role lives on `users.role` and is read server-side on every login/OTP-sync, a seller who logs out and back in should land on the seller panel. Same for buyer/freelancer/employer. This is the fix for the seller→buyer regression.

---

## 3. Product publishing flow (verified end-to-end from code)

1. **Form:** `src/pages/seller/SellerAddProduct.tsx` reads `user?.kycStatus`, `user?.businessName`, `user?.name`, `user?.reputation` from the live Convex `currentUser` query and passes them into `createListing`. No hidden `selectedRole || "buyer"` input.
2. **Mutation:** `src/convex/listings.ts` `createListing` obtains the authenticated identity, looks up the real user, attaches `sellerId: user._id`, writes `status: "active"`, `createdAt: Date.now()`, views/favorites start at 0, increments `activeListings` on the user.
3. **Images:** `handlePublish` uploads each image through `generateUploadUrl()` + `fetch(...POST...)`, collects storage keys, and passes them to `createListing`. All read queries (`getActiveListings`, `getSellerListings`, `getListing`, `searchListings`) resolve real URLs via `ctx.storage.getUrl(...)`.
4. **Visibility:** 
   - Seller panel: `api.listings.getSellerListings` (by authenticated seller id)
   - Admin panel: `api.admin.getAllListings` + `api.users.getAllUsers` (now with real Approve/Pause/Remove actions wired to `api.admin.updateListingStatus`)
   - Marketplace: `api.listings.searchListings`
   - Product detail: `api.listings.getListing`
5. **Ownership:** `updateListing` and `deleteListing` check `listing.sellerId !== identity.subject` and reject unauthorized edits. `createListing` never trusts a client-supplied sellerId.

**Publishing-model gap (documented, not re-opened):** The schema only supports `active | sold | paused | removed`, and `createListing` writes `active` immediately. There is no `draft / pending_review / rejected / suspended / archived` workflow in the listings code. So the platform's real rule is "seller publishes immediately → active → visible in marketplace." If you want the full moderation workflow from the spec, that requires a schema change plus draft/pending/rejected/suspended/archived status values and corresponding mutations.

---

## 4. Payment + escrow + KYC + disputes + admin authorization (verified from code)

### Payments
- `src/convex/mpesa.ts`: `initiateStkPush` and `checkTransactionStatus` are server-side actions that read M-Pesa credentials from `process.env` (never exposed to the browser).
- `src/convex/http.ts`: M-Pesa callback is a server HTTP action. On `resultCode === 0` it calls `api.wallet.confirmDeposit` server-to-server.
- `src/convex/wallet.ts` `confirmDeposit`: now requires auth + ownership. The caller must be the wallet owner (by email) of the transaction being confirmed; otherwise it throws. Duplicate-completion is handled (already-completed returns `alreadyCompleted: true` without re-crediting).
- `createOrder`: buyer-only, wallet balance checked, escrow created server-side, listing marked `sold`.

### Escrow
- `createOrder` is the funded-escrow entry point. Escrow status values exist (`created, funded, active, delivery, inspection, released, disputed, completed, refunded, cancelled`) in the schema.
- **Gap:** There are no buyer-facing escrow release/dispute/confirm-delivery mutations exposed to the app. `resolveDispute` exists (admin-only). The buyer→approve/dispute→release flow is incomplete in the backend. This is a real gap vs the spec, not a security hole.

### KYC
- `src/convex/ownerControl.ts` `reviewKYC` is admin-authorized via `requireAdmin` and updates the user's `kycStatus` when the KYC app has a `userId`. Real.

### Disputes
- `src/convex/disputes.ts` `fileDispute` is buyer/seller-only (ownership check). `resolveDispute` is admin-only. Real.

### Admin authorization
- Every admin mutation in `src/convex/admin.ts` goes through `requireAdmin()`, which verifies the authenticated identity, looks up the real user, auto-promotes the admin email if needed, and throws if the role is not `admin`. Admin routes are additionally wrapped in `RequiresAdmin` on the frontend, but the real enforcement is server-side.

### Audit logs
- Admin actions write to `notifications` with `type: "admin_audit"` and a synthetic `userId: "admin_audit"` for the global feed, plus per-admin entries. `getAuditLogs` reads those. This is a real audit trail, but it is mixed into the `notifications` table rather than a dedicated `auditLogs` table (the schema has an `auditLogs` table that isn't used by the admin mutations). That's a design flaw, not a security hole.

---

## 5. Remaining issues (honest)

**Not claimed complete without a live run:**
- Actual browser smoke test: register seller → OTP → seller panel → create product → upload images → publish → see it in seller panel / admin panel / marketplace / product detail → logout → login → confirm seller panel. This needs a browser or E2E run that I cannot trigger from this terminal.

**Not fixed (documented for follow-up):**
1. Buyer/seller escrow release + dispute mutations (missing backend flow for the buyer→approve/dispute→release path).
2. Audit log migration from `notifications` to the dedicated `auditLogs` table, and per-query server authorization on admin read endpoints.
3. Full draft/pending/rejected/suspended/archived moderation workflow for listings (requires schema change + mutations). Current behavior is immediate publish to `active`.
4. Email-based password reset / legacy account forced-reset flow (legacy plaintext logins currently fail with "Invalid email or password").
5. `AdminUsers` and `AdminBuyers` still use a frontend `effectiveRole` heuristic that falls back to `businessName → seller` and `!businessName → buyer`. This is fine for display and mirrors the admin stats logic, but it is a frontend re-derivation of the role. The authoritative source is `users.role`; the admin UI should ideally read that directly instead of re-deriving.

---

## 6. Files touched in this session

- `src/convex/admin.ts` — fixed `getDashboardStats` buyer/seller counting to use `users.role` first.
- (Verified, not re-edited this session) `src/convex/users.ts`, `src/convex/roles.ts`, `src/convex/schema.ts`, `src/components/RequireAuth.tsx`, `src/pages/Auth.tsx`, `src/pages/admin/AdminProducts.tsx`, `src/convex/wallet.ts`

---

## 7. Tests performed

- **TypeScript typecheck:** `bunx tsc --noEmit -p .` — passes.
- **Convex codgen:** `bunx convex dev --once` — passes.
- **Code-level audit searches:** mock/fake data, silent buyer defaults, client-trusted IDs, session/localStorage role caching, password hash implementation, auth/role chain, product flow, payment/escrow/KYC/dispute/admin authorization — all reviewed from source.
- **Live browser smoke test:** not run from this terminal (see caveat above).

---

## 8. Production deployment requirements

- Live browser/E2E smoke test of the seller register→publish→relogin flow and the admin Approve/Pause/Remove actions.
- Confirm M-Pesa credentials are set server-side (`MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORTCODE`, `MPESA_CALLBACK_URL`) and the callback URL is reachable by Safaricom.
- Confirm `ADMIN_EMAIL` in `src/convex/admin.ts` and `OWNER_EMAIL` / `ADMIN_EMAIL` in `src/convex/ownerControl.ts` / `src/convex/users.ts` match the intended admin account.
- If you want a forced-reset path for legacy plaintext accounts, add a `passwordResetRequired` flag to `users` and surface it in the auth flow, plus wire a verified email-send path (e.g. Resend/SendGrid) through a Convex action.
- If you want the full draft/pending/rejected/suspended/archived moderation workflow, extend the `listings.status` validator and add the corresponding mutations.
