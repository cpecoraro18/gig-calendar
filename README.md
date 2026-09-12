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
- **Social posts** — a vertical image of one gig, this week's gigs or the rest
  of the month's, in forty-eight styles, with or without a photo. The ▣ button
  above the ＋, or the tool on any upcoming event.

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

## Installing it

It is a progressive web app, so it goes on the home screen and opens without
browser chrome: on iOS, *Share* → *Add to Home Screen*; on Android, Chrome's
menu → *Install app*.

A service worker caches the shell and the hashed bundle, which is what makes a
cold launch instant on a venue's wifi. It does not make the app work offline,
and isn't meant to: every event comes from Google, so with no signal you get
the sign-in screen or the app's own "couldn't load" message. A stale calendar
would be worse than an honest empty one — the whole reason you're looking is to
find out what is actually on.

A new deploy is picked up on the next launch; the app checks for one each time
you come back to it. It never reloads itself while you're using it, so an
update can't appear in the middle of a half-finished event.

The access token still lives in `sessionStorage`, so launching the installed
app is a fresh session and asks you to sign in. Once you've consented that is a
single tap with no Google prompt behind it.

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

There are two: **the gig publisher**, which puts a night on the website, and
**the post maker**, which turns one into a picture for a phone.

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

### The post tool

Opens from ▣ above the ＋, or from any upcoming event. It draws a vertical
image — 1080×1920 for a story, 1080×1350 for a feed — and hands it to the
system share sheet, which on a phone means straight into Instagram. Where
sharing files isn't available it saves a PNG instead.

Three ranges, all of them starting today rather than at the top of the period,
because a poster advertising last Tuesday is worse than no poster:

| range | covers |
| --- | --- |
| One gig | whichever you pick, day of or later |
| This week | today through the end of this calendar week |
| This month | today through the end of this month |

Gigs come from the **gigs calendar**, so a post and the website can't disagree
about what's on. The event you opened the studio from is added on top, so you
can announce a night before you've published it. Anything in range can be
unticked before it's drawn.

**The quiet ones come first.** Plain, Noir, Paper, Slate, Typewriter, Sage, Clay
and Indigo lead the style strip: a flat ground, one typeface and the space around
it, with no ornament of any kind. They also drop the box from behind the day in a
list and stop the date being a spot colour, so a run of dates reads as a set list
rather than a row of badges. The expressive styles follow. Most posts want the
front of the strip; the back of it is there for the ones that don't.

**Photos.** Add one and fifteen more styles appear, built around a picture —
Billboard, Duotone, Polaroid, Split, Arch, Film, Cut-out, Wash, Framed, Halftone,
Slices, Spotlight, Card, Wedge and Column — and the strip puts them first. A crop
slider decides what survives the squeeze into a vertical frame, which matters
because a phone photo cropped to 9:16 takes someone's head off about half the
time. The image never leaves the phone: it is resampled to 1800px in a canvas
and drawn straight into the poster, so there is no upload and nothing to delete
afterwards. Remove it and the styles go back to the thirty-three typographic
ones.

`src/tools/poster/` splits four ways, and the split is what makes forty-eight
styles affordable:

| file | job |
| --- | --- |
| `paint.js` | the canvas kit — type fitting, tracking, grain, gradients, bulbs |
| `posters.js` | calendar events → act, venue, day, time |
| `themes.js` | the forty-eight looks: palette, type, background, a few switches |
| `render.js` | the two layouts — one gig as a hero, several as a list |

A theme is a palette and a dozen lines of background, never a layout. The hard
part — fitting an unknown band name and up to eleven dates inside a fixed
rectangle — is written once and shared, which is also why every content size is
measured rather than hard-coded. Nothing is fetched: the type is whatever
families the device already has, probed at runtime, so the studio works in a
venue basement with no signal.

A photo style is the one thing that changes the shape of the problem: it takes
some of the poster for the picture, so it also says where the words may go
(`boxFor`), and `S.mode` lets it answer differently for one gig than for nine —
a single name sits happily over a full-bleed image under a gradient, nine rows of
dates need a solid ground. Because the box can then be half the height, every
size and gap in both layouts is the smaller of what it wants and a share of what
it got, and the optional lines (the town, then the venue) are shed before the
name is allowed to shrink. At full height the caps win, so a picture being added
somewhere else never moves the typographic styles.

Thumbnails in the style picker run the same code at 8% scale. `measureText`
ignores the canvas transform, so a thumbnail is a true miniature of the export
rather than a simplified drawing that flatters it.

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
