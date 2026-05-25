import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UncontrolledTreeEnvironment, Tree, StaticTreeDataProvider } from 'react-complex-tree';
import type { TreeItemIndex, TreeItem, TreeInformation, TreeItemRenderContext } from 'react-complex-tree';
import 'react-complex-tree/lib/style-modern.css';
import { Icon } from '@/components/shared/Icon';
import {
  mdiPlus,
  mdiDotsVertical,
  mdiClose,
  mdiCheck,
  mdiChevronDown,
  mdiStore,
} from '@/icons/mdi';

const mdiDragVertical =
  'M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z';
const mdiCheckCircle =
  'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z';

// ─── Types ────────────────────────────────────────────────────────────────────
interface NodeData {
  name: string;
  isLocation: boolean;
  storeNumber?: string;
  cityState?: string;
  isRoot?: boolean;
}

type OrgTreeItem = TreeItem<NodeData>;
type ItemRecord = Record<TreeItemIndex, OrgTreeItem>;

// ─── Initial data ─────────────────────────────────────────────────────────────
function buildInitialItems(): ItemRecord {
  return {
    root: { index: 'root', isFolder: true, data: { name: 'Wingstop', isLocation: false, isRoot: true }, children: ['southwest', 'southeast'] },
    southwest: { index: 'southwest', isFolder: true, data: { name: 'Southwest', isLocation: false }, children: ['dfw', 'houston'] },
    southeast: { index: 'southeast', isFolder: true, data: { name: 'Southeast', isLocation: false }, children: ['orlando'] },
    dfw: { index: 'dfw', isFolder: true, data: { name: 'Dallas-Ft. Worth', isLocation: false }, children: ['loc0001', 'loc0002', 'loc0003'] },
    houston: { index: 'houston', isFolder: true, data: { name: 'Houston', isLocation: false }, children: ['loc0014', 'loc0042'] },
    orlando: { index: 'orlando', isFolder: true, data: { name: 'Orlando', isLocation: false }, children: ['loc0059', 'loc0047'] },
    loc0001: { index: 'loc0001', isFolder: false, data: { name: '0001 - TX-Highland Village', isLocation: true, storeNumber: '0001', cityState: 'TX-Highland Village' }, children: [] },
    loc0002: { index: 'loc0002', isFolder: false, data: { name: '0002 - TX-Irving-N MacArthur', isLocation: true, storeNumber: '0002', cityState: 'TX-Irving-N MacArthur' }, children: [] },
    loc0003: { index: 'loc0003', isFolder: false, data: { name: '0003 - TX-Garland-Buckingham', isLocation: true, storeNumber: '0003', cityState: 'TX-Garland-Buckingham' }, children: [] },
    loc0014: { index: 'loc0014', isFolder: false, data: { name: '0014 - TX-Houston-Kirkwood', isLocation: true, storeNumber: '0014', cityState: 'TX-Houston-Kirkwood' }, children: [] },
    loc0042: { index: 'loc0042', isFolder: false, data: { name: '0042 - TX-Houston-Veterans Memorial', isLocation: true, storeNumber: '0042', cityState: 'TX-Houston-Veterans Memorial' }, children: [] },
    loc0059: { index: 'loc0059', isFolder: false, data: { name: '0059 - FL-Casselberry', isLocation: true, storeNumber: '0059', cityState: 'FL-Casselberry' }, children: [] },
    loc0047: { index: 'loc0047', isFolder: false, data: { name: '0047 - FL-Gainesville', isLocation: true, storeNumber: '0047', cityState: 'FL-Gainesville' }, children: [] },
  };
}

function buildInitialUngrouped(): ItemRecord {
  return {
    ungrouped_root: { index: 'ungrouped_root', isFolder: true, data: { name: 'Ungrouped', isLocation: false, isRoot: true }, children: ['loc0008', 'loc0066', 'loc0039'] },
    loc0008: { index: 'loc0008', isFolder: false, data: { name: '0008 - TX-Carrollton-Trinity Mills', isLocation: true, storeNumber: '0008', cityState: 'TX-Carrollton-Trinity Mills' }, children: [] },
    loc0066: { index: 'loc0066', isFolder: false, data: { name: '0066 - TX-Mesquite-Town East', isLocation: true, storeNumber: '0066', cityState: 'TX-Mesquite-Town East' }, children: [] },
    loc0039: { index: 'loc0039', isFolder: false, data: { name: '0039 - IL-Decatur-King', isLocation: true, storeNumber: '0039', cityState: 'IL-Decatur-King' }, children: [] },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
let idCounter = 1000;
const genId = () => `node_${++idCounter}`;

function collectLocations(id: TreeItemIndex, items: ItemRecord): TreeItemIndex[] {
  const item = items[id];
  if (!item) return [];
  if (item.data.isLocation) return [id];
  return (item.children ?? []).flatMap(c => collectLocations(c, items));
}

function removeSubtree(id: TreeItemIndex, items: ItemRecord): ItemRecord {
  const toDelete = new Set<TreeItemIndex>();
  const mark = (nodeId: TreeItemIndex) => {
    toDelete.add(nodeId);
    (items[nodeId]?.children ?? []).forEach(c => mark(c));
  };
  mark(id);
  const next: ItemRecord = {};
  Object.keys(items).forEach(k => {
    if (!toDelete.has(k)) {
      next[k] = { ...items[k], children: (items[k].children ?? []).filter(c => !toDelete.has(c)) };
    }
  });
  return next;
}

function makeProvider(items: ItemRecord) {
  const copy: ItemRecord = {};
  for (const k of Object.keys(items)) {
    copy[k] = { ...items[k], children: [...(items[k].children ?? [])] };
  }
  return new StaticTreeDataProvider(
    copy,
    (item, name) => ({ ...item, data: { ...item.data, name } })
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OrgScopePage() {
  const navigate = useNavigate();

  // ── Tree state ────────────────────────────────────────────────────────────
  const [treeItems, setTreeItems] = useState<ItemRecord>(buildInitialItems);
  const [ungroupedItems, setUngroupedItems] = useState<ItemRecord>(buildInitialUngrouped);

  // ── Providers — recreated on every data change, RCT remounts via key ──────
  // We track a numeric key per tree; incrementing it forces React to fully
  // unmount and remount UncontrolledTreeEnvironment with the new provider.
  // Expand state is preserved separately so it survives remounts.
  const [combinedKey, setCombinedKey] = useState(0);
  const combinedProvider = useMemo(() => makeProvider({ ...treeItems, ...ungroupedItems }), [combinedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const expandedRef = useRef<TreeItemIndex[]>(['root', 'southwest', 'southeast', 'dfw', 'houston', 'orlando']);

  const prevItemsRef = useRef({ treeItems, ungroupedItems });
  useEffect(() => {
    const prev = prevItemsRef.current;
    if (treeItems !== prev.treeItems || ungroupedItems !== prev.ungroupedItems) {
      prevItemsRef.current = { treeItems, ungroupedItems };
      setCombinedKey(k => k + 1);
    }
  }, [treeItems, ungroupedItems]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [openMenuId, setOpenMenuId] = useState<TreeItemIndex | null>(null);
  const [renamingId, setRenamingId] = useState<TreeItemIndex | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [addingChildOf, setAddingChildOf] = useState<TreeItemIndex | null>(null);
  const [newNodeName, setNewNodeName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<TreeItemIndex | null>(null);
  const [openTenantMenu, setOpenTenantMenu] = useState(false);
  const [confirmDeleteHierarchy, setConfirmDeleteHierarchy] = useState(false);
  const envRef = useRef<any>(null);

  const isEmpty = !(treeItems['root']?.children?.length);

  // ── Close menu on outside click ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-kebab-menu]')) setOpenMenuId(null);
      if (!target.closest('[data-tenant-kebab-menu]')) setOpenTenantMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Expand / Collapse all ─────────────────────────────────────────────────
  const expandAll = () => envRef.current?.expandAll?.('main-tree');
  const collapseAll = () => envRef.current?.collapseAll?.('main-tree');

  // ── Rename ────────────────────────────────────────────────────────────────
  const startRename = useCallback((id: TreeItemIndex, currentName: string) => {
    setOpenMenuId(null);
    setRenamingId(id);
    setRenameValue(currentName);
  }, []);

  // renameValueRef keeps the input value accessible inside the onBlur/onKeyDown
  // handlers without needing renameValue in their dependency arrays
  const renameValueRef = useRef(renameValue);
  useEffect(() => { renameValueRef.current = renameValue; }, [renameValue]);

  const commitRename = useCallback((id: TreeItemIndex) => {
    const trimmed = renameValueRef.current.trim();
    if (trimmed) {
      setTreeItems(prev => ({
        ...prev,
        [id]: { ...prev[id], data: { ...prev[id].data, name: trimmed } },
      }));
    }
    setRenamingId(null);
  }, []);

  // ── Add child ─────────────────────────────────────────────────────────────
  const startAddChild = useCallback((parentId: TreeItemIndex) => {
    setOpenMenuId(null);
    setAddingChildOf(parentId);
    setNewNodeName('');
  }, []);

  const newNodeNameRef = useRef(newNodeName);
  useEffect(() => { newNodeNameRef.current = newNodeName; }, [newNodeName]);

  const commitAddChild = useCallback((parentId: TreeItemIndex) => {
    const trimmed = newNodeNameRef.current.trim();
    if (trimmed) {
      const newId = genId();
      // Preserve expand state: ensure parent stays expanded after remount
      if (!expandedRef.current.includes(parentId)) {
        expandedRef.current = [...expandedRef.current, parentId];
      }
      setTreeItems(prev => {
        const parent = prev[parentId];
        return {
          ...prev,
          [parentId]: { ...parent, children: [...(parent.children ?? []), newId] },
          [newId]: { index: newId, isFolder: true, data: { name: trimmed, isLocation: false }, children: [] },
        };
      });
    }
    setAddingChildOf(null);
    setNewNodeName('');
  }, []);

  // ── Delete ────────────────────────────────────────────────────────────────
  const requestDelete = useCallback((id: TreeItemIndex) => {
    setOpenMenuId(null);
    const item = treeItems[id];
    if (!item) return;
    if ((item.children ?? []).length > 0) {
      setConfirmDeleteId(id);
    } else {
      // Empty folder — no confirmation needed
      setTreeItems(prev => removeSubtree(id, prev));
    }
  }, [treeItems]);

  const executeDelete = useCallback((id: TreeItemIndex) => {
    // Snapshot BEFORE any state updates to avoid stale closure
    const displaced = collectLocations(id, treeItems);
    const displacedItems = displaced.reduce<ItemRecord>((acc, locId) => {
      if (treeItems[locId]) acc[locId] = treeItems[locId];
      return acc;
    }, {});

    setConfirmDeleteId(null);

    setTreeItems(prev => {
      const next = removeSubtree(id, prev);
      // Remove displaced locations from tree — they move to ungrouped
      displaced.forEach(locId => { delete next[locId]; });
      return next;
    });

    if (displaced.length > 0) {
      setUngroupedItems(prev => {
        const root = prev['ungrouped_root'];
        return {
          ...prev,
          ...displacedItems,
          ungrouped_root: { ...root, children: [...(root.children ?? []), ...displaced] },
        };
      });
    }
  }, [treeItems]);

  // ── Delete entire hierarchy ───────────────────────────────────────────────
  const executeDeleteHierarchy = useCallback(() => {
    setConfirmDeleteHierarchy(false);
    expandedRef.current = [];
    setTreeItems({
      root: { index: 'root', isFolder: true, data: { name: 'Wingstop', isLocation: false, isRoot: true }, children: [] },
    });
  }, []);

  // ── Build manually (empty state) ──────────────────────────────────────────
  const handleBuildManually = useCallback(() => {
    setAddingChildOf('root');
    setNewNodeName('');
  }, []);

  // ── Ungrouped count ───────────────────────────────────────────────────────
  const ungroupedCount = (ungroupedItems['ungrouped_root']?.children ?? []).length;

  // ── renderItem ────────────────────────────────────────────────────────────
  const renderItem = useCallback(({
    item, depth, children, context,
  }: {
    item: OrgTreeItem; depth: number; children: React.ReactNode;
    context: TreeItemRenderContext; info: TreeInformation;
    title: React.ReactNode; arrow: React.ReactNode;
  }) => {
    const id = item.index;
    const data = item.data;
    const isLocation = data.isLocation;
    const isRenaming = renamingId === id;
    const isAddingHere = addingChildOf === id;
    const isConfirmDelete = confirmDeleteId === id;
    const isMenuOpen = openMenuId === id;
    const paddingLeft = 16 + depth * 20;
    const displacedCount = isConfirmDelete ? collectLocations(id, treeItems).length : 0;

    if (ungroupedItems[id]) {
      return (
        <div
          {...context.itemContainerWithChildrenProps}
          {...context.interactiveElementProps}
          style={{ marginBottom: 6, borderRadius: 4, overflow: 'hidden', cursor: 'grab', userSelect: 'none', fontFamily: 'Open Sans, sans-serif' }}
        >
          <div
            {...context.itemContainerWithoutChildrenProps}
            style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #E8E8E9', borderRadius: 4, padding: '8px 10px', minHeight: 52, boxSizing: 'border-box' }}
          >
            <span style={{ color: '#BABABA', marginRight: 8, display: 'flex', alignItems: 'center', flexShrink: 0, height: 25 }}>
              <Icon path={mdiDragVertical} size={20} color="#BABABA" />
            </span>
            <span style={{ marginRight: 6, display: 'flex', flexShrink: 0 }}>
              <Icon path={mdiStore} size={20} color="#9BA0B0" />
            </span>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#181D1F' }}>{data.name}</span>
          </div>
        </div>
      );
    }

    if (isLocation) {
      return (
        <div
          {...context.itemContainerWithChildrenProps}
          style={{ marginLeft: paddingLeft, marginRight: 8, borderRadius: 4, overflow: 'hidden' }}
        >
          <div
            {...context.itemContainerWithoutChildrenProps}
            {...context.interactiveElementProps}
            onKeyDown={e => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #E8E8E9', borderRadius: 4, padding: '8px 10px', minHeight: 52, boxSizing: 'border-box', cursor: 'grab', userSelect: 'none', fontFamily: 'Open Sans, sans-serif' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', marginRight: 8, flexShrink: 0 }}>
              <Icon path={mdiDragVertical} size={20} color="#BABABA" />
            </span>
            <span style={{ display: 'flex', alignItems: 'center', marginRight: 8, flexShrink: 0 }}>
              <Icon path={mdiStore} size={20} color="#9BA0B0" />
            </span>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#181D1F' }}>{data.name}</span>
          </div>
        </div>
      );
    }

    return (
      <div {...(isRenaming ? {} : context.itemContainerWithChildrenProps)}>
        {/* ── Node row ── */}
        {!isConfirmDelete && (
          <div
            {...context.itemContainerWithoutChildrenProps}
            {...context.interactiveElementProps}
            onKeyDown={e => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', minHeight: 52,
              paddingLeft, paddingRight: 8,
              backgroundColor: context.isDraggingOver ? '#E1F5FF' : 'transparent',
              cursor: 'grab', position: 'relative',
              fontFamily: 'Open Sans, sans-serif',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = context.isDraggingOver ? '#E1F5FF' : 'transparent'; }}
          >
            {/* Drag handle — visual affordance only */}
            <span style={{ display: 'flex', alignItems: 'center', marginRight: 2, color: '#BABABA', flexShrink: 0 }}>
              <Icon path={mdiDragVertical} size={20} color="#BABABA" />
            </span>

            {/* Chevron for folders */}
            {!isLocation && (
              <span
                onClick={e => { e.stopPropagation(); context.toggleExpandedState(); }}
                onDragStart={e => e.stopPropagation()}
                style={{
                  display: 'flex', alignItems: 'center', marginRight: 4,
                  color: '#6B7280', cursor: 'pointer', flexShrink: 0,
                  transition: 'transform 0.15s ease',
                  transform: context.isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                }}
              >
                <Icon path={mdiChevronDown} size={16} color="#6B7280" />
              </span>
            )}

            {/* Location icon */}
            {isLocation && (
              <span style={{ display: 'flex', alignItems: 'center', marginRight: 6, flexShrink: 0 }}>
                <Icon path={mdiStore} size={14} color="#9BA0B0" />
              </span>
            )}

            {/* Label / rename input */}
            {isRenaming ? (
              <input
                autoFocus
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onMouseDown={e => e.stopPropagation()}
                onKeyDown={e => {
                  e.stopPropagation();
                  if (e.key === 'Enter') commitRename(id);
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                style={{
                  flex: 1, fontSize: 14, fontWeight: 500, color: '#181D1F',
                  border: '1px solid #1678C2', borderRadius: 4, padding: '2px 6px',
                  outline: 'none', fontFamily: 'Open Sans, sans-serif',
                }}
              />
            ) : (
              <span style={{
                flex: 1, fontSize: 14, fontWeight: 500, color: '#181D1F',
                userSelect: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {data.name}
              </span>
            )}

            {/* Right actions — org folders only */}
            {!isLocation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, marginLeft: 4 }} data-kebab-menu>
                <button
                  onClick={e => { e.stopPropagation(); startAddChild(id); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: 'none', background: 'transparent', borderRadius: 4, cursor: 'pointer', color: '#6B7280' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F3F3F4')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  title="Add child node"
                >
                  <Icon path={mdiPlus} size={16} />
                </button>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={e => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : id); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: 'none', background: 'transparent', borderRadius: 4, cursor: 'pointer', color: '#6B7280' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F3F3F4')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Icon path={mdiDotsVertical} size={16} />
                  </button>
                  {isMenuOpen && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, background: '#fff', border: '1px solid #DBDBDB', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 120, overflow: 'hidden' }}>
                      {[
                        { label: 'Rename', action: () => startRename(id, data.name), danger: false },
                        { label: 'Delete', action: () => requestDelete(id), danger: true },
                      ].map(opt => (
                        <button key={opt.label}
                          onClick={e => { e.stopPropagation(); opt.action(); }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', color: opt.danger ? '#E53935' : '#181D1F', fontFamily: 'Open Sans, sans-serif' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >{opt.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Inline delete confirmation ── */}
        {isConfirmDelete && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, paddingLeft, paddingRight: 12, borderBottom: '1px solid #F3F3F4', backgroundColor: '#FEF2F2' }}>
            <span style={{ fontSize: 13, color: '#E53935', flex: 1 }}>
              Delete <strong>{data.name}</strong>?{displacedCount > 0 && ` This will move ${displacedCount} location${displacedCount !== 1 ? 's' : ''} to Ungrouped.`}
            </span>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
              <button onClick={e => { e.stopPropagation(); executeDelete(id); }}
                style={{ padding: '4px 12px', fontSize: 13, fontWeight: 500, background: '#E53935', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                Delete
              </button>
              <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(null); }}
                style={{ padding: '4px 12px', fontSize: 13, fontWeight: 500, background: '#fff', color: '#555555', border: '1px solid #BABABA', borderRadius: 4, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Inline add-child input ── */}
        {isAddingHere && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: paddingLeft + 40, paddingRight: 12, paddingTop: 6, paddingBottom: 6, borderBottom: '1px solid #F3F3F4', backgroundColor: '#F9FAFB' }}>
            <input
              autoFocus
              placeholder="Node name"
              value={newNodeName}
              onChange={e => setNewNodeName(e.target.value)}
              onKeyDown={e => {
                e.stopPropagation(); // prevent RCT from intercepting arrow keys
                if (e.key === 'Enter') commitAddChild(id);
                if (e.key === 'Escape') { setAddingChildOf(null); setNewNodeName(''); }
              }}
              style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#181D1F', border: '1px solid #1678C2', borderRadius: 4, padding: '4px 8px', outline: 'none', fontFamily: 'Open Sans, sans-serif' }}
            />
            <button onClick={() => commitAddChild(id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: '#1678C2', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              <Icon path={mdiCheck} size={14} color="#fff" />
            </button>
            <button onClick={() => { setAddingChildOf(null); setNewNodeName(''); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'transparent', border: '1px solid #BABABA', borderRadius: 4, cursor: 'pointer' }}>
              <Icon path={mdiClose} size={14} color="#555555" />
            </button>
          </div>
        )}

        {children}
      </div>
    );
  }, [
    renamingId, renameValue, addingChildOf, newNodeName,
    confirmDeleteId, openMenuId, treeItems, ungroupedItems,
    commitRename, commitAddChild, executeDelete,
    startRename, startAddChild, requestDelete,
  ]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', fontFamily: 'Open Sans, sans-serif' }}>
      <UncontrolledTreeEnvironment<NodeData>
        key={combinedKey}
        ref={envRef}
        dataProvider={combinedProvider}
        getItemTitle={item => item.data.name}
        viewState={{
          'main-tree': { expandedItems: expandedRef.current },
          'ungrouped-tree': { expandedItems: ['ungrouped_root'] },
        }}
        canDragAndDrop
        canReorderItems
        canDropOnFolder
        canDropOnNonFolder={false}
        canDropAt={(items, target) => {
          if ((target as any).treeId === 'ungrouped-tree') {
            return items.every(item => item.data.isLocation);
          }
          return true;
        }}
        canSearchByStartingTyping={false}
        keyboardBindings={{}}
        defaultInteractionMode={{
          mode: 'custom',
          createInteractiveElementProps: (_item, _treeId, actions, renderFlags) => ({
            onClick: () => actions.toggleExpandedState(),
            tabIndex: 0,
            draggable: renderFlags.canDrag,
            onDragStart: actions.startDragging,
          }),
        }}
        disableMultiselect={true}
        renderItem={renderItem as any}
        renderItemsContainer={({ children, containerProps }) => <div {...containerProps}>{children}</div>}
        renderTreeContainer={({ children, containerProps }) => <div {...containerProps} style={{ ...containerProps.style, outline: 'none' }}>{children}</div>}
        renderDragBetweenLine={({ lineProps, draggingPosition }) => (
          (draggingPosition as any).treeId === 'ungrouped-tree'
            ? <div {...lineProps} style={{ height: 0 }} />
            : <div {...lineProps} style={{ height: 2, background: '#1678C2', margin: '0 16px', borderRadius: 1 }} />
        )}
        onExpandItem={item => {
          if (!expandedRef.current.includes(item.index)) {
            expandedRef.current = [...expandedRef.current, item.index];
          }
        }}
        onCollapseItem={item => {
          expandedRef.current = expandedRef.current.filter(id => id !== item.index);
        }}
        onDrop={(items, target) => {
          const movedIds = items.map(i => i.index);
          const fromUngrouped = movedIds.some(id => ungroupedItems[id]);
          const toUngrouped = (target as any).treeId === 'ungrouped-tree' && !fromUngrouped;

          if (toUngrouped) {
            const movedItemsData = movedIds.reduce<ItemRecord>((acc, id) => {
              if (treeItems[id]) acc[id] = treeItems[id];
              return acc;
            }, {});

            setTreeItems(prev => {
              const next = { ...prev };
              movedIds.forEach(id => { delete next[id]; });
              Object.keys(next).forEach(k => {
                if (next[k].children?.some(c => movedIds.includes(c))) {
                  next[k] = { ...next[k], children: next[k].children!.filter(c => !movedIds.includes(c)) };
                }
              });
              return next;
            });

            setUngroupedItems(prev => {
              const next = { ...prev, ...movedItemsData };
              const root = next['ungrouped_root'];
              const existing = root.children ?? [];
              let newChildren: TreeItemIndex[];
              if (target.targetType === 'between-items') {
                const insertIndex = (target as any).childIndex;
                newChildren = [...existing];
                newChildren.splice(Math.min(insertIndex, existing.length), 0, ...movedIds);
              } else {
                newChildren = [...existing, ...movedIds];
              }
              next['ungrouped_root'] = { ...root, children: newChildren };
              return next;
            });
          } else if (fromUngrouped) {
            const movedItemsData = movedIds.reduce<ItemRecord>((acc, id) => {
              if (ungroupedItems[id]) acc[id] = ungroupedItems[id];
              return acc;
            }, {});

            setUngroupedItems(prev => {
              const next = { ...prev };
              movedIds.forEach(id => { delete next[id]; });
              return {
                ...next,
                ungrouped_root: {
                  ...next['ungrouped_root'],
                  children: (next['ungrouped_root'].children ?? []).filter(c => !movedIds.includes(c)),
                },
              };
            });

            setTreeItems(prev => {
              const next = { ...prev, ...movedItemsData };
              // Remove from any parent that RCT may have already mutated before calling us
              Object.keys(next).forEach(k => {
                if (next[k].children?.some(c => movedIds.includes(c))) {
                  next[k] = { ...next[k], children: next[k].children!.filter(c => !movedIds.includes(c)) };
                }
              });
              if (target.targetType === 'item' || target.targetType === 'root') {
                const parentId = (target as any).targetItem ?? 'root';
                const parent = next[parentId];
                if (parent) next[parentId] = { ...parent, children: [...(parent.children ?? []), ...movedIds] };
              } else if (target.targetType === 'between-items') {
                const parentId = (target as any).parentItem;
                const insertIndex = (target as any).childIndex;
                const parent = next[parentId];
                if (parent) {
                  const ch = [...(parent.children ?? [])];
                  ch.splice(Math.min(insertIndex, ch.length), 0, ...movedIds);
                  next[parentId] = { ...parent, children: ch };
                }
              }
              return next;
            });
          } else {
            setTreeItems(prev => {
              const next = { ...prev };
              Object.keys(next).forEach(k => {
                if (next[k].children?.some(c => movedIds.includes(c))) {
                  next[k] = { ...next[k], children: next[k].children!.filter(c => !movedIds.includes(c)) };
                }
              });
              if (target.targetType === 'item' || target.targetType === 'root') {
                const parentId = (target as any).targetItem ?? 'root';
                const parent = next[parentId];
                if (parent) next[parentId] = { ...parent, children: [...(parent.children ?? []), ...movedIds] };
              } else if (target.targetType === 'between-items') {
                const parentId = (target as any).parentItem;
                const insertIndex = (target as any).childIndex;
                const parent = next[parentId];
                if (parent) {
                  const ch = [...(parent.children ?? [])];
                  ch.splice(insertIndex, 0, ...movedIds);
                  next[parentId] = { ...parent, children: ch };
                }
              }
              return next;
            });
          }
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

          {/* ── Left column ── */}
          <div style={{ flex: '0 0 68%', background: '#fff', border: '1px solid #DBDBDB', borderRadius: 4, minHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Controls bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #DBDBDB', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['EXPAND ALL', 'COLLAPSE ALL'] as const).map((label, i) => (
                  <button key={label} onClick={i === 0 ? expandAll : collapseAll}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1358A0', fontSize: 13, fontWeight: 400, letterSpacing: '1.25px', textTransform: 'uppercase', padding: '4px 8px', borderRadius: 4 }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E1F5FF')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >{label}</button>
                ))}
              </div>
              <button
                onClick={() => navigate('/admin/org-import')}
                style={{ background: '#fff', color: '#1678C2', border: '1px solid #1678C2', borderRadius: 4, padding: '6px 16px', fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F3F3F4')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
              >Import from CSV</button>
            </div>

            {/* Tree body */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {isEmpty ? (
                /* ── Empty state ── */
                <div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', minHeight: 44, paddingLeft: 16, paddingRight: 8, borderBottom: '1px solid #F3F3F4' }}>
                      <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#181D1F' }}>
                        Wingstop
                        <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, color: '#6B7280', border: '1px solid #DBDBDB', borderRadius: 12, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.08em', verticalAlign: 'middle' }}>Tenant</span>
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                        <button
                          onClick={() => { setAddingChildOf('root'); setNewNodeName(''); }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: 'none', background: 'transparent', borderRadius: 4, cursor: 'pointer', color: '#6B7280' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F3F3F4')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          title="Add top-level node"
                        >
                          <Icon path={mdiPlus} size={16} />
                        </button>
                        <div style={{ position: 'relative' }} data-tenant-kebab-menu>
                          <button
                            onClick={e => { e.stopPropagation(); setOpenTenantMenu(o => !o); }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: 'none', background: 'transparent', borderRadius: 4, cursor: 'pointer', color: '#6B7280' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F3F3F4')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Icon path={mdiDotsVertical} size={16} />
                          </button>
                          {openTenantMenu && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, background: '#fff', border: '1px solid #DBDBDB', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 160, overflow: 'hidden' }}>
                              <button
                                onClick={e => { e.stopPropagation(); setOpenTenantMenu(false); setConfirmDeleteHierarchy(true); }}
                                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#E53935', fontFamily: 'Open Sans, sans-serif' }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >Delete hierarchy</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {confirmDeleteHierarchy && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, paddingLeft: 16, paddingRight: 12, borderBottom: '1px solid #F3F3F4', backgroundColor: '#FEF2F2' }}>
                        <span style={{ fontSize: 13, color: '#E53935', flex: 1 }}>
                          Delete the entire hierarchy? All locations will move to Ungrouped.
                        </span>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                          <button onClick={executeDeleteHierarchy}
                            style={{ padding: '4px 12px', fontSize: 13, fontWeight: 500, background: '#E53935', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                            Delete
                          </button>
                          <button onClick={() => setConfirmDeleteHierarchy(false)}
                            style={{ padding: '4px 12px', fontSize: 13, fontWeight: 500, background: '#fff', color: '#555555', border: '1px solid #BABABA', borderRadius: 4, cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {addingChildOf === 'root' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 36, paddingRight: 12, paddingTop: 6, paddingBottom: 6, borderBottom: '1px solid #F3F3F4', backgroundColor: '#F9FAFB' }}>
                        <input
                          autoFocus
                          placeholder="Node name"
                          value={newNodeName}
                          onChange={e => setNewNodeName(e.target.value)}
                          onMouseDown={e => e.stopPropagation()}
                          onKeyDown={e => {
                            e.stopPropagation();
                            if (e.key === 'Enter') {
                              const trimmed = newNodeName.trim();
                              if (trimmed) {
                                const newId = genId();
                                if (!expandedRef.current.includes('root')) expandedRef.current = [...expandedRef.current, 'root'];
                                setTreeItems(prev => ({
                                  ...prev,
                                  root: { ...prev['root'], children: [...(prev['root'].children ?? []), newId] },
                                  [newId]: { index: newId, isFolder: true, data: { name: trimmed, isLocation: false }, children: [] },
                                }));
                              }
                              setAddingChildOf(null);
                              setNewNodeName('');
                            }
                            if (e.key === 'Escape') { setAddingChildOf(null); setNewNodeName(''); }
                          }}
                          style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#181D1F', border: '1px solid #1678C2', borderRadius: 4, padding: '4px 8px', outline: 'none', fontFamily: 'Open Sans, sans-serif' }}
                        />
                        <button
                          onClick={() => {
                            const trimmed = newNodeName.trim();
                            if (trimmed) {
                              const newId = genId();
                              if (!expandedRef.current.includes('root')) expandedRef.current = [...expandedRef.current, 'root'];
                              setTreeItems(prev => ({
                                ...prev,
                                root: { ...prev['root'], children: [...(prev['root'].children ?? []), newId] },
                                [newId]: { index: newId, isFolder: true, data: { name: trimmed, isLocation: false }, children: [] },
                              }));
                            }
                            setAddingChildOf(null);
                            setNewNodeName('');
                          }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: '#1678C2', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                        >
                          <Icon path={mdiCheck} size={14} color="#fff" />
                        </button>
                        <button
                          onClick={() => { setAddingChildOf(null); setNewNodeName(''); }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'transparent', border: '1px solid #BABABA', borderRadius: 4, cursor: 'pointer' }}
                        >
                          <Icon path={mdiClose} size={14} color="#555555" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 32px', gap: 16 }}>
                    <p style={{ fontSize: 16, fontWeight: 500, color: '#555555', margin: 0 }}>No hierarchy yet</p>
                    <p style={{ fontSize: 13, color: '#9BA0B0', margin: 0, textAlign: 'center' }}>Import locations from a CSV file or build your hierarchy manually.</p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      <button onClick={() => navigate('/admin/org-import')} style={{ background: '#1678C2', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 24px', fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>Import from CSV</button>
                      <button onClick={handleBuildManually} style={{ background: '#fff', color: '#1678C2', border: '1px solid #1678C2', borderRadius: 4, padding: '8px 16px', fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>Build Manually</button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Populated tree ── */
                <div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', minHeight: 44, paddingLeft: 16, paddingRight: 8, borderBottom: '1px solid #F3F3F4' }}>
                      <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#181D1F' }}>
                        Wingstop
                        <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, color: '#6B7280', border: '1px solid #DBDBDB', borderRadius: 12, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.08em', verticalAlign: 'middle' }}>Tenant</span>
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                        <button
                          onClick={() => { setAddingChildOf('root'); setNewNodeName(''); }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: 'none', background: 'transparent', borderRadius: 4, cursor: 'pointer', color: '#6B7280' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F3F3F4')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          title="Add top-level node"
                        >
                          <Icon path={mdiPlus} size={16} />
                        </button>
                        <div style={{ position: 'relative' }} data-tenant-kebab-menu>
                          <button
                            onClick={e => { e.stopPropagation(); setOpenTenantMenu(o => !o); }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: 'none', background: 'transparent', borderRadius: 4, cursor: 'pointer', color: '#6B7280' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F3F3F4')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Icon path={mdiDotsVertical} size={16} />
                          </button>
                          {openTenantMenu && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, background: '#fff', border: '1px solid #DBDBDB', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 160, overflow: 'hidden' }}>
                              <button
                                onClick={e => { e.stopPropagation(); setOpenTenantMenu(false); setConfirmDeleteHierarchy(true); }}
                                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#E53935', fontFamily: 'Open Sans, sans-serif' }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >Delete hierarchy</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {confirmDeleteHierarchy && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, paddingLeft: 16, paddingRight: 12, borderBottom: '1px solid #F3F3F4', backgroundColor: '#FEF2F2' }}>
                        <span style={{ fontSize: 13, color: '#E53935', flex: 1 }}>
                          Delete the entire hierarchy? All locations will move to Ungrouped.
                        </span>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                          <button onClick={executeDeleteHierarchy}
                            style={{ padding: '4px 12px', fontSize: 13, fontWeight: 500, background: '#E53935', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                            Delete
                          </button>
                          <button onClick={() => setConfirmDeleteHierarchy(false)}
                            style={{ padding: '4px 12px', fontSize: 13, fontWeight: 500, background: '#fff', color: '#555555', border: '1px solid #BABABA', borderRadius: 4, cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {addingChildOf === 'root' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 36, paddingRight: 12, paddingTop: 6, paddingBottom: 6, borderBottom: '1px solid #F3F3F4', backgroundColor: '#F9FAFB' }}>
                        <input
                          autoFocus
                          placeholder="Node name"
                          value={newNodeName}
                          onChange={e => setNewNodeName(e.target.value)}
                          onMouseDown={e => e.stopPropagation()}
                          onKeyDown={e => {
                            e.stopPropagation();
                            if (e.key === 'Enter') {
                              const trimmed = newNodeName.trim();
                              if (trimmed) {
                                const newId = genId();
                                if (!expandedRef.current.includes('root')) expandedRef.current = [...expandedRef.current, 'root'];
                                setTreeItems(prev => ({
                                  ...prev,
                                  root: { ...prev['root'], children: [...(prev['root'].children ?? []), newId] },
                                  [newId]: { index: newId, isFolder: true, data: { name: trimmed, isLocation: false }, children: [] },
                                }));
                              }
                              setAddingChildOf(null);
                              setNewNodeName('');
                            }
                            if (e.key === 'Escape') { setAddingChildOf(null); setNewNodeName(''); }
                          }}
                          style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#181D1F', border: '1px solid #1678C2', borderRadius: 4, padding: '4px 8px', outline: 'none', fontFamily: 'Open Sans, sans-serif' }}
                        />
                        <button
                          onClick={() => {
                            const trimmed = newNodeName.trim();
                            if (trimmed) {
                              const newId = genId();
                              if (!expandedRef.current.includes('root')) expandedRef.current = [...expandedRef.current, 'root'];
                              setTreeItems(prev => ({
                                ...prev,
                                root: { ...prev['root'], children: [...(prev['root'].children ?? []), newId] },
                                [newId]: { index: newId, isFolder: true, data: { name: trimmed, isLocation: false }, children: [] },
                              }));
                            }
                            setAddingChildOf(null);
                            setNewNodeName('');
                          }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: '#1678C2', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                        >
                          <Icon path={mdiCheck} size={14} color="#fff" />
                        </button>
                        <button
                          onClick={() => { setAddingChildOf(null); setNewNodeName(''); }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'transparent', border: '1px solid #BABABA', borderRadius: 4, cursor: 'pointer' }}
                        >
                          <Icon path={mdiClose} size={14} color="#555555" />
                        </button>
                      </div>
                    )}
                  </div>
                  <Tree<NodeData> treeId="main-tree" rootItem="root" treeLabel="Org Hierarchy" />
                </div>
              )}
            </div>
          </div>

          {/* ── Right column — ungrouped ── */}
          <div style={{ flex: '0 0 calc(32% - 16px)', background: '#fff', border: '1px solid #DBDBDB', borderRadius: 4, minHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', borderBottom: '1px solid #DBDBDB', flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#181D1F' }}>Ungrouped Locations</span>
              <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1, borderRadius: 10, padding: '2px 7px', transition: 'all 0.3s ease', backgroundColor: '#fff', color: ungroupedCount === 0 ? '#27B872' : '#E53935', border: ungroupedCount === 0 ? '1px solid #27B872' : '1px solid #E53935' }}>
                {ungroupedCount}
              </span>
            </div>
            <div style={{ flex: 1, padding: 12, overflow: 'auto' }}>
              {ungroupedCount === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 8 }}>
                  <Icon path={mdiCheckCircle} size={28} color="#27B872" />
                  <span style={{ fontSize: 13, color: '#6B7280' }}>All locations are grouped</span>
                </div>
              ) : (
                <Tree<NodeData> treeId="ungrouped-tree" rootItem="ungrouped_root" treeLabel="Ungrouped Locations" />
              )}
            </div>
          </div>

        </div>
      </UncontrolledTreeEnvironment>
    </div>
  );
}
