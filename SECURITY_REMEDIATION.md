# Security Remediation Report & Staged Upgrade Plan

**Date**: November 28, 2025  
**Repository**: diversey-golf-66baab1a  
**Status**: Security hardening in progress

---

## 1. COMPLETED: API Security Hardening (Deployed)

### Changes Applied:
- ✅ **Private Blob Storage**: Changed `api/join-waitlist.ts` to write blobs with `access: 'private'`
- ✅ **Email Index**: Added duplicate detection using `waitlist-index/{encodedEmail}.json` markers
- ✅ **Input Validation**: Enforce email format and fullName type checks
- ✅ **Rate Limiting**: In-memory per-IP throttle (10 req/min baseline)
- ✅ **Secure Filenames**: Use SHA-256 hashing instead of raw emails in blob names
- ✅ **CORS Hardening**: Replaced `Access-Control-Allow-Origin: *` with allowlist from `ALLOWED_ORIGINS` env var
- ✅ **Export Auth**: Require `Authorization: Bearer <EXPORT_SECRET>` header (no query-string secrets)
- ✅ **Server-Side Reads**: `api/export-waitlist.ts` fetches blobs with `BLOB_READ_WRITE_TOKEN` server-side

### Environment Variables (Configured in Vercel):
- ✅ `EXPORT_SECRET` — Set
- ✅ `BLOB_READ_WRITE_TOKEN` — Set
- ✅ `ALLOWED_ORIGINS` — Set

---

## 2. COMPLETED: Dependency Updates (Phase 1)

### Vite Upgrade: ^5.4.1 → ^5.4.15
**Fixed Advisories**:
- ✅ GHSA-vg6x-rcgg-rjx6 (dev-server request interception)
- ✅ GHSA-x574-m823-4x7w (fs.deny bypass with ?raw??)
- ✅ GHSA-4r4m-qw57-chr8 (fs.deny bypass with ?import)

**Audit Results After Vite Bump**:
- Total vulnerabilities: 12 (down from ~15 pre-vite)
- Critical: 0 ✅
- High: 3 (all tied to `@vercel/node`)
- Moderate: 6
- Low: 3

---

## 3. IN PROGRESS: Dependency Updates (Phase 2 - Requires Testing)

### Recommended: @vercel/node ^5.5.13 → ^2.3.0 (MAJOR VERSION - Semver Breaking)

**Why**:
- Fixes high-severity transitive vulnerabilities in:
  - `esbuild` (CVSS 5.3): Dev-server request interception
  - `path-to-regexp` (CVSS 7.5): ReDoS in route matching
  - `undici` (CVSS 6.8): Insufficient randomness in crypto

**Risks & Testing Checklist**:
- [ ] Vercel Node runtime changes — validate function behavior in staging
- [ ] Bundling differences — ensure API functions still work as expected
- [ ] Dependencies on older APIs — review breaking changes in changelog
- [ ] Performance impact — measure cold-start and execution times

**Staged Upgrade Steps** (for you to do):
1. Create branch: `git checkout -b chore/deps-vercel-node-major`
2. Update `package.json`: `"@vercel/node": "^2.3.0"`
3. Run: `npm ci && npm audit`
4. Test locally: `npm run dev` + verify API endpoints
5. Deploy to **staging** environment
6. Run smoke tests: join-waitlist and export-waitlist endpoints
7. Monitor logs for errors
8. If stable, merge to `main` and monitor production

---

## 4. Supply-Chain Hardening (Completed)

### Dependabot Configuration
- ✅ Created `.github/dependabot.yml` for automated weekly dependency updates
- ✅ Set to open PRs for direct and indirect vulnerabilities
- ✅ Limits 5 concurrent PRs to prevent noise
- ✅ Auto-labels as "dependencies" and "security"

### Environment Documentation
- ✅ Created `.env.example` with all required env vars and security notes
- ✅ Clear instructions for rotating secrets (90-day recommended cadence)

---

## 5. Remaining Moderate/Low Advisories (Non-Blocking)

| Package | Severity | Type | Issue | Fix |
|---------|----------|------|-------|-----|
| @babel/runtime | Moderate | ReDoS | Inefficient RegExp in transpiling | Update transitive (auto-fixed by npm upgrade) |
| js-yaml | Moderate | Prototype Pollution | Merge operator (<<) | Transitive — check after @vercel/node upgrade |
| nanoid | Moderate | Randomness | Predictable with non-integer seed | Likely auto-fixed by transitive upgrades |
| @eslint/plugin-kit | Low | ReDoS | ConfigCommentParser | Auto-fixed by eslint update |
| brace-expansion | Low | ReDoS | Pattern matching | Transitive — low risk |

**Action**: These will likely auto-resolve when `@vercel/node@2.3.0` is deployed (it updates transitive deps).

---

## 6. Frontend Security Review (Recommended - Not Yet Done)

Scope for future work:
- [ ] XSS attack vectors in React components
- [ ] Content Security Policy (CSP) headers
- [ ] Sensitive data in localStorage/sessionStorage
- [ ] Third-party script safety (Lottie animations, etc.)

---

## 7. CI/CD & Git Security (Recommended - Not Yet Done)

Recommended additions:
- [ ] GitHub secret scanning (enable in repo settings)
- [ ] Pre-commit hook with `gitleaks` or `truffleHog` to prevent secret commits
- [ ] GitHub Actions workflows for:
  - [ ] `npm audit` on PR (block merge if high/critical)
  - [ ] SAST scanning (e.g., Snyk, CodeQL)
  - [ ] Dependency supply-chain checks

---

## Deployment Checklist

**Before Deploying to Production**:
- [ ] All three env vars set in Vercel project: `EXPORT_SECRET`, `BLOB_READ_WRITE_TOKEN`, `ALLOWED_ORIGINS`
- [ ] Test export endpoint: `curl -H "Authorization: Bearer $EXPORT_SECRET" https://<domain>/api/export-waitlist`
- [ ] Test join-waitlist: verify rate-limiting and duplicate prevention
- [ ] Verify blobs are private (not publicly accessible)
- [ ] Review logs for any errors related to blob access or auth failures

**After Deploying**:
- [ ] Monitor error logs for 24 hours
- [ ] Verify no spike in 401/403 responses
- [ ] Run smoke tests on both API routes
- [ ] Confirm rate-limiting is working (test rapid submissions)

---

## Vulnerability Disclosure & Rotation

If any past secrets were exposed:
1. Rotate `EXPORT_SECRET`, `BLOB_READ_WRITE_TOKEN` immediately in Vercel
2. Scan git history for leaked secrets: `git log --all -p | grep -i 'BLOB\|EXPORT_SECRET\|TOKEN'`
3. If found, use `git-filter-repo` to remove from history
4. Force-push to main (after team approval)
5. Update any external systems that may have cached old tokens

---

## Next Steps (Prioritized)

1. **Immediate (Today)**:
   - Ensure env vars are deployed to production ✅
   - Run manual smoke tests on both API endpoints
   - Monitor logs for errors

2. **Within 24-48 Hours**:
   - Upgrade `@vercel/node` in a separate PR (branch)
   - Run full staging tests
   - If stable, merge to production

3. **This Week**:
   - Replace in-memory rate-limiter with persistent store (Redis or Vercel KV)
   - Add automated dependency audit checks in CI
   - Scan git history for any past secret leaks

4. **This Month**:
   - Frontend security audit (XSS, CSP, data leakage)
   - Add GitHub secret scanning + pre-commit hooks
   - Implement SAST scanning in CI/CD

---

## Contact & Support

- **Review Findings**: See original security review for full exploit details and PoCs
- **Questions**: Refer to `.env.example` for env var documentation
- **Incidents**: If a vulnerability is discovered, rotate secrets immediately and run `npm audit`

