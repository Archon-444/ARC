---
name: Refactor Slice
about: Track a bounded architectural refactor using the ARC reference pattern
labels: [refactor]
---

## Summary

Describe the refactor scope in 2-4 sentences.

## Domain

Examples: profile, marketplace, collection, nft detail, navigation, launch.

## Files to Create

- ``
- ``

## Files to Modify

- ``
- ``

## Pattern Reference

Use the profile refactor as the reference implementation:

- `frontend/src/components/profile/`
- `frontend/src/hooks/useProfileGateway.ts`
- `frontend/src/lib/profile.ts`
- Commit `05461e2`

## Verification Steps

- [ ] `cd frontend && npm run type-check`
- [ ] `cd frontend && npm run lint`
- [ ] `cd frontend && npm test`
- [ ] `cd frontend && npm run build`
- [ ] Manual QA for affected flow

## Claude-suitable

- [ ] Yes
- [ ] No

## Notes

Add risks, sequencing details, or migration constraints.
