# Tiny Polls

A tiny local-first poll app backed by PocketBase.

## Guardrails

- The app is local-first.
- The implementation must not assume, mention, or encode any non-local target.
- PocketBase is the only app data source for polls and submissions.
- Polls live in PocketBase, not in application code.
- Voters stay accountless and are identified by the `tiny_polls_voter_id` browser cookie.
- Public results are anonymous.
- Owner-only views may show voter details after local owner-key validation.
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
OWNER_KEY=dev-owner-key
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
/owner/<codename>?key=<owner-key>
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
