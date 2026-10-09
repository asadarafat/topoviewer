# First Project

**Support status:** Beta Preview

Open [hosted Studio](https://asadarafat.github.io/topoviewer/studio/) in desktop
Chrome or Edge. This walkthrough creates two routers, connects them, and checks
that an exported project can be reopened. You do not need a local development
server. To work from a checkout instead, follow [Run Studio locally](index.md#run-studio-locally).

## Start A Separate Project

1. Open **Project menu > New project**. The preview should be empty. If you already
   have work open, resolve any draft prompt before continuing.
2. Open **Project menu** again. In the row marked **Current**, open its action
   menu and choose **Rename**. Enter `First network` and confirm to return to the workspace.
3. Keep **Split** selected so you can inspect YAML beside the preview.

## Create And Label Two Routers

1. Open **Object drawer** under Authoring in project source. Activate **Router**
   under **Nodes** twice, or drag it into the preview twice. Leave space between
   the routers.
2. Select the first router. In **Properties > Topology**, set **Visible label** to
   `Edge A` and press `Enter` to commit. Its stable ID remains `router-1`.
3. Select the second router and set its visible label to `Core B`. Its ID remains
   `router-2`.
4. Select `Edge A`, then add `Core B` with `Ctrl+click` (`Cmd+click` on macOS).
   With focus on the canvas, press `L` to connect them.

**Check:** the preview contains two named routers and one link. Select
`topology.yaml` in project source: the two node IDs are still `router-1` and
`router-2`, and the link references those IDs. Display labels are not identities.

## Apply Appearance, Then Save

1. Select only `Edge A`. In **Properties > Appearance**, search for **Shape** and
   select `roundRectangle`. The preview changes immediately.
2. Select `stylesheet.yaml` in project source. Find the rule matching
   `node[id = "router-1"]` and check that its shape is `roundRectangle`.
3. Choose **Apply** in the source footer. Apply commits the stylesheet change;
   its Apply and Revert buttons disappear when there is no pending style work.
4. Choose **Save project** in the header. Wait for **Saved · recovery current**.

Save can also apply a valid style draft automatically; this walkthrough uses
Apply first so you can see the difference between applying source and saving a
project. Topology and mapper text require explicit Apply. See the
[draft and save rules](yaml-recovery.md#draft-and-save-rules) if an action is blocked.

## Export And Reopen The Archive

1. Open **Project menu**, open the **Current** row's action menu, and choose
   **Export archive**. Keep the downloaded `first-network.tvstudio` file.
2. In Projects, choose **Open archive** and select that file. Studio creates a
   separate browser project when the imported project ID already exists.
3. Check the imported preview: `Edge A`, `Core B`, and their link are present;
   `Edge A` still has the rounded rectangle shape.
4. Inspect `topology.yaml` again. The node IDs are still `router-1` and `router-2`.

The archive contains applied source, metadata, and local assets. It does **not**
include unresolved editor drafts. Read [Back up before resetting storage](yaml-recovery.md#back-up-before-resetting-storage)
before using an archive as an emergency backup.

Next, [bind a sample to one router](telemetry-mapper.md#create-and-check-a-node-rule)
or use [Export](export.md) for PNG, SVG, documentation, and Grafana artifacts.
An image is a presentation of the project; keep the source archive or YAML files
so you can continue editing.
