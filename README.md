# Gig Scheduler

A private calendar console at **calendar.chrispecmusic.com**. It shows your main
Google Calendar as an agenda, and puts a **Create gig** button on any event —
which writes a matching event to the gigs calendar that chrispecmusic.com
already reads.

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

The trade-off is that nothing runs while the page is closed, so there is no
nightly scan and no background sync. Everything happens when you open it.

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

## How a gig is linked to its source

A published gig is an ordinary event on the gigs calendar, so the website keeps
working untouched. What ties it back to the event you created it from lives in
`extendedProperties.private`:

| key | purpose |
| --- | --- |
| `srcEventId` | the event this gig came from — the dedup key |
| `srcCalendarId` | which calendar that event was on — `primary` for your own, never your email address |
| `srcHash` | fingerprint of the source when you published |

Because matching is on `srcEventId` rather than on title and time, renaming a
gig doesn't create a second listing, and reopening the app never duplicates
anything. `srcHash` is what drives the **Source changed** flag: the event moved
on your calendar after you published it, so the site may now be out of date.

Extended properties come back on every read and cap out around 1 KB per value,
so each field is a separate key rather than one JSON blob.

**Everything on a published gig is public.** The website reads the gigs calendar
through a Lambda that returns the raw event resource, so the title, location,
description *and* extended properties all reach anyone who asks. Two things
follow. Google uses your email address as your primary calendar's id,
which is why `srcCalendarId` records the literal string `primary` instead. And
the description box in the panel starts as a copy of the source event's — so if
a band invite carries a fee, a home address or a phone number, clear it before
creating the gig.

## Scopes

- `calendar.events` — read and write events (this is what creates a gig)
- `calendar.readonly` — list which calendars exist, for the two pickers

Deliberately narrower than the blanket `calendar` scope.

## Not built, on purpose

General calendar editing, drag-to-reschedule, invites and attendees. Google
Calendar is better at all of it and it's where band invites arrive anyway. This
stays a gig console that happens to be shaped like a calendar.
