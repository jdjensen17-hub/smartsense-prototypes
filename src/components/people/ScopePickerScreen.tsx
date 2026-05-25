import { useState } from 'react';

// ── Types & data (shared with OrgScopePage) ───────────────────────────────────

export type OrgNode = {
  id: string;
  parentId: string | null;
  kind: 'org' | 'location';
  name: string;
  levelName?: string;
  externalId?: string;
};

export const nodes: OrgNode[] = [
  { id: 't_root',    parentId: null,        kind: 'org',      name: 'Acme Foods',     levelName: 'Tenant' },
  { id: 'r_west',    parentId: 't_root',    kind: 'org',      name: 'Region West',    levelName: 'Region' },
  { id: 'd_12',      parentId: 'r_west',    kind: 'org',      name: 'District 12',    levelName: 'District' },
  { id: 'loc_101',   parentId: 'd_12',      kind: 'location', name: 'Store 101',      levelName: 'Location', externalId: 'EXT-101' },
  { id: 'loc_102',   parentId: 'd_12',      kind: 'location', name: 'Store 102',      levelName: 'Location', externalId: 'EXT-102' },
  { id: 'd_15',      parentId: 'r_west',    kind: 'org',      name: 'District 15',    levelName: 'District' },
  { id: 'loc_201',   parentId: 'd_15',      kind: 'location', name: 'Store 201',      levelName: 'Location', externalId: 'EXT-201' },
  { id: 'r_east',    parentId: 't_root',    kind: 'org',      name: 'Region East',    levelName: 'Region' },
  { id: 'd_9',       parentId: 'r_east',    kind: 'org',      name: 'District 9',     levelName: 'District' },
  { id: 'loc_301',   parentId: 'd_9',       kind: 'location', name: 'Store 301',      levelName: 'Location', externalId: 'EXT-301' },
  { id: 'loc_302',   parentId: 'd_9',       kind: 'location', name: 'Store 302',      levelName: 'Location', externalId: 'EXT-302' },
  { id: 'r_central', parentId: 't_root',    kind: 'org',      name: 'Region Central', levelName: 'Region' },
  { id: 'd_7',       parentId: 'r_central', kind: 'org',      name: 'District 7',     levelName: 'District' },
  { id: 'loc_401',   parentId: 'd_7',       kind: 'location', name: 'Store 401',      levelName: 'Location', externalId: 'EXT-401' },
  { id: 'loc_402',   parentId: 'd_7',       kind: 'location', name: 'Store 402',      levelName: 'Location', externalId: 'EXT-402' },
  { id: 'd_22',      parentId: 'r_central', kind: 'org',      name: 'District 22',    levelName: 'District' },
  { id: 'loc_501',   parentId: 'd_22',      kind: 'location', name: 'Store 501',      levelName: 'Location', externalId: 'EXT-501' },
];

function childrenOf(parentId: string) {
  return nodes.filter((n) => n.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name));
}

function flattenTree(nodeId: string, depth: number): { node: OrgNode; depth: number }[] {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return [];
  const kids = childrenOf(nodeId);
  return [{ node, depth }, ...kids.flatMap((k) => flattenTree(k.id, depth + 1))];
}

const allFlattened = flattenTree('t_root', 0);

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
      <path d="M8.842 3.135a.5.5 0 0 1 .023.707L5.435 7.5l3.43 3.658a.5.5 0 0 1-.73.684l-3.75-4a.5.5 0 0 1 0-.684l3.75-4a.5.5 0 0 1 .707-.023Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
      <path d="M6.158 3.135a.5.5 0 0 0-.023.707L9.565 7.5l-3.43 3.658a.5.5 0 0 0 .73.684l3.75-4a.5.5 0 0 0 0-.684l-3.75-4a.5.5 0 0 0-.707-.023Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ color: '#9BA0B0' }}>
      <path d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.691 3.516a4.5 4.5 0 1 1 .707-.707l2.838 2.837a.5.5 0 0 1-.708.708L9.31 10.016Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function OrgIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 15 15" fill="none" className="flex-shrink-0" style={{ color: '#9BA0B0' }}>
      <path d="M7.5 1a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM4 3a3.5 3.5 0 1 1 7 0A3.5 3.5 0 0 1 4 3Zm-2.5 9.5A3.5 3.5 0 0 1 5 9h5a3.5 3.5 0 0 1 3.5 3.5V14a.5.5 0 0 1-1 0v-1.5A2.5 2.5 0 0 0 10 10H5a2.5 2.5 0 0 0-2.5 2.5V14a.5.5 0 0 1-1 0v-1.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function LocationPinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 15 15" fill="none" className="flex-shrink-0" style={{ color: '#9BA0B0' }}>
      <path d="M7.5 1C5.015 1 3 3.015 3 5.5c0 3.527 4.5 8.5 4.5 8.5S12 9.027 12 5.5C12 3.015 9.985 1 7.5 1Zm0 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

// ── Collapsible tree node ─────────────────────────────────────────────────────

function TreeNode({ nodeId, depth, selectedId, onSelect }: {
  nodeId: string; depth: number; selectedId: string | null; onSelect: (node: OrgNode) => void;
}) {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;
  const kids = childrenOf(nodeId);
  const hasKids = kids.length > 0;
  const [expanded, setExpanded] = useState(depth < 2);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        style={{
          paddingLeft: depth * 16 + 12,
          backgroundColor: isSelected ? '#5CA6D9' : '',
          color: isSelected ? '#ffffff' : '#35353B',
        }}
        className="flex items-center gap-2 py-2 pr-3 cursor-pointer rounded-lg mx-1 transition-colors"
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#F7F7FA'; }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = ''; }}
        onClick={() => onSelect(node)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); if (hasKids) setExpanded((v) => !v); }}
          className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded transition-colors"
          style={{ color: isSelected ? '#ffffff' : '#9BA0B0', visibility: hasKids ? 'visible' : 'hidden' }}
        >
          <span style={{ display: 'inline-block', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}>
            <ChevronRightIcon />
          </span>
        </button>
        <span style={{ color: isSelected ? '#ffffff' : '#9BA0B0' }}>
          {node.kind === 'location' ? <LocationPinIcon /> : <OrgIcon />}
        </span>
        <div className="flex flex-1 items-baseline gap-1.5 min-w-0">
          <span className="text-xs flex-shrink-0" style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : '#9BA0B0' }}>
            {node.levelName}
          </span>
          <span className="text-sm font-medium truncate">{node.name}</span>
          {node.externalId && (
            <span className="text-xs flex-shrink-0" style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : '#9BA0B0' }}>
              {node.externalId}
            </span>
          )}
        </div>
      </div>
      {expanded && hasKids && (
        <div>
          {kids.map((k) => (
            <TreeNode key={k.id} nodeId={k.id} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ScopePickerScreen({
  selectedId, onSelect, onBack, hideHeader = false, hideFooter = false,
}: {
  selectedId: string | null; onSelect: (node: OrgNode) => void; onBack: () => void;
  hideHeader?: boolean; hideFooter?: boolean;
}) {
  const [search, setSearch] = useState('');

  const searchResults = search.trim().length > 0
    ? allFlattened.filter(({ node }) =>
        node.name.toLowerCase().includes(search.toLowerCase()) ||
        (node.externalId?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (node.levelName?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid #CCCDD0' }}>
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 transition-colors"
            style={{ color: '#9BA0B0' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F7F7FA'; e.currentTarget.style.color = '#757677'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#9BA0B0'; }}
          >
            <ChevronLeftIcon />
          </button>
          <div>
            <p className="text-xs" style={{ color: '#9BA0B0' }}>Assigning role at</p>
            <h2 className="text-base font-semibold" style={{ color: '#35353B' }}>Select scope</h2>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #CCCDD0' }}>
        <div className="relative">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search locations or org units…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded py-2 pl-9 pr-4 text-sm focus:outline-none transition-colors"
            style={{ border: '1px solid #CCCDD0', backgroundColor: '#F7F7FA', color: '#35353B' }}
            onFocus={e => e.currentTarget.style.borderColor = '#9BA0B0'}
            onBlur={e => e.currentTarget.style.borderColor = '#CCCDD0'}
            autoFocus
          />
        </div>
      </div>

      {/* Tree or search results */}
      <div className="flex-1 overflow-y-auto py-2">
        {searchResults ? (
          searchResults.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm" style={{ color: '#9BA0B0' }}>No matches found</p>
          ) : (
            <div className="space-y-0.5 px-1">
              {searchResults.map(({ node }) => {
                const isSelected = selectedId === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => onSelect(node)}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 transition-colors"
                    style={{ backgroundColor: isSelected ? '#5CA6D9' : '', color: isSelected ? '#ffffff' : '#35353B' }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#F7F7FA'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = ''; }}
                  >
                    <span style={{ color: isSelected ? '#ffffff' : '#9BA0B0' }}>
                      {node.kind === 'location' ? <LocationPinIcon /> : <OrgIcon />}
                    </span>
                    <div className="flex flex-1 items-baseline gap-1.5 min-w-0">
                      <span className="text-xs flex-shrink-0" style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : '#9BA0B0' }}>
                        {node.levelName}
                      </span>
                      <span className="text-sm font-medium truncate">{node.name}</span>
                      {node.externalId && (
                        <span className="text-xs" style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : '#9BA0B0' }}>
                          {node.externalId}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <TreeNode nodeId="t_root" depth={0} selectedId={selectedId} onSelect={onSelect} />
        )}
      </div>

      {/* Footer */}
      {!hideFooter && (
        <div className="px-4 py-3" style={{ borderTop: '1px solid #CCCDD0' }}>
          <button
            disabled={!selectedId}
            onClick={onBack}
            className="w-full rounded py-2.5 text-sm font-bold transition-colors"
            style={{
              backgroundColor: selectedId ? '#5CA6D9' : '#F7F7FA',
              color: selectedId ? '#ffffff' : '#9BA0B0',
              cursor: selectedId ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={e => { if (selectedId) e.currentTarget.style.backgroundColor = '#2C82BD'; }}
            onMouseLeave={e => { if (selectedId) e.currentTarget.style.backgroundColor = '#5CA6D9'; }}
          >
            {selectedId
              ? `Confirm: ${nodes.find((n) => n.id === selectedId)?.name}`
              : 'Select a scope to continue'}
          </button>
        </div>
      )}
    </div>
  );
}
