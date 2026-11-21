<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## House viewer
- Keep storey dimensions and stair connectivity in `src/lib/house-layout.ts`; a shared layout makes interior geometry and tests agree.
- Open storeys by clicking the house: vertically clip the unchanged facade into animated slices and lift all upper layers by the same offset, creating a single gap; keep the selected furnished cutaway at its original elevation.
- Retain a stationary clipped copy of the selected facade with view-facing surfaces translucent and opposite surfaces opaque; material changes apply only to this copy so the closed exterior remains unchanged.
- Use shared circulation and floor-plate geometry with a side passage, rear landing and room openings outside the stair run; stacked flights must never obstruct the route from an arrival landing to rooms.
- Load CC0 furniture from local asset pointers, clone cached GLB scenes and normalize their bounds per instance; shared cached objects must never be mutated.
- Read new 3D material colors from `--house-*` global CSS tokens; the viewer and interior share a semantic palette.
- Keep heating variants and equipment dimensions in `src/lib/house-layout.ts`, pass the selected mode from the viewer to the interior and connect each source to the shared tank at its actual height; this preserves scale and plumbing when switching modes.
- Keep heat distribution independent of the heat source in viewer state and derive radiator placement through `radiatorsForLevel`; one choice then applies to every residential floor without changing the basement equipment. Verify actual mounted radiators via `data-radiator-count` after `data-system-ready="<level>-<system>"`.
