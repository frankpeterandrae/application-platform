# colour-rack

The homepage serves the generated `src/assets/colors.json` at `assets/colour-rack/colors.json`.
The export reads the Two Thin Coats paint and match snapshots in
`libs/stream-overlay/paint-data-access/data`. Edit paint details and comparison names in those snapshots.
Comparison names appear in brand order GW, VGC, AP, followed by any remaining names in alphabetical order.
Edit `tools/rack-layout.json` when paints change physical positions. Its SKU order determines the displayed
row and column, with twelve slots per row. A catalog paint appears in the rack once its SKU is in the layout.

Run these commands from the workspace root.

- `npm exec -- nx run colour-rack:export-assets` regenerates the asset. Commit it with the source changes.
- `npm exec -- nx run colour-rack:verify-assets` compares the data and layout order with a fresh export without writing. CI runs the same check.
- `npm exec -- nx test colour-rack` runs the mapping and feature tests.

## Homepage and demo

The homepage exposes the rack at `/paint-rack`. The demo app exposes the same feature and
serves the same export at `/demo/paint-rack` after starting `npm exec -- nx serve demo`.

The search matches names, comparison names, SKUs and barcodes. Rack order is the default.
Selecting alphabetical order keeps the physical row and column shown on each card.
The grid adapts its column count to the available width and renders up to 48 cards per page.

For a demo walkthrough, search for `Word Bearers Red` to find Berserker Red by its comparison
name. Open its details with Enter and close them with Escape. Clear the search, switch to
name order and go to the next page. Resize the viewport and check that cards wrap and
remain reachable by scrolling or by using Tab.
