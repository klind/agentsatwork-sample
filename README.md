# agentsatwork-sample

A small task list API over HTTP, kept in memory. It is the sample target repository for
AgentsAtWork: the repository the pipeline opens pull requests against in its own end-to-end test
and in an adopter's first run. It is small on purpose, so a job is cheap and fast.

## The API

| Method | Path | What it does |
|---|---|---|
| GET | `/health` | Says the server is up |
| GET | `/tasks` | Lists every task. Takes `?done=true` or `?done=false` to list only the tasks that are done, or only those that are not. Takes `?q=...` to list only the tasks whose title contains it, ignoring case; it works together with `done`, and an empty `q` is ignored. Takes `?sort=title` to sort those by title, A to Z, ignoring case, or `?sort=-title` to sort them Z to A; any other `sort` answers 400. Takes `?limit=n` to list at most the first `n` of those, after `done`, `q`, and `sort`; a `limit` that is not a whole number above zero answers 400 |
| POST | `/tasks` | Adds a task, body `{"title": "..."}` |
| GET | `/tasks/count` | Says how many tasks there are, how many are done, and how many are not: `{"total": n, "done": d, "open": o}` |
| DELETE | `/tasks/done` | Removes every task that is done, and says how many |
| GET | `/tasks/:id` | Returns one task |
| PATCH | `/tasks/:id` | Changes a task's title, body `{"title": "..."}` |
| POST | `/tasks/:id/complete` | Marks a task done |
| POST | `/tasks/:id/reopen` | Marks a task not done |
| DELETE | `/tasks/:id` | Removes a task |

A title is at most 200 characters, after leading and trailing spaces are trimmed. Adding or
renaming a task with a longer title answers 400 and changes nothing.

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
