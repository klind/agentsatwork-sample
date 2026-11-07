# Changelog

What changed in the API, newest first. Every pull request adds a line under Unreleased that says
what it changes for someone who uses the API. CI checks that it did.

## Unreleased

- `GET /tasks/count` also says what share of the tasks are done, as `donePercent`: a whole number from 0 to 100, rounded down, so 2 done out of 3 is 66. With no tasks it is 0. With `q` it counts only the tasks whose title contains it, like the other numbers. (#29)

- `GET /tasks/oldest` answers 200 with the task that is not done and was added first, in the same shape as `GET /tasks/:id`. Renaming or reopening a task does not change when it was added. When every task is done, or there are none, it answers 404 with `no open task`. (#27)
- `GET /tasks/count?q=milk` counts only the tasks whose title contains `milk`, ignoring case, in `total`, `done`, and `open` alike. An empty `q` is the same as no `q`. (#25)
- `DELETE /tasks` removes every task, done or not, and answers 200 with how many it removed, as `removed`. An empty list answers `{"removed": 0}`. Before, `DELETE /tasks` answered 405. (#23)
- `POST /tasks/complete-all` marks every task that is not done as done, and answers 200 with how many it changed, as `completed`. Tasks that are done already are left as they are and not counted. (#21)
- `POST /tasks/:id/toggle` marks a task that is not done as done, and a task that is done as not done, and answers with the task. An unknown id answers 404 with `not found`. (#19)
- No change to the API: `.agentsatwork.yml` tells AgentsAtWork how to measure test coverage. (#18)
- `GET /tasks?sort=-title` lists the tasks sorted by title, Z to A, ignoring case. It works with `done`, `q`, and `limit` the same way `sort=title` does. Any other `sort` now answers 400 with `sort must be title or -title`. (#17)
- `GET /tasks?sort=title` lists the tasks sorted by title, A to Z, ignoring case. It sorts what `done` and `q` leave, and `limit` takes the first ones after sorting. Any other `sort` answers 400 with `sort must be title`. (#16)
- `GET /tasks?limit=2` lists at most the first two tasks, in the usual order. It applies after `done` and `q`. A `limit` that is not a whole number above zero answers 400 with `limit must be a whole number above zero`. (#15)
- `GET /tasks?q=milk` lists only the tasks whose title contains `milk`, ignoring case. It works together with `done`, and an empty `q` is the same as no `q`. (#14)
- `GET /tasks/count` also says how many tasks are not done, as `open`, which is always `total - done`. (#13)
- No change to the API: CI also runs in the merge queue, so `main` can take its merges through one. (#12)
- `POST /tasks` and `PATCH /tasks/:id` refuse a title longer than 200 characters after trimming: they answer 400 with `title must be at most 200 characters` and change nothing. (#11)
- `POST /tasks/:id/reopen` marks a task that is done as not done, and answers with the task. A task that is not done is answered unchanged; an unknown id answers 404. (#10)
- No change to the API: AgentsAtWork marks a pull request it may merge by itself with the label `auto-merge`. (#9)
- `GET /tasks?done=true` or `?done=false` lists only the tasks that are done, or only those that are not. Any other value of `done` answers 400. (#8)
- `DELETE /tasks/done` removes every task that is done, and says how many it removed. (#6)
- `PATCH /tasks/:id` renames a task, body `{"title": "..."}`, and answers with the task. (#5) (#7)
- `GET /tasks/count` says how many tasks there are, and how many are done.
- CI checks that a pull request adds a line here that ends with its number. (#4)
