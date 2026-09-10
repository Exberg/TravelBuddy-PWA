# TravelBuddy

## Project Setup

- Never manually recreate framework boilerplate or template files when an official project generator exists.
- Check the framework's current official documentation and use its recommended CLI or scaffolding command.
- After scaffolding, modify the generated files as needed for TravelBuddy.

## Frontend

- Build the mobile app with React Vite PWA, using `@assistant-ui/eve` for the chat UI.
- Use `DESIGN.md` as your main reference for designs

## Backend

- Build the agent backend with Eve. Eve owns agent instructions, durable sessions and conversation history, tools, approvals, subagents, schedules, and event streaming.
- Use Vercel AI SDK model providers inside Eve when needed, but do not replace Eve's session or orchestration layer with the AI SDK unless explicitly requested.

## Testing

- Run non-interactive validation such as type checks, linting, tests, and production builds when appropriate.
- Do not open a browser, live preview, screenshot, or visually inspect the application yourself.
- After implementation and automated validation are complete, stop and wait for user feedback before making further visual changes.

## Agent behavior and evals

- Before changing Eve instructions, tools, or evals, inspect recent real application sessions with `cd backend && bun run sessions:latest` or `bun run sessions:list`.
- Use real session evidence to identify undesirable agent behavior, then encode that behavior as a repeatable Eve eval before changing the agent.
- Keep local session traces and eval artifacts out of the TravelBuddy model context. They are developer evidence for the coding agent, not instructions or examples for the agent under test.

## Git and PRs

- Do not create commits, branches, push changes, or open pull requests unless explicitly requested by the user.
