# PRD: The Wayback Dispatch

**Status:** Draft
**Owner:** Joshua Pothen
**Last updated:** July 13, 2026

## Summary

A one-page "front page of the newspaper" dashboard that surfaces a small, bounded set of random, unfamiliar websites pulled from the Wayback Machine — personal homepages, fan sites, and hobby pages from the pre-social-media web that the reader has never seen before. The point is discovery, not archival browsing: a daily ritual of finding a handful of internet artifacts you didn't know existed, without the overload of an endless feed.

## Problem

The Wayback Machine preserves an enormous slice of the old web, but it's not built for discovery — you can only look up a URL you already have in mind. Meanwhile, existing nostalgia projects (404PageFound, Web Design Museum, "remember this site" listicles) are all curated around sites people *already remember* — MySpace, GeoCities' front page, Friendster. There's no tool that surfaces the *obscure*, never-famous corners of the old personal web: someone's aquarium blog, a webring about lighthouses, a paper-model hobby club. That's the gap this fills.

## Goals

- Surface websites the reader has never seen before, not nostalgia for sites they already know.
- Present a small, fixed number of finds per visit — bounded like a newspaper front page, not an infinite scroll.
- Make each find feel like a real discovery: enough context to be intriguing, not so much it becomes a full directory listing.
- Be cheap to run and maintain — no ongoing crawling infrastructure.

## Non-goals

- Not a general Wayback Machine browser or URL lookup tool.
- Not a search engine — no keyword search, no filtering by topic (at least for V1).
- Not a live crawler of the present-day web — only pulls from what's already archived.
- Not a social product — no accounts, comments, or sharing (V1).
- Not exhaustive or comprehensive — some randomness and repetition is acceptable.

## User story

As someone nostalgic for the pre-platform internet, I want to open one page and see a handful of old, obscure websites I've never encountered, so I get a small daily jolt of discovery without having to dig through archive.org myself.

## Core mechanic: how "random and unfamiliar" actually works

The Wayback Machine has no "surprise me" API, so randomness has to be engineered:

1. **Sampling pool:** Query the CDX index (Internet Archive's capture index) not for one URL, but for entire free-hosting domains that were home to personal/hobby pages in the 90s–2000s — geocities.com, angelfire.com, tripod.com, expage.com, xoom.com. Each returns a massive list of every page ever archived under it.
2. **Randomization:** Since the full list per domain can be enormous, jump to a random page offset in the CDX pagination rather than downloading the whole index.
3. **Filtering:** Restrict to `statuscode:200` and `mimetype:text/html` so broken or non-page captures don't surface. Use `collapse=urlkey` to avoid showing near-duplicate captures of the same page.
4. **Avoiding "sites I already know":** Because the pool is personal subpages rather than the platforms themselves, the famous sites (the platforms) never surface as results — only the individual pages hosted on them. A short blocklist covers the small number of personal pages that did go viral or become well-known.
5. **Preview:** Render each result via archive.org's iframe-friendly capture URL (the toolbar-stripped variant) rather than generating a custom screenshot.
6. **Freshness:** "New edition" reshuffles the sample; no requirement to persist or dedupe across sessions in V1.

## Requirements (V1)

| # | Requirement |
|---|---|
| 1 | One-page layout, front-page-of-a-newspaper style: one lead item, a few mid-sized items, several small one-liners |
| 2 | Fixed count per load (e.g. 9 items) — never an unbounded feed |
| 3 | Each item shows: capture year, domain/URL, a short auto-generated or excerpted description, host type (e.g. "personal homepage," "webring," "fan archive") |
| 4 | "New edition" action reshuffles the page with a fresh random sample |
| 5 | Clicking an item opens the live archived page (via archive.org) |
| 6 | Blocklist of known/famous domains and pages, excluded from sampling |
| 7 | Runs as a static front end + lightweight fetch layer — no persistent backend required |

## Possible V2 ideas (not committed)

- Save/star a find to revisit later
- Filter by decade or host type
- "On this day" mode using capture dates
- Personal seed list mixed in alongside the random pool

## Risks / open questions

- **Content quality variance:** Random sampling will surface a lot of dead links, empty pages, and low-interest captures alongside genuine finds — may need a light quality filter (e.g. minimum text length) beyond just status code.
- **Content safety:** Random old personal pages can occasionally surface content that's offensive, broken, or NSFW by today's standards — needs some filtering approach before wide sharing (less of a concern for a personal-use tool).
- **Rate limits:** The Internet Archive's CDX API is free and public but not rate-limit-free at scale — fine for a personal, low-frequency dashboard; would need caching if usage grew.
- **Coverage bias:** Sampling from a handful of known free-hosting domains means the "old internet" surfaced is skewed toward that era/genre (roughly 1996–2008 personal homesteading sites) rather than the whole archived web.

## Success looks like

A personal tool Joshua actually opens and gets a genuine "huh, look at that" moment from — not usage metrics, since this is a personal-use project rather than a public product (at least for V1).
