# Mega Lorem Ipsum

A data table with full CRUD, sorting, live filtering, pagination and shareable URL state. Built with vanilla HTML, CSS and JavaScript on the client (no framework, no build step, no dependencies) and a small Express + SQLite REST API on the server.

## Running it

**Requires Node 22 or newer** (check with `node -v`). Node 20 is end of life
and the SQLite driver no longer ships prebuilt binaries for it, which forces
a source build requiring Python and C++ build tools.

```bash
npm install
npm run seed                          # creates data.db with 200 records
npm start                             # http://localhost:3000
```

`better-sqlite3` is a native module. Recent npm versions block install scripts by default and print a warning; the `approve-scripts` line above resolves it. If the app starts and the table loads, the build succeeded.

Other scripts:

```bash
npm run dev    # same as start, with file watching
npm test       # runs the full test suite
```

## Requirements

| # | Requirement | Where |
|---|---|---|
| 1 | Table (5+ columns, 200 records), add / edit / delete with confirmation | 8 columns, seeded via faker, dialogs in `modal.js` |
| 2 | Arbitrary cell content | All rendering uses `textContent`, never `innerHTML` |
| 3 | Close via ESC, X, or outside click | Native `<dialog>` handles ESC; X and backdrop wired in `modal.js` |
| 4 | Content must not move when the pop-up opens | `scrollbar-gutter: stable` plus a CSS-only scroll lock |
| 5 | Animated open and close | `@starting-style` with `transition-behavior: allow-discrete` |
| 6 | URL transferable, reopens the same state | `urlstate.js` plus History API wiring |
| 7 | Responsive (mobile ready) | Horizontal scroll container, stacked toolbar and form below breakpoints |
| 8 | No jQuery | No client dependencies at all |
| 9 | Sortable columns plus live text filter | Server-side, debounced at 300ms |
| 10 | Required-field validation with inline errors | Shared validator, errors rendered per field |
| 11 | Keyboard accessible pop-up, focus trapped and returned | Native `<dialog>`, focus restored on close |

## Structure

```
server/
  db.js          opens SQLite, creates the schema on import
  seed.js        200 faker records, deterministic (seed 42)
  routes.js      the five REST endpoints
  app.js         express app (no listener, so tests can import it)
  index.js       starts the listener
public/
  index.html
  styles.css
  js/
    constants.js categories, statuses, sortable columns
    validate.js  shared validation, imported by both client and server
    api.js       the only file that knows fetch exists
    urlstate.js  URL <-> state, pure functions
    modal.js     both dialogs
    table.js     state, rendering, event wiring
tests/
```

### API

| Method | Path | Success | Errors |
|---|---|---|---|
| GET | `/api/items?page&per_page&sort&order&q` | 200 | 400 invalid sort |
| GET | `/api/items/:id` | 200 | 404 |
| POST | `/api/items` | 201 | 422 |
| PATCH | `/api/items/:id` | 200 | 404, 422 |
| DELETE | `/api/items/:id` | 204 | 404 |

Every response uses one of two envelopes:

```json
{ "data": [], "meta": { "page": 1, "per_page": 25, "total": 200, "total_pages": 8 } }
{ "error": { "message": "Validation failed", "fields": { "name": "Name is required" } } }
```

The `fields` object maps directly onto the form's input names, so a 422 renders as inline errors with a single loop.