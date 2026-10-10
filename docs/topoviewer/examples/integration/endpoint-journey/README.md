# What Sits Behind This Endpoint?

An authored overview of the existing captured EDA service map. Follow the
browser entry, compare two Service frontends for the same Pod selector, and find
the corresponding API Deployment, then expand the
managed runtime into its TopoNode, simulator deployment, and Pod.

The six initial cards expand to eight objects. Click **Managed runtime** to
reveal the three member objects; click the expanded region to collapse it.
Use the **Managed runtime** layer to hide that branch while keeping the
endpoint and backing workload visible.

The **shared selector** connector compares Service frontends; it does not
represent an HTTP forwarding hop. **Template match** connects a Service selector
to a Deployment Pod template. Kubernetes Services select Pods, not Deployments.
The **Pod association** omits the intermediate ReplicaSet and does not assert
direct ownership. These inferred/context relationships are dashed. Solid links
retain the curated entry, control, and domain binding relationships; none are an
observed request or network trace. This is a saved teaching example, not live
cluster inventory. Status, replica counts, and changing Pod details are left
out of the overview.

Stable interaction IDs:

- expand: `aggregate:managed-runtime`;
- collapse: `region:managed-runtime`;
- service: `svc-eda-api`;
- backing deployment: `deploy-eda-api`;
- managed resource: `toponode-leaf1`.

See the Kubernetes [Service](https://kubernetes.io/docs/concepts/services-networking/service/)
and [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
models for selector and controller semantics.
