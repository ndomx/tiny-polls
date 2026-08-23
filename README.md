# Tiny Polls

A tiny local-first poll app backed by PocketBase.

## Requirement Status

| Requirement | Current state |
| --- | --- |
| Anonymous users can open a previously created poll and vote if the poll is still open. | Implemented. Public poll links at `/polls/<codename>` load polls from PocketBase, and the vote API rejects closed, draft, expired, or missing polls. |
| The app is shared only with close contacts and does not need heavy security focus. | Reflected in the current design. Polls are private by unlisted link, voters do not need accounts, and admin data access currently uses local server-side PocketBase credentials. |
| Admin can access all polls and see voter info. | Partially implemented. PocketBase Admin UI can access all `polls` and `submissions`. The Tiny Polls app has a per-poll owner dashboard at `/owner/<codename>` that shows voter names, short voter IDs, answers, correctness, submission time, and source data after admin login. It does not yet have an in-app admin page that lists all polls. |
| Admin-exclusive pages must be protected behind PocketBase auth. | Implemented for the existing owner dashboard and owner API. Admins sign in at `/admin/login` using PocketBase superuser credentials, and the app stores the PocketBase token in an `httpOnly` cookie. |
| Admin needs a way to submit new polls. For now, polls are multiple-selection questions with a single correct answer. | Partially implemented. The PocketBase schema supports poll records with JSON options, `minSelections`, `maxSelections`, and `correctAnswerIds`; the seeded poll is a single-answer multiple-choice poll. There is not yet an in-app admin form/API for creating polls. |

## Implemented Features

- Public poll pages are available at `/polls/<codename>`.
- Anonymous voters are identified by the `tiny_polls_voter_id` browser cookie.
- Voters provide a display name before submitting.
- Votes can be updated from the same browser as long as the poll remains open.
- Polls support configurable options, status, close time, minimum selections, maximum selections, and correct answer IDs.
- The current UI supports single-answer polls with radio buttons and multi-answer polls with checkboxes.
- Vote submissions store selected option IDs, voter name, voter ID, source, UTM fields, user agent, correctness, and submission time.
- Public results at `/polls/<codename>/results` are anonymous and auto-refresh.
- Results include current counts, percentages, and a simple history chart.
- Owner results include private submission details and source breakdowns.
- Admin login and logout are available at `/admin/login`.
- Existing owner pages and owner APIs are protected by a PocketBase-authenticated admin session.
- Owner pages include generated share links for `family`, `friends`, and `group` source tracking.
- PocketBase migrations create the required `polls` and `submissions` collections and seed one local demo poll.

## Missing Work

- Add an in-app admin poll list so an admin can access all polls without knowing each codename.
- Add an in-app poll creation form/API for single-correct-answer multiple-choice polls.
- Add validation for new poll creation, including unique codenames, at least two options, exactly one correct answer, and `minSelections`/`maxSelections` rules.
- Decide whether the in-app admin should manage poll status changes, close times, and edits after creation.
- Consider replacing superuser-backed app login with a dedicated PocketBase `admins` auth collection before the admin surface grows.
- Add tests around closed-poll rejection, duplicate-voter update behavior, public/private result payloads, and future admin auth/create flows.

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
/polls/<codename>
/polls/<codename>/results
/admin/login
/owner/<codename>
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

## Troubleshooting

If voting fails with a PocketBase validation error for `isCorrect`, restart
PocketBase from the `pocketbase` directory so the latest migrations run against
the local `pb_data` database:

```text
cd pocketbase
./pocketbase serve
```
