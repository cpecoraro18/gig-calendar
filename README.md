# Calendar

A private calendar at **calendar.chrispecmusic.com**, built for a phone. It
reads and writes your Google calendars directly — month grid, agenda, create,
edit, delete — and adds **tools**: the things a general calendar app can't do,
starting with publishing an event as a gig on chrispecmusic.com.

It is a calendar first. The gig publisher is one tool inside it, not the point
of it.

## What it does

- **Month view** with event titles in the cells, coloured by calendar — all-day
  events as filled chips, timed ones with a dot, and `+2` where a day has more
  than fits. Tap a day for the full list underneath; swipe or use the arrows to
  change month.
- **Agenda view** — every day that has something on it, in order, skipping the
  empty ones. "Show earlier" reveals the past; "Load more" fetches further out.
- **All your calendars at once**, ticked and unticked in ⚙. The first run
  mirrors what you already have selected in Google Calendar.
- **Create, edit and delete events**: title, all-day or timed, place, notes,
  which calendar, and a simple repeat rule. Changing an event's calendar moves
  it, keeping its identity and its guests.
- **Tools** on any event, offered in the event sheet.

Read-only calendars (the ones shared with you) display but can't be edited, and
say so rather than failing at the point of saving.

## Why there is no backend

The website's `getCalendarEvents` Lambda reads the gigs calendar with a service
account, which is right for a public page: visitors aren't signed in to
anything. This app is the opposite case — you *are* signed in, and the browser
can hold a Google token and call the Calendar API directly.

That removes the Lambda, the API Gateway route, the email allowlist and the S3
state file that a server-side version would need. The page ships with no
credentials in it: it asks Google for a token when you tap sign in, and Google
only returns one scoped to whoever signed in. Someone else opening the URL gets
their own calendar, not yours — the thing protecting your data is your Google
password, exactly as on calendar.google.com.

The trade-off is that nothing runs while the page is closed: no notifications,
no background sync. Everything happens when you open it.

## Tools

A tool is a plain object in `src/tools/`, listed in `src/tools/registry.js`.
Nothing else in the app knows what any tool does — the event sheet renders the
ones that apply, the agenda rows render whatever badges they ask for, and the
Calendars sheet renders their settings. The registry file documents the shape;
`src/tools/gig/` is a worked example of all of it.

Adding one is a file and a line:

```js
// src/tools/registry.js
import gig from './gig/tool.js'
import setlist from './setlist/tool.js'

export const tools = [gig, setlist]
```

### The gig tool

Publishing writes an ordinary event to the gigs calendar, so the website keeps
working untouched. What ties that listing back to the event it came from lives
in `extendedProperties.private`:

| key | purpose |
| --- | --- |
| `srcEventId` | the event this gig came from — the dedup key |
| `srcCalendarId` | which calendar that event was on — `primary` for your own, never your email address |
| `srcHash` | fingerprint of the source when you published |

Because matching is on `srcEventId` rather than on title and time, renaming a
gig doesn't create a second listing, and reopening the app never duplicates
anything. `srcHash` is what drives the **Changed** flag: the event moved on your
calendar after you published it, so the site may now be out of date.

Extended properties come back on every read and cap out around 1 KB per value,
so each field is a separate key rather than one JSON blob.

**Everything on a published gig is public.** The website reads the gigs calendar
through a Lambda that returns the raw event resource, so the title, location,
description *and* extended properties all reach anyone who asks. Two things
follow. Google uses your email address as your primary calendar's id, which is
why `srcCalendarId` records the literal string `primary` instead. And the
description box starts as a copy of the source event's — so if a band invite
carries a fee, a home address or a phone number, clear it before publishing.

## How events load

Events are fetched in spans, not in one enormous query. Opening the app costs
about six months across your visible calendars; walking into next year fetches
only the part that's missing. The loaded window is kept as a single contiguous
span, because a calendar is navigated outwards from today — holes in the middle
never arise, so nothing tracks them.

One calendar failing doesn't take the screen down: it's reported on its own
line and the rest still render.

## Repeating events

The list is fetched with `singleEvents`, so a weekly residency arrives as the
individual nights. Editing or deleting one of them affects that night only, and
the editor says so. Creating a repeat writes an `RRULE`; changing an existing
series' rule is a Google Calendar job.

## One-time setup

1. **Google Cloud console** → *APIs & Services* → *Credentials* → create an
   **OAuth client ID**, type **Web application**.
   - Authorised JavaScript origins: `https://calendar.chrispecmusic.com` and
     `http://localhost:5173`
   - Redirect URIs: leave empty, this app never uses one.
2. Enable the **Google Calendar API** on the same project.
3. On the OAuth consent screen, add yourself as a **test user** (or publish the
   app) so Google will issue tokens to your account.
4. Add the client ID to the repo as a secret named `GOOGLE_CLIENT_ID`
   (*Settings* → *Secrets and variables* → *Actions*).
5. Point DNS: a `CNAME` record for `calendar` → `cpecoraro18.github.io`.
   `public/CNAME` already carries the domain into the build.

## Local development

```sh
npm install
echo "VITE_GOOGLE_CLIENT_ID=<your client id>" > .env.local
npm run dev
```

Opens on `http://localhost:5173`, which is why that origin is in the list above.

## Scopes

- `calendar.events` — read and write events on any calendar you can reach
- `calendar.readonly` — list which calendars exist, and their colours

Deliberately narrower than the blanket `calendar` scope: neither one can
create, delete or share a calendar. Those are things you do once, in Google
Calendar, and never from a phone.

## Not built, on purpose

Invites and attendee replies, drag-to-reschedule, a week grid, notifications.
Guests are shown as a count with a pointer at Google Calendar, which is where
band invites arrive and where replying actually works.

## Licence

MIT — see [LICENSE](LICENSE). The Google client ID is a build-time variable, so
a fork builds against its own OAuth client and its own calendars.
