# Architecture rules
- Keep actual payments in an immutable ledger separate from repair estimates; edits to a repair must not rewrite paid amounts or exported snapshots.
- Route financial exports through an authenticated edge function using a server-only explicit account binding, a stable payment UUID and a verified receiver receipt; missing configuration leaves payments pending.
- Expose payment insertion through a validated security-definer RPC and payment reads through owner-only RLS; synchronization metadata and account bindings are server-write-only.