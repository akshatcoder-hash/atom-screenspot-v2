# mcp-use friction log

mcp-use 2.12.2 (latest stable as of 2026-11-06), @mcp-use/inspector 20.3.27, create-mcp-use-app 2.1.1, Node 24.21.0. Only things actually hit, each rechecked against the installed packages.

1. **View typing needs the tool to be exported, and the error does not say so.**
   Repro: with the generated `mcp-env.d.ts` (`tools: typeof import("./index.js")`), change `export const ground = server.tool(...)` to `const ground = server.tool(...)` and run `mcp-use typecheck`:
   ```
   views/ground/view.tsx(5,31): error TS2344: Type '"ground"' does not satisfy the constraint '"atom_health"'.
   views/ground/view.tsx(26,11): error TS2339: Property 'instruction' does not exist on type 'unknown'.
   ```
   The registry is built from the module's exports. mcp-use does document this in `dist/react/types/register.d.ts` ("only exported tool refs are accepted by typed React hooks"), but the error only says `"ground"` does not satisfy `"atom_health"` and never mentions `export`, and the template's `index.ts` and the create-mcp-use-app README export their tools without saying why. I hit this by dropping the template's `export`.

2. **Inspector: the tool Execute button has no accessible name in a narrow panel.**
   In `@mcp-use/inspector` 20.3.27 the button with `data-testid="tool-execution-execute-button"` has no `aria-label` or `title`, and its "Execute" label has the class `hidden @[700px]/tool-exec:inline`. When the tool panel is under 700px wide the button is icon-only, so `getByRole("button", { name: "Execute" })` finds nothing. The Payload and Save buttons next to it do set `title`. Checked in the shipped bundle, not in a browser.

3. **`mcp-use screenshot` cannot capture a view's error state.**
   Repro: `mcp-use screenshot --mcp http://127.0.0.1:3000/mcp --tool ground --json image_path=/abs/shot.png "instruction=click Save"` with the Atom API stopped exits 1 with `{"error":{"code":"tool_failed","message":"Tool ground returned an error.", ...}}` and writes no PNG. The view's error branch is the one I most wanted to check visually.

No problems with: build, the stateless HTTP transport, `isError` results next to an `outputSchema` (a thrown error in a tool callback becomes an `isError` result carrying the message), or view binding.
