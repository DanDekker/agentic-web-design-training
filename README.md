# Loom — Desktop / Weaver Curriculum 1M Agentic Tasks & Monochrome Suite

A modern, minimalist monochrome web application built entirely with **vanilla JavaScript, Bun, HTML, and CSS**. Zero frontend frameworks, zero runtime npm dependencies, zero build step.

```bash
bun run start   # http://localhost:3000
bun run dev     # same, with --watch
bun test        # 26 pass, 0 fail (auth, oauth, store, api, curriculum)
```

---

## Architecture

```
src/
  auth.js         1st-party authentication (Bun.password hashing, cryptographically secure sessions)
  oauth.js        1st-party OAuth 2.0 & OIDC provider (PKCE S256, Code, Token, Userinfo, Revocation)
  curriculum.js   Weaver 1M Agentic Curriculum refactoring challenges & automated verifier
  store.js        Multi-board task store, atomic JSON writes, corrupt-file quarantine
  api.js          Pure Request → Response route handlers
  events.js       Server-Sent Events (SSE) live multi-tab & multi-agent synchronization
  static.js       Static file server with directory traversal protection
  server.js       Bun.serve integrating API, OAuth, and static assets
public/
  index.html      Semantic HTML5 monochrome layout & modals
  styles.css      Monochrome design system (light + dark mode, editorial typography, code pre)
  app.js          Reactive client state, boards, refactor inspector, auth, and PKCE simulator
tests/
  store.test.js       Task store persistence, validation, reordering
  api.test.js         API routes, lifecycle, validation, status codes
  auth_oauth.test.js  Proprietary Auth + OAuth 2.0 PKCE & client_credentials flows
  curriculum.test.js  Weaver refactoring curriculum tasks & code verification
```

---

## 1st-Party Proprietary Authentication

Built-in proprietary authentication system using `Bun.password` (bcrypt/argon2id) and cryptographically secure 256-bit hex session tokens.

- `POST /api/auth/register` — Register a new account (`username`, `password`, `displayName`).
- `POST /api/auth/login` — Login, returns session token and sets `loom_session` HttpOnly cookie.
- `POST /api/auth/logout` — Revokes active session and clears auth cookie.
- `GET /api/auth/me` — Returns current authenticated user and role.
- Supports both `Authorization: Bearer <token>` and `Cookie: loom_session=<token>`.

### Pre-Configured Accounts:
- **Weaver Agent**: `weaver` / `weaver-agent-2026` (role: `agent`)
- **Lead Architect**: `pp` / `curriculum-1m` (role: `admin`)

---

## 1st-Party Proprietary OAuth 2.0 & OIDC Provider

Full RFC 6749 and RFC 7636 OAuth 2.0 Authorization Server:

- `GET /.well-known/openid-configuration` — OIDC discovery metadata.
- `GET /oauth/authorize` — Interactive monochrome consent screen supporting PKCE (`code_challenge`, `code_challenge_method=S256`).
- `POST /oauth/authorize/decision` — Processes user consent and issues authorization code.
- `POST /oauth/token` — Exchange authorization code for Bearer `access_token` and `refresh_token` (with PKCE `code_verifier` validation).
- `POST /oauth/token` — Machine-to-machine `grant_type=client_credentials`.
- `GET /oauth/userinfo` — Validates Bearer access token and returns user claims.
- `POST /oauth/revoke` — Revokes access or refresh tokens.
- `GET /oauth/clients` — Lists registered clients (e.g. `weaver-agent-runner`, `desktop-curriculum-suite`).

---

## Weaver 1M Refactoring Curriculum Tasks

Designed for training and evaluating autonomous desktop and weaver agents:

1. **Async Pipeline**: Refactor nested callback hell into an idiomatic `async/await` pipeline with `Promise.all`.
2. **DOM Memory Leak**: Eliminate unbounded event listener subscriptions using `AbortController` signals.
3. **Algorithm Optimization**: Optimize $O(N^2)$ nested loop lookups into $O(N)$ indexed `Map` lookups.
4. **CSS Modernization**: Migrate legacy float & clearfix layouts to responsive CSS Grid & monochrome semantic tokens.
5. **Security Hardening**: Protect deep merge utilities against prototype pollution (`__proto__`, `constructor`) and ReDoS.
6. **Architecture**: Extract pure reducer state machines from tangled god-object components.

### Automated Verification:
- Built-in Refactor Inspector modal with starter code, solution code, and interactive live test runner.
- `POST /api/curriculum/verify` evaluates submitted code against AST and behavioural criteria.

---

## Keyboard Navigation

| Key | Action |
| --- | --- |
| `⌘K` / `Ctrl+K` | Open Command Palette |
| `N` / `/` | New Task / Focus Search |
| `J` / `K` | Move focus down / up |
| `X` | Toggle task completion |
| `Enter` | Edit task title |
| `R` | Open Refactor Inspector or Seed Curriculum |
| `O` | Open OAuth 2.0 Applications & Simulator |
| `T` | Toggle Light / Dark Monochrome Theme |
| `1` / `2` / `3` / `4` | Filter: All / Active / Done / Refactoring |
| `Delete` | Remove task |
