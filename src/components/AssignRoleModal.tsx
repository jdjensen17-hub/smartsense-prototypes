import React, { useMemo, useState } from "react";

type Role = { id: string; name: string };
type Node = { id: string; parentId: string | null; kind: "org" | "location"; name: string };

export default function AssignRoleModal({
  open,
  onClose,
  roles,
  nodes,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  roles: Role[];
  nodes: Node[];
  onCreate: (roleId: string, scopeNodeIds: string[]) => void;
}) {
  const [roleId, setRoleId] = useState<string>(roles[0]?.id ?? "");
  const [selected, setSelected] = useState<string[]>([]);

  const byId = useMemo(() => {
    const m = new Map<string, Node>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  const children = useMemo(() => {
    const m = new Map<string, Node[]>();
    for (const n of nodes) {
      if (!n.parentId) continue;
      const arr = m.get(n.parentId) ?? [];
      arr.push(n);
      m.set(n.parentId, arr);
    }
    for (const [k, arr] of m.entries()) arr.sort((a, b) => a.name.localeCompare(b.name));
    return m;
  }, [nodes]);

  const locations = useMemo(() => nodes.filter((n) => n.kind === "location"), [nodes]);

  function isInScope(nodeId: string, scopeId: string) {
    let cur = byId.get(nodeId);
    while (cur) {
      if (cur.id === scopeId) return true;
      if (!cur.parentId) return false;
      cur = byId.get(cur.parentId);
    }
    return false;
  }

  const locationCount = useMemo(() => {
    const covered = new Set<string>();
    for (const scopeId of selected) {
      for (const loc of locations) {
        if (isInScope(loc.id, scopeId)) covered.add(loc.id);
      }
    }
    return covered.size;
  }, [selected, locations, byId]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function clearAll() {
    setSelected([]);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded bg-white shadow-xl">
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <div className="text-lg font-semibold">Add role assignment</div>
            <div className="text-sm text-slate-500">User + Role + Scope (scope cascades downward)</div>
          </div>
          <button
            onClick={onClose}
            className="rounded px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          {/* Left: Role */}
          <div className="space-y-3">
            <div className="text-sm font-semibold">1) Choose role</div>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full rounded border bg-white px-3 py-2 text-sm"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <div className="rounded border bg-slate-50 p-3 text-sm text-slate-700">
              <div className="font-semibold">Scope preview</div>
              <div className="mt-1 text-slate-600">
                Selected scopes: <span className="font-semibold">{selected.length}</span>
              </div>
              <div className="text-slate-600">
                Locations included: <span className="font-semibold">{locationCount}</span>
              </div>

              <button
                onClick={clearAll}
                className="mt-3 rounded border bg-white px-3 py-2 text-xs hover:bg-slate-100"
              >
                Clear selection
              </button>
            </div>
          </div>

          {/* Right: Scope tree */}
          <div className="space-y-3">
            <div className="text-sm font-semibold">2) Choose scope (multi-select)</div>
            <div className="rounded border bg-white p-3">
              <Tree nodeId={findRoot(nodes)?.id ?? ""} depth={0} />
            </div>
            <div className="text-xs text-slate-500">
              Tip: Select a parent node to include all children. No upward inheritance. No cross-branch access.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t px-5 py-4">
          <div className="text-xs text-slate-500">
            Prototype: saves to in-memory state only.
          </div>
          <button
            disabled={!roleId || selected.length === 0}
            onClick={() => {
              onCreate(roleId, selected);
              onClose();
            }}
            className={
              "rounded px-4 py-2 text-sm text-white " +
              (roleId && selected.length > 0 ? "bg-slate-900" : "bg-slate-300")
            }
          >
            Add assignment
          </button>
        </div>
      </div>
    </div>
  );

  function Tree({ nodeId, depth }: { nodeId: string; depth: number }) {
    const node = byId.get(nodeId);
    if (!node) return null;

    const kids = children.get(nodeId) ?? [];
    const checked = selected.includes(nodeId);

    return (
      <div>
        <label
          className="flex cursor-pointer items-center justify-between rounded px-2 py-2 hover:bg-slate-50"
          style={{ marginLeft: depth * 12 }}
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(nodeId)}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium">{node.name}</span>
            <span className="text-xs text-slate-500">{node.kind === "location" ? "Location" : "Org"}</span>
          </div>
          <span className="text-xs text-slate-500">{countLocationsUnder(nodeId)} loc</span>
        </label>

        <div className="space-y-1">
          {kids.map((k) => (
            <Tree key={k.id} nodeId={k.id} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  }

  function countLocationsUnder(scopeId: string) {
    // fast enough for prototype: scan all locations
    let count = 0;
    for (const loc of locations) if (isInScope(loc.id, scopeId)) count++;
    return count;
  }
}

function findRoot(nodes: { id: string; parentId: string | null }[]) {
  return nodes.find((n) => n.parentId === null) ?? null;
}