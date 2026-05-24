## Workflow

- Enter plan mode for non-trivial tasks: 3+ steps, risky edits, migrations, or architectural decisions.
- Inspect relevant code and tests before editing.
- Write the plan to `tasks/todo.md` before coding.
- Re-plan if new information changes the approach.
- Do not mark work complete without verification.

## Task Tracking

- Maintain `tasks/todo.md` with checkable items.
- Mark items complete only after they are verified.
- Add a short results section for completed work.

## Lessons Learned

- After any user correction or preventable mistake, update `tasks/lessons.md`.
- Record the mistake, root cause, and preventative rule.

## Engineering Standards

- Prefer the simplest correct solution.
- Minimize code changes and blast radius.
- Fix root causes unless a temporary patch is explicitly requested.

## Verification

- Run relevant tests before completion.
- Check affected behavior, edge cases, and regressions.
- If verification cannot be completed, say so clearly and note the risk.
