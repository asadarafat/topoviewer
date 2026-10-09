## What This Demonstrates

A two-spine, four-leaf fabric carries one authored tenant route from API A to
DB D. Twelve physical links remain separate from the four rendered segments
of `tenant-42-api-db`. The route is illustrative; it is not a packet capture,
an ECMP decision, or live telemetry.

## Expected Result

Ten navy device cards form a symmetric fabric above four rack groups. Violet
T42 badges identify the two tenant endpoints. A teal directional path follows
API A → Leaf 1 → Spine 1 → Leaf 4 → DB D. The other spine remains connected.
Port labels and utilization start hidden. Enable both Display controls to see
the two selected uplinks' ports and the API access link's authored utilization:
18% toward Leaf 1 and 4% toward API A. Generic link and path names stay hidden.

## What To Inspect

- Disable **Tenant 42 route**: all four path segments disappear while ten nodes,
  twelve physical links, and four racks remain.
- Disable **Sample utilization**: directional strokes and their values disappear
  without removing the API access link. **Port labels** controls endpoint labels.
- Click the teal path to focus its five-node sequence. Unrelated fabric objects
  dim. Click empty canvas or **Attention > Clear** to restore the full view.

## Source Contract

`topology.yaml` owns node IDs, ports, direction samples, rack membership, and the
ordered tenant path. `stylesheet.yaml` owns the manual layout and all appearance.
No mapper or live data source is needed. The public walkthrough is
`examples/use-cases/follow-a-packet.md`.

The graph ID is `fabric-journey`. Node IDs are `spine-1`, `spine-2`, `leaf-1`
through `leaf-4`, `api-a`, `worker-b`, `cache-c`, and `db-d`. Rack IDs are
`rack-01` through `rack-04`. The sampled link is `api-a-leaf-1`.

## Use When

Use this example to explain physical connectivity versus a selected logical
route, or as a small starting point for a fabric diagram. For runtime metrics,
replace the authored direction values with mapper-driven overlays in the
consuming application; do not pretend these sample values are measurements.
