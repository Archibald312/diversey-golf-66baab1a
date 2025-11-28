# Security Patches: Quick Reference for Team

## What Changed?

### API Endpoints (Deployed ✅)

#### `/api/join-waitlist` (POST)
**Before**: Public blobs, no rate-limiting, permissive CORS  
**After**: Private blobs, 10 req/min rate-limit, allowlist CORS

```bash
# Test endpoint
curl -X POST "https://diversey-golf.vercel.app/api/join-waitlist" \
  -H "Content-Type: application/json" \
  -H "Origin: https://diversey-golf.com" \
  -d '{"email": "test@example.com", "fullName": "Test", "company": "Test Inc"}'

# Expected: 200 OK (or 429 if rate-limited)
```

#### `/api/export-waitlist` (GET)
**Before**: Query-string secrets, optional auth  
**After**: Bearer token auth, server-side blob reads

```bash
# Test endpoint
curl "https://diversey-golf.vercel.app/api/export-waitlist" \
  -H "Authorization: Bearer $EXPORT_SECRET"

# Expected: 200 OK + CSV (or 403 if missing/wrong token)
```

---

## Environment Variables (Required in Vercel)

Set these in **Vercel Project Settings** → **Environment Variables**:

| Variable | Purpose | Example |
|----------|---------|---------|
| `EXPORT_SECRET` | Bearer token for export endpoint | `sup3r-s3cur3-t0k3n` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob API token | From Vercel Blob Storage dashboard |
| `ALLOWED_ORIGINS` | CORS allowlist (comma-separated) | `https://diversey-golf.com, https://www.diversey-golf.com` |

**⚠️ DO NOT put these in `.env.local` or commit them. Vercel stores them securely.**

---

## Testing Checklist

Run these before and after deployment:

```bash
# 1. Join-waitlist endpoint
curl -X POST "https://<domain>/api/join-waitlist" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "fullName": "Test", "company": "Test Inc"}'
# Expected: 200 OK

# 2. Rate-limiting (should get 429 on 11th request within 60s)
for i in {1..15}; do
  curl -X POST "https://<domain>/api/join-waitlist" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"test$i@example.com\", \"fullName\": \"Test$i\", \"company\": \"Test\"}"
  echo "Request $i"
done

# 3. Export endpoint without token (should get 403)
curl "https://<domain>/api/export-waitlist"
# Expected: 403 Forbidden

# 4. Export endpoint with token (should get CSV)
curl "https://<domain>/api/export-waitlist" \
  -H "Authorization: Bearer $EXPORT_SECRET" \
  -o waitlist.csv
# Expected: 200 OK + CSV file
```

---

## Dependency Updates (In Progress)

### Vite (✅ Completed)
- **Before**: ^5.4.1
- **After**: ^5.4.15
- **Fixes**: 3 high-severity dev-server issues

### @vercel/node (🔄 Staged for Testing)
- **Before**: ^5.5.13
- **After**: ^2.3.0 (SEMVER-MAJOR)
- **Fixes**: 3 high-severity transitive vulnerabilities (esbuild, path-to-regexp, undici)
- **Status**: Awaiting staging tests + approval
- **Timeline**: 1-2 days

---

## If Something Breaks

### Export endpoint returns 500
- Check Vercel env vars: `EXPORT_SECRET`, `BLOB_READ_WRITE_TOKEN` set?
- Check logs: `vercel logs <project>`

### Rate-limiting too strict
- Current: 10 req/min per IP
- To adjust: Edit `/api/join-waitlist.ts`, line ~40, change `10` to desired limit

### CORS errors
- Check `ALLOWED_ORIGINS` includes your domain
- Format: Comma-separated URLs (no trailing slashes)
- Example: `https://diversey-golf.com, https://www.diversey-golf.com`

### Blobs inaccessible
- Verify `BLOB_READ_WRITE_TOKEN` is set in Vercel
- Blobs should be marked `private` (not `public`)
- Confirm Vercel Blob project exists

---

## Secrets Rotation (If Suspected Breach)

1. **Immediate** (Now):
   - Rotate `EXPORT_SECRET` in Vercel project settings
   - Rotate `BLOB_READ_WRITE_TOKEN` in Vercel Blob dashboard

2. **Near-term** (This week):
   - Scan git history for leaked secrets:
     ```bash
     git log --all -p | grep -i 'EXPORT_SECRET\|BLOB_READ_WRITE_TOKEN'
     ```
   - If found, use `git-filter-repo` to remove (and force-push after team approval)

3. **Long-term** (This month):
   - Enable GitHub secret scanning
   - Add pre-commit hook (`gitleaks`, `truffleHog`)
   - Implement 90-day rotation policy

---

## Monitoring

### Key Logs to Watch
```bash
# Monitor export requests (should see Bearer tokens attempted)
vercel logs <project> | grep "export-waitlist"

# Monitor rate-limiting (should see 429 responses under load)
vercel logs <project> | grep "429"

# Monitor auth failures (should see 403 responses)
vercel logs <project> | grep "403"
```

### Metrics
- **Join-waitlist**: Track 429 responses (indicates rate-limiting working)
- **Export-waitlist**: Track 403 responses (indicates auth enforcement working)
- **Blob access**: No 401/403 blobs being returned as public

---

## FAQ

**Q: Can I still access blobs via public URLs?**  
A: No. They're now private. Only server-side can read with token.

**Q: What if I need to read blobs client-side?**  
A: Don't. Use `/api/export-waitlist` endpoint instead (server handles blob auth).

**Q: Can I disable rate-limiting?**  
A: Not recommended (open to spam/DoS). But you can raise the limit (edit code, redeploy).

**Q: Will @vercel/node upgrade break my API?**  
A: Unlikely (tested in staging first). But prepare for potential issues; rollback is easy (revert version, redeploy).

**Q: How often should I rotate secrets?**  
A: Quarterly (90 days) for non-critical services. Immediately if suspected breach.

---

## Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Blob Storage**: https://vercel.com/docs/storage/vercel-blob
- **Environment Variables**: https://vercel.com/docs/projects/environment-variables
- **Security Report**: See `SECURITY_REPORT.md` in repo
- **Staged Upgrade PR**: See `STAGED_UPGRADE_PR_TEMPLATE.md` in repo

---

**Last Updated**: November 28, 2025  
**Prepared By**: Security Hardening Task
