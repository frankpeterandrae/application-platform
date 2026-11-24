# OBS browser sources

Add a separate **Browser** source in OBS for each widget you want to display. These URLs assume the UI is running on the OBS machine at port 4220.

| Widget        | Browser source URL                            | Starting width × height | Data                                      |
| ------------- | --------------------------------------------- | ----------------------- | ----------------------------------------- |
| Stream header | `http://localhost:4220/overlay/header`        | 640 × 128               | Dashboard stream title and subtitle       |
| Current paint | `http://localhost:4220/overlay/current-paint` | 480 × 144               | Dashboard and Stream Deck paint selection |
| Webcam frame  | `http://localhost:4220/overlay/webcam-frame`  | 320 × 240               | Static                                    |
| Scene frame   | `http://localhost:4220/overlay/scene-frame`   | 1920 × 1080             | Static                                    |

Run `npm exec -- nx serve stream-overlay-ui` to start the UI and its backend dependency. The live widgets connect to `ws://localhost:3000/ws` from the OBS machine. For a hosted UI, use its origin in the browser-source URLs and configure the host to serve the Angular entry point for direct widget URLs.

Use the table dimensions as starting points. Increase the width or height for longer titles or paint names, then scale the source to fit in OBS. Match the webcam frame dimensions to the cropped webcam's aspect ratio and the scene frame dimensions to the OBS base canvas. Place the webcam frame above the webcam and group the pair to move or scale them together. The widgets supply transparent page backgrounds without OBS-specific CSS. Replace any existing `/overlay` browser source with the individual URLs.

## Verify in OBS

1. Add all four sources and check that each shows only its own content, with transparent space and no scrollbars or clipped text at the chosen dimensions.
2. Move, scale and toggle each source independently. Move and scale the webcam group and verify that the frame stays aligned with the webcam.
3. Update the title and subtitle in the dashboard. Select and clear paint from the dashboard and Stream Deck. Check that both live widgets respond and that refreshing a live source restores the current backend state.
4. Compare OBS CPU usage, memory and rendering lag with the same scene and stream settings before and after the switch. Each loaded live widget uses one WebSocket. The frame sources use none. OBS keeps hidden browser sources loaded unless **Shutdown source when not visible** is enabled.

## Running unit tests

Run `npm exec -- nx test stream-overlay` for widget unit tests and `npm exec -- nx e2e stream-overlay-ui-e2e` for browser tests.
