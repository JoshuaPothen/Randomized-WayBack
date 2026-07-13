# Design: The Wayback Dispatch (V1)

**Status:** Approved
**Source PRD:** `wayback-dispatch-prd.md`
**Date:** 2026-07-13

This document refines the PRD into a concrete technical design. It supersedes the PRD's requirement #2 (fixed 9-item count) — see "Item count" below.

## Architecture

- **Next.js app deployed on Vercel.** A single API route, `/api/edition`, is the PRD's "lightweight fetch layer." Everything else is a static/client-rendered frontend.
- **No database, no persistence.** Every "New Edition" click calls `/api/edition` fresh; no session state, no dedup across visits (per PRD, not required for V1).
- **No caching layer in V1.** Each request does live CDX + capture fetches. Acceptable for personal, low-frequency use; revisit only if rate limits become a real problem.
- **No LLM calls.** Descriptions, host-type labels, and thumbnails are derived deterministically from the archived page's own HTML/text via heuristics — free, fast, no external API dependency beyond the Internet Archive itself.

## Item count

The PRD's fixed-9-items requirement is relaxed: target **~15-20 items per edition** (1 lead, 1 runner-up, ~4-5 mid items, remainder as one-line "briefs"). Still bounded — never an infinite/paginated feed — just fuller than the original mockup count.

## Data flow: building one edition

`/api/edition` (called on initial load and on every "New Edition" click):

1. **Domain pool**: a small hardcoded list of free-hosting domains from the 90s-2000s personal-web era (geocities.com, angelfire.com, tripod.com, expage.com, xoom.com, etc.), stored in server config.
2. **Oversample candidates**: pick ~20-30 random domain/subpath candidates from the pool. For each:
   - Query CDX for that domain's total capture count, then jump to a **random offset** into it (rather than paging from the start) to get a candidate URL + timestamp.
   - Filters applied at the CDX query level: `statuscode:200`, `mimetype:text/html`, `collapse=urlkey`.
3. **Blocklist filter**: drop any candidate whose domain or exact URL matches the blocklist (requirement #6, config-driven list of known/famous personal pages and platforms).
4. **Fetch + quality filter**: fetch the actual archived capture (needed for excerpt/thumbnail anyway). Drop it if extracted text is below a minimum length threshold (e.g. <100 characters) — filters empty/broken captures.
5. **Enrichment**, per surviving candidate:
   - **Description**: cleaned excerpt from `<title>` / meta description / first substantial text paragraph.
   - **Host type**: ordered keyword heuristics over title/text/URL path (e.g. "webring" → Webring, "fan fiction"/"fanfic" → Fan Archive, else → Personal Homepage).
   - **Capture year**: from the CDX timestamp.
   - **Visual treatment** (see Thumbnails below): first suitable embedded image → extracted page color → neutral default.
6. **Assembly**: trim the oversampled, filtered set down to the ~15-20 target. Items with the richest excerpts become lead/runner-up; the rest distribute across mid/briefs tiers.
7. **Response**: flat JSON array of `{url, captureUrl, domain, year, description, hostType, tier, thumbnail}`. The frontend renders by tier only — no classification logic on the client.

Failed candidates (CDX errors, fetch timeouts) are simply dropped, not retried beyond one attempt per candidate; the oversampling ratio absorbs the loss so the final count stays in range. If IA is down entirely, the route returns an error payload instead of a partial/empty edition.

## Thumbnails

Every item's visual area resolves via this fallback chain, no bare text-only cards:

1. **First suitable embedded image**: parse the archived page's HTML for its first substantial `<img>` (skip common junk like spacer gifs, nav buttons, tiny dimensions), and use that image's own archived URL (same domain/timestamp) as the thumbnail.
2. **Extracted page color**: if no usable image (or it 404s client-side via `onerror`), parse the page's HTML/inline CSS for a `bgcolor` attribute or `background-color`/`color` style value, and render the thumbnail area as a solid swatch of that color.
3. **Neutral default**: if neither is found, use a plain neutral default color swatch.

## Content safety

Per PRD, no additional NSFW/content filtering beyond the domain blocklist (requirement #6) for this personal-use V1.

## Frontend components

- **`Masthead`** — title, edition date/item count, "New Edition" button (triggers refetch + re-render).
- **`FrontPage`** — top-level layout container; takes the flat item array from the API and arranges by tier. Owns loading/error state for the edition fetch.
- **`LeadStory`** + **`RunnerUp`** — top-row pairing (tag, year, domain, title, description, thumbnail); links out via capture URL.
- **`MidGrid`** — uneven mid-row of ~4-5 items with varied card widths.
- **`Briefs`** — multi-column one-line list for the remaining items, scales to however many land in that tier.
- **Click behavior**: every item, any tier, opens `web.archive.org/web/<timestamp>if_/<url>` (toolbar-stripped variant) in a new tab.
- **Loading/error state**: lightweight loading skeleton on initial load and on "New Edition"; on API failure, a simple message + retry affordance rather than a broken page.

## Error handling

- CDX/IA request failures: one retry per candidate, then drop and move on (oversampling absorbs this).
- Total failure (IA down): clear error response from `/api/edition`; frontend shows a retry state.
- Thumbnail image failures: handled client-side via `onerror`, falling through to the color-swatch tier.
- Candidate processing is parallelized server-side (not sequential) to keep edition load time reasonable given the fan-out of live HTTP calls.

## Testing

- **Unit tests** for deterministic logic: blocklist matching, host-type heuristic classifier, excerpt extraction/cleaning, image-candidate selection (junk-filename/size filtering), color extraction, tier assignment.
- **Route orchestration test** for `/api/edition` (oversample → filter → enrich → assemble) against mocked CDX/fetch responses — not against live IA calls, which are fragile to depend on in CI.
- **Manual verification**: load the page and click "New Edition" repeatedly to eyeball real results — required as part of "done" given this is a personal, visually-judged tool.

## Non-goals (reaffirmed from PRD)

No accounts, no search/filtering, no live crawling beyond the Wayback Machine's own archive, no exhaustiveness guarantee, no custom screenshot generation (thumbnails only use assets/colors already present in the archived capture itself).
