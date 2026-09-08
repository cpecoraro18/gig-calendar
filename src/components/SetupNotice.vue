<template>
  <div class="notice">
    <h1>Almost there</h1>
    <p class="muted">
      This build has no Google OAuth client ID, so it can't ask Google for
      permission to read your calendar. One-time setup:
    </p>
    <ol>
      <li>
        In the
        <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">
          Google Cloud console
        </a>, create an <strong>OAuth client ID</strong> of type
        <strong>Web application</strong>.
      </li>
      <li>
        Add <code>https://calendar.chrispecmusic.com</code> and
        <code>http://localhost:5173</code> as <strong>Authorised JavaScript origins</strong>.
        Leave redirect URIs empty — this app never uses one.
      </li>
      <li>
        Enable the <strong>Google Calendar API</strong> for the same project.
      </li>
      <li>
        Put the client ID in <code>.env.local</code> as
        <code>VITE_GOOGLE_CLIENT_ID=…</code> for local use, and in the repo's
        <code>GOOGLE_CLIENT_ID</code> secret for the deployed build.
      </li>
    </ol>
    <p class="muted small">
      The client ID isn't a secret — Google only honours it on the origins listed
      above, which is what stops anyone else's site from using it.
    </p>
  </div>
</template>

<style scoped>
.notice {
  max-width: 34rem;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
}

h1 {
  font-size: 1.5rem;
  margin: 0 0 0.75rem;
}

ol {
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

code {
  background: var(--surface-2);
  border-radius: 5px;
  padding: 0.1rem 0.35rem;
  font-size: 0.85em;
  word-break: break-all;
}

a {
  color: var(--accent);
}

.small {
  font-size: 0.87rem;
}
</style>
