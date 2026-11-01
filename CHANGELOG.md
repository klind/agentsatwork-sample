# Changelog

What changed in the API, newest first. Every pull request adds a line under Unreleased that says
what it changes for someone who uses the API. CI checks that it did.

## Unreleased

- `GET /tasks?done=true` or `?done=false` lists only the tasks that are done, or only those that are not. Any other value of `done` answers 400. (#8)
- `DELETE /tasks/done` removes every task that is done, and says how many it removed. (#6)
- `PATCH /tasks/:id` renames a task, body `{"title": "..."}`, and answers with the task. (#5) (#7)
- `GET /tasks/count` says how many tasks there are, and how many are done.
- CI checks that a pull request adds a line here that ends with its number. (#4)
