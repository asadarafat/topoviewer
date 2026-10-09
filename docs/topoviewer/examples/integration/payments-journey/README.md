Payments crosses Frankfurt, Amsterdam, and London on a primary service route. The same eight objects appear in three authored snapshots: normal operation, signal loss on the Amsterdam–London circuit, and service restored over protection while that circuit remains down.

This is simulated example data, not live telemetry or a routing simulation. The snapshots explicitly author the path and values. Metro boundaries, a focused service route, readable service cards, and one incident note explain the operational change without changing object identity.

Use topology.yaml for the normal view, degraded.yaml for the incident, and recovered.yaml for the protected service. All three share stylesheet.yaml. The normal bundle is the starting point for downloads and Studio import.

Semantic validation has no errors. The shared stylesheet intentionally emits unused-selector warnings for state rules used by the other snapshots.
