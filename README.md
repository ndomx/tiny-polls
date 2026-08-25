# Tiny Polls

A tiny local-first poll app backed by PocketBase.

## Requirement Status

| Requirement | Current state |
| --- | --- |
| Anonymous users can open a previously created poll and vote if the poll is still open. | Implemented. Public poll links at `/polls/<codename>` load polls from PocketBase, and the vote API rejects closed, draft, expired, or missing polls. |
| The app is shared only with close contacts and does not need heavy security focus. | Reflected in the current design. Polls are private by unlisted link, voters do not need accounts, and admin data access currently uses local server-side PocketBase credentials. |
| Admin can access all polls and see voter info. | Implemented. Admins can sign in at `/admin/login`, view all polls at `/admin`, and open each poll's owner dashboard at `/owner/<codename>` to see voter names, short voter IDs, answers, correctness, submission time, and source data. PocketBase Admin UI can also access all `polls` and `submissions`. |
| Admin-exclusive pages must be protected behind PocketBase auth. | Implemented for the existing owner dashboard and owner API. Admins sign in at `/admin/login` using PocketBase superuser credentials, and the app stores the PocketBase token in an `httpOnly` cookie. |
| Admin needs a way to submit new polls. For now, polls are multiple-selection questions with a single correct answer. | Implemented. Admins can create polls at `/admin/polls/new`; the app stores JSON options, forces one selection, and allows zero or one correct answer so the answer can be set later. |

## Implemented Features

- Public poll pages are available at `/polls/<codename>`.
- Closed or expired poll pages show the correct answer.
- Anonymous voters are identified by the `tiny_polls_voter_id` browser cookie.
- Voters provide a display name before submitting.
- Votes can be updated from the same browser as long as the poll remains open.
- Polls support configurable options, status, close time, minimum selections, maximum selections, and correct answer IDs.
- The current UI supports single-answer polls with radio buttons and multi-answer polls with checkboxes.
- Vote submissions store selected option IDs, voter name, voter ID, source, UTM fields, user agent, correctness, and submission time.
- Public results at `/polls/<codename>/results` are anonymous and auto-refresh.
- Results include current counts, percentages, and a simple pie chart.
- Owner results include private submission details and source breakdowns.
- Admin login and logout are available at `/admin/login`.
- Admin poll listing is available at `/admin`, with links to owner results and public voting plus close/remove poll actions.
- Admin poll creation is available at `/admin/polls/new`.
- Admin poll editing is available at `/admin/polls/<codename>/edit` for content, status, close time, answer options, and the correct answer.
- Poll creation and editing validate unique codenames, required text, status, close time, at least two options, and at most one correct answer.
- Poll creation and editing support deferring the correct-answer selection.
- Existing owner pages and owner APIs are protected by a PocketBase-authenticated admin session.
- Owner pages include generated share links for `family`, `friends`, and `group` source tracking.
- PocketBase migrations create the required `polls` and `submissions` collections and seed one local demo poll.
- The UI supports locale-prefixed English and Spanish routes at `/en/...` and `/es/...`.

## Missing Work

- Consider replacing superuser-backed app login with a dedicated PocketBase `admins` auth collection before the admin surface grows.
- Add tests around closed-poll rejection, duplicate-voter update behavior, public/private result payloads, admin auth, and poll create/edit/delete flows.
- Add translated poll-authored content to the PocketBase data model if poll questions, descriptions, and answer labels need per-locale variants.

## I18n Implementation

The app uses a lightweight dictionary-based i18n layer without an external i18n
package.

- Supported locales live in `src/i18n/locales.ts`.
- UI dictionaries live in `src/i18n/dictionaries/en.json` and
  `src/i18n/dictionaries/es.json`.
- Page routes live under `src/app/[locale]/...`; API routes stay unprefixed
  under `src/app/api/...`.
- `src/proxy.ts` redirects unprefixed page routes to the remembered locale
  cookie or the default Spanish locale.
- Server Components load copy with `getDictionary(locale)`.
- Client Components receive translated labels from their parent Server
  Component.
- Date and time formatting uses the active locale through `src/lib/format.ts`.
- Admin validation returns stable error codes that pages map to localized
  messages.
- PocketBase-authored poll content remains in the language entered by the admin.

A package such as `next-intl` can still be introduced later if the app needs
richer client-side translation hooks, pluralization helpers, locale-aware
navigation wrappers, or more advanced routing behavior.

## Guardrails

- The app is local-first.
- The implementation must not assume, mention, or encode any non-local target.
- PocketBase is the only app data source for polls and submissions.
- Polls live in PocketBase, not in application code.
- Voters stay accountless and are identified by the `tiny_polls_voter_id` browser cookie.
- Public results are anonymous.
- Owner-only views may show voter details after PocketBase superuser login.
- Anything beyond local development is intentionally outside this repository.

## Local Pieces

- Next.js app for poll pages, voting, and results.
- Local PocketBase service for data and admin UI.
- PocketBase schema migrations in `pocketbase/pb_migrations`.
- PocketBase local data in `pocketbase/pb_data`.

## Local Config

Create `.env.local` from `.env.example`:

```text
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_SUPERUSER_EMAIL=you@example.com
POCKETBASE_SUPERUSER_PASSWORD=change-this-pocketbase-password
PORT=3000
```

## Run Locally

Start PocketBase:

```text
cd pocketbase
./pocketbase serve
```

Start Tiny Polls in another terminal:

```text
nub run dev
```

Open a poll link:

```text
http://127.0.0.1:3000/polls/baby-guess-stage-1
```

## Reference Routes

```text
/<locale>
/<locale>/polls/<codename>
/<locale>/polls/<codename>/results
/<locale>/admin
/<locale>/admin/login
/<locale>/admin/polls/new
/<locale>/admin/polls/<codename>/edit
/<locale>/owner/<codename>
```

## PocketBase Files

Schema migrations live in:

```text
pocketbase/pb_migrations
```

Local PocketBase data lives in:

```text
pocketbase/pb_data
```

Keep `pocketbase/pb_data` backed up if the local data matters.

## Railway PocketBase Service

Create a second Railway service for PocketBase using the `pocketbase` directory
as the service root. The service should build from:

```text
pocketbase/Dockerfile
```

The image downloads the Linux PocketBase binary, copies
`pocketbase/pb_migrations`, runs migrations on startup, optionally upserts a
superuser, and starts PocketBase with:

```text
./pocketbase serve --http=0.0.0.0:${PORT:-8090} --dir=/pb/pb_data --migrationsDir=/pb/pb_migrations
```

Mount a Railway volume at:

```text
/pb/pb_data
```

Point the Next.js service at the PocketBase service URL:

```text
POCKETBASE_URL=https://<your-pocketbase-service>.up.railway.app
```

Set these on both the PocketBase service and the Next.js service so the app can
authenticate with PocketBase:

```text
POCKETBASE_SUPERUSER_EMAIL=you@example.com
POCKETBASE_SUPERUSER_PASSWORD=change-this-pocketbase-password
```

## Troubleshooting

If voting fails with a PocketBase validation error for `isCorrect`, restart
PocketBase from the `pocketbase` directory so the latest migrations run against
the local `pb_data` database:

```text
cd pocketbase
./pocketbase serve
```
