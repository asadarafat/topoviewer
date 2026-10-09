---
hide:
  - toc
---
<!-- Generated from packages/topoviewer/content/gallery.json by scripts/sync-gallery.mjs. -->
# Explore what your topology can tell you

<p class="tv-gallery-intro">Trace a service across a network. Follow a packet through a fabric. Unfold the workloads behind an endpoint. Start with a question, then explore the diagram.</p>

<nav class="tv-gallery-links" aria-label="Browse examples"><a href="#guided-scenarios">Guided scenarios</a><a href="#patterns-to-borrow">Patterns to borrow</a><a href="../start/first-topology/">Build your first diagram</a></nav>

## Guided Scenarios

Three small investigations, with live diagrams, things to try, and source files to keep.

<div class="tv-gallery-grid">
<a class="tv-gallery-card tv-gallery-featured" href="use-cases/service-provider-network/">
  <img src="../../assets/gallery/payments.png" alt="" width="1120" height="640" loading="eager">
  <div class="tv-gallery-card-body">
    <span class="tv-gallery-eyebrow">01 / Service provider</span>
    <h3>Payments across three metros</h3>
    <p>A fiber cut. One customer service. Follow the impact and compare the recovery route.</p>
    <span class="tv-gallery-action">Trace the service <span aria-hidden="true">↗</span></span>
  </div>
</a>
<a class="tv-gallery-card tv-gallery-featured" href="use-cases/follow-a-packet/">
  <img src="../../assets/gallery/fabric.png" alt="" width="1120" height="620" loading="eager">
  <div class="tv-gallery-card-body">
    <span class="tv-gallery-eyebrow">02 / Data center</span>
    <h3>Follow a packet through the fabric</h3>
    <p>See the tenant journey inside a spine–leaf fabric, then reveal ports and traffic directions.</p>
    <span class="tv-gallery-action">Follow the packet <span aria-hidden="true">↗</span></span>
  </div>
</a>
<a class="tv-gallery-card tv-gallery-featured" href="use-cases/kubernetes-service-map/">
  <img src="../../assets/gallery/endpoint.png" alt="" width="1120" height="620" loading="eager">
  <div class="tv-gallery-card-body">
    <span class="tv-gallery-eyebrow">03 / Kubernetes</span>
    <h3>What sits behind this endpoint?</h3>
    <p>Start at the entry point. Unfold its workloads and discover the infrastructure they manage.</p>
    <span class="tv-gallery-action">Explore the service map <span aria-hidden="true">↗</span></span>
  </div>
</a>
</div>

<p class="tv-gallery-note">These are reproducible examples with authored states. Each walkthrough explains its data and assumptions. Download the YAML bundle or import its <code>.tvstudio</code> archive to make it your own.</p>

## Patterns To Borrow

Learn one visual technique, then bring it into your own diagram.

<div class="tv-gallery-grid tv-gallery-patterns">
<a class="tv-gallery-card" href="nodes/card-node-layout/">
  <img src="../../assets/gallery/cards.png" alt="" width="1120" height="500" loading="lazy">
  <div class="tv-gallery-card-body">

    <h3>Service cards</h3>
    <p>Give names, roles, and status a clear place.</p>
    <span class="tv-gallery-action">Open the pattern <span aria-hidden="true">↗</span></span>
  </div>
</a>
<a class="tv-gallery-card" href="edges/directional-link-strokes/">
  <img src="../../assets/gallery/directions.png" alt="" width="1120" height="500" loading="lazy">
  <div class="tv-gallery-card-body">

    <h3>Two traffic directions</h3>
    <p>Read both directions on one physical link.</p>
    <span class="tv-gallery-action">Open the pattern <span aria-hidden="true">↗</span></span>
  </div>
</a>
<a class="tv-gallery-card" href="regions/nested-regions/">
  <img src="../../assets/gallery/regions.png" alt="" width="1120" height="500" loading="lazy">
  <div class="tv-gallery-card-body">

    <h3>Regions within regions</h3>
    <p>Explain sites, domains, and shared membership.</p>
    <span class="tv-gallery-action">Open the pattern <span aria-hidden="true">↗</span></span>
  </div>
</a>
<a class="tv-gallery-card" href="attention/object-focus/">
  <img src="../../assets/gallery/focus.png" alt="" width="1120" height="500" loading="lazy">
  <div class="tv-gallery-card-body">

    <h3>Focus and context</h3>
    <p>Follow one object without losing the network.</p>
    <span class="tv-gallery-action">Open the pattern <span aria-hidden="true">↗</span></span>
  </div>
</a>
<a class="tv-gallery-card" href="callouts/pins-and-leaders/">
  <img src="../../assets/gallery/callouts.png" alt="" width="1120" height="500" loading="lazy">
  <div class="tv-gallery-card-body">

    <h3>Anchored explanations</h3>
    <p>Attach a short explanation to the right object.</p>
    <span class="tv-gallery-action">Open the pattern <span aria-hidden="true">↗</span></span>
  </div>
</a>
<a class="tv-gallery-card" href="layout/clos/">
  <img src="../../assets/gallery/layout.png" alt="" width="1120" height="500" loading="lazy">
  <div class="tv-gallery-card-body">

    <h3>An orderly fabric</h3>
    <p>Arrange stages with a repeatable CLOS layout.</p>
    <span class="tv-gallery-action">Open the pattern <span aria-hidden="true">↗</span></span>
  </div>
</a>
</div>

## Find A Specific Feature

The focused examples stay small so you can see exactly which source field changes the result.

| Build the model | Shape the view | Explain and inspect |
|---|---|---|
| [Graph](graph/index.md) · [Nodes](nodes/index.md) | [Edges](edges/index.md) · [Paths](paths/index.md) | [Attention](attention/index.md) · [Regions](regions/index.md) |
| [Authoring](authoring/index.md) | [Styling](styling/index.md) · [Layout](layout/index.md) | [Callouts](callouts/index.md) · [Shapes](shapes/index.md) |
| [Validate your files](../author/validate-yaml.md) | [Text](text/index.md) | [Object family lookup](object-family-examples.md) |

To embed a diagram in your own product or documentation, use the [integration guides](use-cases/index.md).
