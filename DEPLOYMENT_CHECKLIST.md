# Deployment Checklist

Use this checklist to track the security hardening deployment progress.

---

## Phase 1: Pre-Deployment Verification ✅ COMPLETE

- [x] Security audit completed (see SECURITY_REPORT.md)
- [x] All 8 API vulnerabilities identified
- [x] API patches implemented (join-waitlist.ts, export-waitlist.ts)
- [x] Code reviewed for TypeScript compilation
- [x] npm audit run (baseline: 12 vulnerabilities, 0 critical)
- [x] Vite bumped from ^5.4.1 to ^5.4.15
- [x] .env.example created with all required env vars
- [x] .github/dependabot.yml created for automated updates

---

## Phase 2: Pre-Production Checks 🟡 IN PROGRESS

**Environment Setup**:
- [ ] `EXPORT_SECRET` set in Vercel project settings
- [ ] `BLOB_READ_WRITE_TOKEN` set in Vercel project settings
- [ ] `ALLOWED_ORIGINS` set in Vercel project settings (e.g., `https://diversey-golf.com, https://www.diversey-golf.com`)

**Code Verification**:
- [ ] Pull latest code: `git pull origin main`
- [ ] TypeScript compiles: `npx tsc --noEmit` (should have 0 errors)
- [ ] npm audit shows 0 critical: `npm audit` (ok to have moderate/low)
- [ ] `.env.example` exists and documents all required vars
- [ ] `api/join-waitlist.ts` includes rate-limiting logic
- [ ] `api/export-waitlist.ts` requires Bearer token

**Local Testing**:
- [ ] Run dev server: `npm run dev`
- [ ] Test join-waitlist: POST with valid email → 200 OK
- [ ] Test join-waitlist: POST with invalid email → 400
- [ ] Test rate-limiting: POST 11 times in 60s → 11th returns 429
- [ ] Test export without auth: GET `/api/export-waitlist` → 403 Forbidden
- [ ] Test export with auth: GET with Bearer token → 200 + CSV

---

## Phase 3: Staging Deployment 🟡 NEXT

**Create Staging Branch**:
- [ ] Create branch: `git checkout -b chore/security-hardening-staging`
- [ ] Push to Vercel staging: `vercel --prod` (or via GitHub PR to staging environment)

**Staging Tests** (See `STAGED_UPGRADE_PR_TEMPLATE.md` for details):
- [ ] Join-waitlist endpoint functional
- [ ] Export endpoint with Bearer token works
- [ ] Rate-limiting returns 429 correctly
- [ ] CORS allowlist enforced
- [ ] No errors in Vercel logs
- [ ] Cold-start time acceptable (<5s)

**Monitor Staging** (30+ minutes):
- [ ] No spike in error logs
- [ ] No 500 errors on API endpoints
- [ ] Rate-limiting working as expected
- [ ] Auth enforcement working (403 for missing token)

**Approval**:
- [ ] [ ] @Archibald312 approves staging tests
- [ ] [ ] Ready for production

---

## Phase 4: Production Deployment 🟠 PENDING

**Pre-Deploy**:
- [ ] All staging tests passed
- [ ] No errors in staging logs (last 24 hours)
- [ ] PR approved by team lead
- [ ] Backup: Can rollback if needed (old code tagged, latest version saved)

**Deploy to Production**:
- [ ] Merge to main: `git merge chore/security-hardening-staging`
- [ ] Push to Vercel: `git push origin main` (auto-deploys)
- [ ] Or manual: `vercel --prod`

**Post-Deploy** (First 24 hours):
- [ ] Monitor error logs: `vercel logs <project> --follow`
- [ ] No spike in 400/403/500 errors
- [ ] Rate-limiting working (see 429 responses in logs)
- [ ] Auth enforcement working (see 403 responses in logs)
- [ ] Smoke tests pass:
  - [ ] POST `/api/join-waitlist` with valid email → 200
  - [ ] GET `/api/export-waitlist` with token → 200 + CSV
  - [ ] GET `/api/export-waitlist` without token → 403

**Verification**:
- [ ] No spike in customer complaints
- [ ] No spike in 5xx errors
- [ ] Rate-limiting not too aggressive (monitor 429 rate)
- [ ] Export endpoint accessible to authorized users

---

## Phase 5: Dependency Upgrade (Staged PR) 🔴 BLOCKED (Requires Staging Tests)

**Prepare Upgrade**:
- [ ] Create branch: `git checkout -b chore/deps-vercel-node-major`
- [ ] Update `package.json`: `"@vercel/node": "^2.3.0"`
- [ ] Run `npm ci`
- [ ] Run `npm audit` (should drop from 3 high to 0 high)

**Test in Staging**:
- [ ] Deploy to staging
- [ ] Run full test suite (see `STAGED_UPGRADE_PR_TEMPLATE.md`)
- [ ] Monitor for 24 hours
- [ ] No breaking changes in API behavior

**Deploy to Production** (After Staging Clear):
- [ ] Merge to main
- [ ] Push to production
- [ ] Monitor for 24 hours
- [ ] Verify npm audit: 0 high-severity vulns

---

## Phase 6: Supply-Chain Hardening 🟢 ONGOING

**Dependabot**:
- [x] `.github/dependabot.yml` created
- [x] Weekly npm update schedule configured
- [x] Auto-labeled as "dependencies" + "security"
- [ ] Monitor for dependency PRs (will auto-open weekly)
- [ ] Review + merge non-breaking updates

**Pre-Commit Hooks** (Optional, Recommended):
- [ ] Install `gitleaks` or `truffleHog`
- [ ] Configure pre-commit hook to scan for secrets
- [ ] Test: Attempt to commit a file with "EXPORT_SECRET=xxx" (should fail)

**GitHub Secret Scanning** (Recommended):
- [ ] Enable in repo settings: Settings → Security & analysis → Secret scanning
- [ ] GitHub will auto-scan for common secret patterns

---

## Phase 7: Post-Deployment Hardening 🟢 FUTURE

**Within 1 Week**:
- [ ] Replace in-memory rate-limiter with Redis or Vercel KV
- [ ] Add `npm audit` check to CI/CD (block merge if high/critical)

**Within 1 Month**:
- [ ] Frontend security audit (XSS, CSP, data leakage)
- [ ] CI/CD security hardening (GitHub Actions, Vercel settings)
- [ ] Add SAST scanning (Snyk, CodeQL)

**Long-Term**:
- [ ] Implement 90-day secret rotation policy
- [ ] Schedule quarterly security reviews
- [ ] Update security runbook for team

---

## Rollback Procedure (If Needed)

**If production deployment fails**:

1. **Immediate** (First 5 minutes):
   - Revert code: `git revert <commit-hash>`
   - Push: `git push origin main`
   - Vercel auto-deploys old code

2. **Within 15 minutes**:
   - Verify production is back to stable state
   - Check error logs
   - Announce to team (if needed)

3. **Root Cause Analysis**:
   - Review staging logs for clues
   - Check what tests failed
   - Prepare fix for next attempt

4. **Retry**:
   - Fix issue in new branch
   - Deploy to staging again
   - Run full test suite
   - Deploy to production

---

## Sign-Off

**Deployment Approval**:
- [ ] Security lead: _____________________ (sign & date)
- [ ] Engineering lead: _____________________ (sign & date)
- [ ] DevOps/Deployment: _____________________ (sign & date)

**Deployment Date**: ________________________

**Deployed By**: ________________________

**Verified By**: ________________________

**Status**: ○ Pending  ○ In Progress  ○ Complete  ○ Rolled Back

**Notes**:
```
[Add any important notes, issues encountered, or observations here]



```

---

## Contact

- **Questions**: Refer to SECURITY_QUICK_REFERENCE.md or SECURITY_REPORT.md
- **Escalation**: Contact @Archibald312 (code review + approval)
- **Incidents**: Immediately revert changes and post to #security channel (Slack)

---

**Last Updated**: November 28, 2025  
**Prepared By**: Security Hardening Task  
**Status**: Ready for Phase 2 (Environment Setup)
