# agentsatwork-sample

A small task list API over HTTP, kept in memory. It is the sample target repository for
AgentsAtWork: the repository the pipeline opens pull requests against in its own end-to-end test
and in an adopter's first run. It is small on purpose, so a job is cheap and fast.

## The API

| Method | Path | What it does |
|---|---|---|
| GET | `/health` | Says the server is up |
| GET | `/tasks` | Lists every task |
| POST | `/tasks` | Adds a task, body `{"title": "..."}` |
| GET | `/tasks/count` | Says how many tasks there are, and how many are done |
| GET | `/tasks/:id` | Returns one task |
| POST | `/tasks/:id/complete` | Marks a task done |
| POST | `/tasks/:id/reopen` | Marks a task not done again |
| DELETE | `/tasks/:id` | Removes a task |

## Working on it

Node 24 or newer. The source is TypeScript and runs as it is; there is no compile step.

```
npm ci
npm run build    # type-checks the source and the tests
npm test
npm start        # serves on http://localhost:3000, or the port in PORT
```

## How AgentsAtWork sees it

`.agentsatwork.yml` at the root states the stack, the base branch, and the build and test
commands. CI (`.github/workflows/ci.yml`) runs the same build and tests on every pull request, as
the check named `build`.
