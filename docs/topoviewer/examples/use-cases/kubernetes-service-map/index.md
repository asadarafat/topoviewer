---
hide:
  - toc
---

# Kubernetes service map

## What Sits Behind This Endpoint?

Start with the browser's entry point, find the workload behind the API service,
then open the managed runtime. The overview keeps six cards visible until you
choose to reveal the detail.

**Authored walkthrough:** this compact view uses identities and selected
relationships from the captured EDA example below. It is a saved teaching model,
not live cluster inventory or an observed request trace.

```topoviewer
topology: examples/integration/endpoint-journey/topology.yaml
stylesheet: examples/integration/endpoint-journey/stylesheet.yaml
height: 620px
controls: true
controlsOpen: false
helperLines: false
title: What sits behind this endpoint?
```

Neutral links show service entry and a dashed **shared selector** comparison.
Teal marks **template match**, domain binding, and **Pod association**. Dashed
matching/association links do not assert traffic or ownership. Blue marks curated
control relationships; the dashed blue **runtime context** is an authored scope
connection, not a measured network call. Card subtitles name the object kind;
colors do not report health.

## Take The Three-Step Tour

1. **Follow the endpoint.** Read Browser → try-eda → eda-api → API workload.
   The two Services have a shared selector; they are alternate frontends, not
   successive HTTP hops. The last edge matches a Service selector to a
   Deployment Pod template. Services actually select **Pods**.
2. **Expand the managed runtime.** Click the **Managed runtime** summary card.
   Its badge counts three member objects. The region opens to show **leaf1**
   (TopoNode), **Simulator** (Deployment), and **leaf1 pod** (Pod), joined
   by **backed by** and dashed **Pod association** relationships. The
   intermediate ReplicaSet is omitted; no direct Deployment ownership is claimed. Eight cards are now visible.
3. **Return to the overview.** Click the expanded **Managed runtime** region
   to collapse it again. Open the viewer controls and turn the **Managed
   runtime** layer off: only the four endpoint/workload cards remain. Turn it
   on to restore the branch.

The source IDs remain unchanged while the view expands, collapses, or filters.
This is the useful distinction between an inventory list and a relationship
map: you can change the amount of detail without inventing new object identity.

## Use This Example

[Download the YAML bundle](../../../../assets/gallery/endpoint.zip) or
[open the portable Studio project](../../../../assets/gallery/endpoint.tvstudio)
by importing the downloaded archive into Studio. The bundle contains the
**authored overview**; the full captured map is separate below.

??? example "Copy the overview source"

    **topology.yaml**

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/endpoint-journey/topology.yaml"
    ```

    **stylesheet.yaml**

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/endpoint-journey/stylesheet.yaml"
    ```

## Explore The Full Captured Map

The larger example retains the Kubernetes service surface and topology runtime
from the curated EDA inventory snapshot. It includes more services, deployments,
Pods, and domain resources than the overview. The recorded status values describe
that saved snapshot; they are not a live health feed.

The upper layer is the Kubernetes control-plane view for the EDA system. Service
nodes represent Kubernetes `Service` objects. Deployment nodes represent
Kubernetes `Deployment` objects. Pod nodes represent runtime Pods. Teal
**template match** links show selector correspondence with Deployment Pod
templates. Services select Pods, not Deployments. Blue runtime links show
curated service dependencies, not measured traffic. The dashed **shared selector**
connector compares the two API frontends and does not claim forwarding.

The lower layer is the topology runtime view. The `NetworkTopology` resource
groups the `TopoNode` objects in this curated model for `leaf1`, `leaf2`, and `spine1`. Those
`TopoNode` objects are backed by simulator deployments and pods. NPP pods keep
control connectivity to the managed nodes.

Regions group the map into API/UI, identity and persistence, control engines,
applications and bootstrap services, topology runtime, and simulated fabric.
The captured map starts with six region summaries, so the overview remains
readable. The badge counts the captured objects in each region. Click a summary
to inspect its members; use **Fit View** after expanding and zoom in to read
individual resource names. Clicking an expanded region collapses it again.
Use the full inventory as detail, rather than interpreting every dependency
at once.

```topoviewer
topology: examples/integration/kubernetes-service-map/topology.yaml
stylesheet: examples/integration/kubernetes-service-map/stylesheet.yaml
height: 760px
controls: true
controlsOpen: false
title: Captured EDA regions — click to inspect
```

## Advanced: Build A Map From Your Inventory

The remaining sections show collection and conversion. You need a TopoViewer
repository checkout to run the bundled scripts, plus `kubectl` access to the
cluster you intend to inspect. Start with your own operational question and
review the resulting relationships before publishing them.

```topoviewer
topology: examples/integration/kubernetes-service-map/service-map-flow-topology.yaml
stylesheet: examples/integration/kubernetes-service-map/service-map-flow-stylesheet.yaml
height: 760px
controls: false
controlsOpen: false
title: Inventory to service map
```

The collection flow reads left to right across the upper row, then follows the
generated YAML down to the renderer and its controls on the lower row.

## Inventory Collection

Inventory collection means reading source-of-truth objects and preserving their
identity before anything is styled. For this example, the source inventory is:

- Kubernetes `Service`, `Deployment`, `ReplicaSet`, and `Pod` objects in the EDA namespace;
- Kubernetes selectors and ownership relationships;
- EDA custom resources such as topology and node objects;
- selected runtime facts, including ports, image names, readiness, and status.

The checked-in example is a captured and curated topology derived from that kind
of inventory. The scaffold below captures raw Kubernetes JSON and selected
custom resources. The fourth argument is an optional `kubectl api-resources`
regular expression, so the same pattern can collect other domain resources
without rewriting the script.

??? example "Inventory collection scaffold"

    ```bash
    --8<-- "docs/topoviewer/examples/integration/kubernetes-service-map/collect-eda-kubernetes-inventory.sh"
    ```

Run it against a kubeconfig that can read the EDA namespaces:

```bash
bash packages/topoviewer/content/examples/integration/kubernetes-service-map/collect-eda-kubernetes-inventory.sh eda-system eda
```

If `kubectl` is bundled inside a local control-plane container instead of
installed on the host, pass the command explicitly:

```bash
KUBECTL='docker exec eda-demo-control-plane kubectl' \
  bash packages/topoviewer/content/examples/integration/kubernetes-service-map/collect-eda-kubernetes-inventory.sh eda-system eda
```

Collect a different custom-resource family by changing the discovery pattern:

```bash
bash packages/topoviewer/content/examples/integration/kubernetes-service-map/collect-eda-kubernetes-inventory.sh \
  eda-system eda eda-kubernetes-inventory 'networktopolog|toponode|myresource'
```

Expected result:

```text
eda-kubernetes-inventory/
  services.json
  deployments.json
  pods.json
  workload-summary.txt
  eda-namespaced-resource-types.txt
  eda-cluster-resource-types.txt
  <discovered-eda-resource>.json
```

Those files are not the final TopoViewer model. They are the raw input.

## Converter Contract

The converter is a script. In a production integration it would normally be a
small CLI in the same repository as the collector, with tests around every
relationship rule. In this example it is intentionally kept under 101 lines so
the pattern is easy to copy, audit, and replace.

The zoom-in below shows the converter as a parent process. The contained steps
read the JSON snapshots, derive deterministic topology identity, derive
relationships and regions, and write the topology contract that TopoViewer can
validate.

```topoviewer
topology: examples/integration/kubernetes-service-map/converter-flow-topology.yaml
stylesheet: examples/integration/kubernetes-service-map/converter-flow-stylesheet.yaml
height: 600px
controls: false
controlsOpen: false
title: Converter zoom-in
attention:
  query:
    ids:
      - converter-script
      - read-snapshots
      - derive-identity
      - derive-relationships
      - derive-attention
    mode: dim-context
```

The converter is the deliberate boundary between the platform API and
TopoViewer. It writes `topology.yaml` only. It should not decide the visual
design. Its job is to preserve stable object identity and turn platform
relationships into a diagram model that can be validated. Colors, icons, labels,
and link emphasis stay in `stylesheet.yaml`.

For this example, a converter maps inventory into the topology contract like
this:

- object identity becomes `graph.nodes[].id`;
- object names become `graph.nodes[].labels.name`;
- object family and status become `labels`;
- ports, selectors, images, readiness, and status details become `data`;
- same-namespace Pod selection, inferred Pod-template correspondence, and
  captured owner references become `graph.links[]`;
- domain membership and runtime calls require additional source evidence;
- object families become `graph.regions[]`;
- Kubernetes and topology-runtime views become `graph.layers[]`;
- dense groups become `attention.aggregate.groups[]` so regions can collapse;
- visual policy stays in `stylesheet.yaml`, separate from collected facts.

??? example "Converter scaffold"

    ```javascript
    --8<-- "docs/topoviewer/examples/integration/kubernetes-service-map/convert-eda-kubernetes-inventory.mjs"
    ```

Run the scaffold against the inventory output:

```bash
node packages/topoviewer/content/examples/integration/kubernetes-service-map/convert-eda-kubernetes-inventory.mjs \
  eda-kubernetes-inventory \
  eda-kubernetes-inventory/topology.yaml
```

Pair the collected `topology.yaml` with
[`inventory-stylesheet.yaml`](../../integration/kubernetes-service-map/inventory-stylesheet.yaml).
That stylesheet covers captured Services, Deployments, ReplicaSets, Pods, and
custom resources. The teaching snapshot uses `stylesheet.yaml` and its curated
associations instead.

The generated topology is intentionally deterministic. Re-running the converter
against the same inventory should produce the same IDs, links, regions, and
attention groups. That makes the output reviewable in Git and usable in CI.

That separation matters. The same collected facts can be rendered as a compact
service dependency map, a Kubernetes inventory view, a topology runtime view, or
a Grafana overlay target without rewriting the source inventory. Layer hiding
uses the generated `graph.layers[]`; collapse and expand behavior uses the
generated `attention.aggregate` groups.

## Reusing The Pattern

Start with the operational question the map must answer. For this example, the
question is how an operator-facing EDA endpoint connects to the Kubernetes
workloads and topology runtime behind it.

For another platform, use the same sequence:

1. collect the standard Kubernetes objects and the domain-specific resources;
2. preserve stable object IDs so links and telemetry can attach later;
3. derive Pod selection from same-namespace selectors and ownership from
   captured `metadata.ownerReferences` UIDs; label template correspondence
   separately and avoid inventing domain containment or runtime calls;
4. keep raw source facts in `labels` and `data`;
5. style object families separately from source facts;
6. use layers and collapsible regions to keep the view usable as the system
   grows.

TopoViewer becomes useful when the map explains the system shape without
forcing the reader to reconstruct it from tables, command output, or screenshots.

## Relationship Evidence

The saved diagram is curated: its domain containment, bindings, and service
calls are teaching associations rather than verified owner references or traces.
The dashed Deployment-to-Pod associations omit ReplicaSets. Kubernetes
[Services select Pods](https://kubernetes.io/docs/concepts/services-networking/service/);
[Deployments manage ReplicaSets](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/),
which in turn manage Pods.

The collector includes ReplicaSets. The converter creates Service-to-Pod
selector links only within the same namespace, marks Service-to-Deployment
Pod-template matches as inferred, and derives ownership only from captured UID
references to present objects. It does not turn matching workload labels into
ownership or connect every NetworkTopology to every TopoNode. Missing owners and
selectorless Services remain unlinked; actual endpoints for selectorless Services
would require EndpointSlice inventory, which this collector does not include.
Pod readiness requires its `Ready` condition; a `Running` phase alone is not
readiness. Missing status remains `unknown`, and a Deployment scaled to zero is
marked `scaled-down`.
