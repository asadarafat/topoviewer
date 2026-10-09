# What Sits Behind This Endpoint?

An authored overview of the existing captured EDA service map. Follow the
browser through two service identities to the API deployment, then expand the
managed runtime into its TopoNode, simulator deployment, and Pod.

The six initial cards expand to eight objects. Click **Managed runtime** to
reveal the three member objects; click the expanded region to collapse it.
Use the **Managed runtime** layer to hide that branch while keeping the
endpoint and backing workload visible.

Solid links reuse relationships from the captured service-map example. The
dashed **runtime context** link is an authored explanation of scope, not an
observed request or network trace. This is a saved teaching example, not live
cluster inventory. Status, replica counts, and changing Pod details are left
out of the overview.

Stable interaction IDs:

- expand: `aggregate:managed-runtime`;
- collapse: `region:managed-runtime`;
- service: `svc-eda-api`;
- backing deployment: `deploy-eda-api`;
- managed resource: `toponode-leaf1`.
