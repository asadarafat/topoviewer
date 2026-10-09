# Payments Across Three Metros

A payment leaves Frankfurt, crosses Amsterdam, and reaches London. Follow the
cyan service route, inspect the failed circuit, then see the same service use
its protection route. The cards keep the same IDs and positions across all
three views.

**Simulated scenario.** These are authored snapshots with illustrative metrics.
TopoViewer displays the supplied paths and state; it does not calculate a
reroute or receive live telemetry in this example.

=== "Normal · 14:02"

    Payments uses AMS primary: **12 ms transport, 42 ms API p95**. The dashed
    grey circuits through AMS protection are available but unused.

    ```topoviewer
    topology: examples/integration/payments-journey/topology.yaml
    stylesheet: examples/integration/payments-journey/stylesheet.yaml
    height: 640px
    controls: true
    controlsOpen: false
    title: Payments · normal primary route
    selectedLayerIds: [service, transport, notes]
    ```

=== "Degraded · 14:07"

    The Amsterdam–London primary circuit has **signal loss**. The amber service
    path records the impacted route; it does not claim packets still traverse
    the failed segment. Retries raise the illustrative API p95 to **860 ms**.

    ```topoviewer
    topology: examples/integration/payments-journey/degraded.yaml
    stylesheet: examples/integration/payments-journey/stylesheet.yaml
    height: 640px
    controls: true
    controlsOpen: false
    title: Payments · primary circuit degraded
    selectedLayerIds: [service, transport, notes]
    ```

=== "Recovered · 14:09"

    The authored service path now uses AMS protection: **18 ms transport,
    58 ms API p95**. Payments is restored, while the original red circuit
    remains down. Service recovery and circuit repair are separate events.

    ```topoviewer
    topology: examples/integration/payments-journey/recovered.yaml
    stylesheet: examples/integration/payments-journey/stylesheet.yaml
    height: 640px
    controls: true
    controlsOpen: false
    title: Payments · service recovered on protection
    selectedLayerIds: [service, transport, notes]
    ```

## Read The View

| Visual cue | Meaning |
|---|---|
| Cyan or teal arrows | The authored Payments service route. |
| Dashed grey circuits | The alternate transport corridor. |
| Amber route and card outlines | Service impact in the degraded snapshot. |
| Red dashed circuit | Signal loss on the primary Amsterdam–London segment. |
| Metro boundaries | Frankfurt, Amsterdam, and London membership. |

The service route is emphasized by default. Transport circuits stay subdued,
while the unused route's card remains readable. Clicking an object dims the
surrounding context. Titles, subtitles, the snapshot note, and line patterns
carry the state alongside color.

## Three Things To Try

1. **Compare the incident with recovery.** Switch from Degraded to Recovered.
   Follow the route through `ams-primary`, then `ams-protection`. Notice that
   `primary-east` remains red even after the API recovers. The route ID stays
   `payments-route`; its ordered node sequence changes.
2. **Inspect one circuit.** In Degraded, click the red Amsterdam–London segment.
   It becomes the focus. Click empty canvas to restore the default service
   route. To read circuit names, open the viewer controls and enable
   **Circuit labels**.
3. **Separate service from infrastructure.** In Normal, open the controls and
   turn off **Transport circuits**. The cyan service path and its nodes remain.
   Turn Transport circuits back on to compare the chosen route with the
   protection corridor. This changes visibility, not the source topology.

## Open Your Own Copy

[Download the source ZIP](../../../assets/gallery/payments.zip) or
[download the Studio archive](../../../assets/gallery/payments.tvstudio).
Import the archive through Studio's **Project menu > Open archive**.
The normal snapshot is the starting topology; the source ZIP also includes
`degraded.yaml` and `recovered.yaml` for comparison. To use either snapshot in
Studio, replace the topology document with that file's contents and Apply.
Keep the shared stylesheet.

The bundle is self-contained: its small SVG icons are inline. Keep the object
IDs when replacing the example locations, service, or metrics. Follow
[Validate YAML](../../author/validate-yaml.md) before publishing your changes.

??? example "Normal topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/payments-journey/topology.yaml"
    ```

??? example "Shared stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/payments-journey/stylesheet.yaml"
    ```

## Explore The Provider Layers

For smaller examples that isolate a single network concept, continue with:

### Underlay

[Inspect the physical core and metro boundaries](./service-provider-network/underlay/index.md).

### BGP

[Add route-reflector sessions over the underlay](./service-provider-network/bgp/index.md).

### Transport Layer

[Show an SR transport carrier](./service-provider-network/transport-layer/index.md).

### Service Path

[Trace a child L3VPN lane over its carrier](./service-provider-network/service-path/index.md).

### Failure View

[Focus operational severity](./service-provider-network/failure-view/index.md).
