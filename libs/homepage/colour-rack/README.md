# colour-rack

The homepage serves the generated `src/assets/colors.json` at `assets/colour-rack/colors.json`.
The export reads the Two Thin Coats paint and match snapshots in
`libs/stream-overlay/paint-data-access/data`. Edit paint details and comparison names in those snapshots.
Comparison names appear in brand order GW, VGC, AP, followed by any remaining names in alphabetical order.
Edit `tools/rack-layout.json` when paints change physical positions. Its SKU order determines the displayed
row and column, with twelve slots per row. A catalog paint appears in the rack once its SKU is in the layout.

Run these commands from the workspace root.

- `npm exec -- nx run colour-rack:export-assets` regenerates the asset. Commit it with the source changes.
- `npm exec -- nx run colour-rack:verify-assets` compares the committed asset to a fresh export without writing. CI runs the same check.
- `npm exec -- nx test colour-rack` runs the mapping and feature tests.
