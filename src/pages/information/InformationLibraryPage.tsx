import { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import {
  Building2, ChevronDown, ChevronRight, ChevronUp, Download, Eye,
  FilePen, FileText, Film, Folder, FolderOpen, FolderPlus, GripVertical,
  Image, Library, Lock, MapPin, MoreVertical, Pencil, Play, RefreshCw,
  Search, Sheet, Trash2, Upload, X,
} from 'lucide-react';
import {
  defaultRoles, emptySubcategory, FILE_TYPES, formatBytes, formatUpdated, OFFICE_TYPES, roleNote, textBytes,
  SEED_CATEGORIES, SEED_FILES, todayIso, typeFromFileName,
  type Category, type FileType, type LibraryFile, type RoleAccess, type Subcategory, type ViewAudience,
} from './libraryData';
import { nodes, type OrgNode } from '@/components/people/ScopePickerScreen';

type SortColumn = 'name' | 'type' | 'category' | 'updated';
type SortDir = 'asc' | 'desc';

type Dialog =
  | { kind: 'upload'; replaceFileId?: string }
  | { kind: 'custom'; fileId?: string; thenPermissions?: boolean }
  | { kind: 'permissions'; categoryId: string; subcategoryId: string }
  | { kind: 'viewer'; fileId: string }
  | { kind: 'category'; categoryId?: string }
  | { kind: 'subcategory'; categoryId: string; subcategoryId?: string }
  | { kind: 'edit'; fileId: string }
  | { kind: 'delete'; kindTarget: 'file' | 'category' | 'subcategory'; id: string; categoryId?: string };

type MenuState = { top: number; right: number } & (
  | { kind: 'file'; fileId: string }
  | { kind: 'category'; categoryId: string }
  | { kind: 'subcategory'; categoryId: string; subcategoryId: string }
);

const iconProps = { strokeWidth: 1.4 } as const;

export default function InformationLibraryPage() {
  const [categories, setCategories] = useState<Category[]>(SEED_CATEGORIES);
  const [files, setFiles] = useState<LibraryFile[]>(SEED_FILES);
  const [expandedIds, setExpandedIds] = useState<string[]>(['cat-corporate']);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FileType | 'all'>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [dragFileId, setDragFileId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (dialog) setDialog(null);
      else setMenu(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dialog]);

  useEffect(() => {
    if (!menu) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menu]);

  const destinations = useMemo(() => categories.flatMap(category =>
    category.subcategories.map(sub => ({
      subcategoryId: sub.id,
      categoryId: category.id,
      label: `${category.name} / ${sub.name}`,
    })),
  ).sort((a, b) => a.label.localeCompare(b.label)), [categories]);

  const visibleFiles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const next = files.filter(file => {
      if (selectedSubcategoryId && file.subcategoryId !== selectedSubcategoryId) return false;
      if (!selectedSubcategoryId && selectedCategoryId && file.categoryId !== selectedCategoryId) return false;
      if (typeFilter !== 'all' && file.type !== typeFilter) return false;
      if (needle && !file.name.toLowerCase().includes(needle)) return false;
      return true;
    });
    const categoryLabel = (file: LibraryFile) => {
      const category = categories.find(item => item.id === file.categoryId);
      const sub = category?.subcategories.find(item => item.id === file.subcategoryId);
      return `${category?.name ?? ''} · ${sub?.name ?? ''}`;
    };
    next.sort((a, b) => {
      let primary = a.name.localeCompare(b.name);
      if (sortColumn === 'type') primary = a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
      if (sortColumn === 'category') primary = categoryLabel(a).localeCompare(categoryLabel(b)) || a.name.localeCompare(b.name);
      if (sortColumn === 'updated') primary = a.updated.localeCompare(b.updated) || a.name.localeCompare(b.name);
      return sortDir === 'desc' ? -primary : primary;
    });
    return next;
  }, [categories, files, query, selectedCategoryId, selectedSubcategoryId, sortColumn, sortDir, typeFilter]);

  const place = (file: LibraryFile) => {
    const category = categories.find(item => item.id === file.categoryId);
    const sub = category?.subcategories.find(item => item.id === file.subcategoryId);
    return { category: category?.name ?? '', sub: sub?.name ?? '' };
  };

  function toggleColumn(column: SortColumn) {
    if (sortColumn === column) {
      setSortDir(dir => dir === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortColumn(column);
    setSortDir(column === 'updated' ? 'desc' : 'asc');
  }

  function renderSortHeader(column: SortColumn, label: string, width?: number) {
    const active = sortColumn === column;
    return (
      <th aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} style={width ? { width } : undefined}>
        <HeaderSort type="button" data-active={active} onClick={() => toggleColumn(column)}>
          {label}
          {active && (sortDir === 'asc'
            ? <ChevronUp size={14} {...iconProps} aria-hidden="true" />
            : <ChevronDown size={14} {...iconProps} aria-hidden="true" />)}
        </HeaderSort>
      </th>
    );
  }

  function selectCategory(categoryId: string) {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(null);
    setSelectedFileId(null);
    setExpandedIds(ids => ids.includes(categoryId) ? ids : [...ids, categoryId]);
  }

  function selectSubcategory(categoryId: string, subcategoryId: string) {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(subcategoryId);
    setSelectedFileId(null);
    setExpandedIds(ids => ids.includes(categoryId) ? ids : [...ids, categoryId]);
  }

  function showAll() {
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setSelectedFileId(null);
  }

  function toggleExpanded(categoryId: string) {
    setExpandedIds(ids => ids.includes(categoryId) ? ids.filter(id => id !== categoryId) : [...ids, categoryId]);
  }

  function openFile(file: LibraryFile) {
    if (OFFICE_TYPES.includes(file.type)) {
      downloadPlaceholder(file);
      return;
    }
    setDialog({ kind: 'viewer', fileId: file.id });
  }

  function openEdit(file: LibraryFile) {
    setMenu(null);
    if (file.type === 'Custom') setDialog({ kind: 'custom', fileId: file.id });
    else setDialog({ kind: 'edit', fileId: file.id });
  }

  function saveFiles(next: LibraryFile[]) {
    setFiles(next);
  }

  function moveFile(fileId: string, categoryId: string, subcategoryId: string) {
    setFiles(current => current.map(file => {
      if (file.id !== fileId || file.subcategoryId === subcategoryId) return file;
      return { ...file, categoryId, subcategoryId };
    }));
    setDragFileId(null);
    setDropTargetId(null);
  }

  function removeTarget(target: Dialog & { kind: 'delete' }) {
    if (target.kindTarget === 'file') {
      setFiles(current => current.filter(file => file.id !== target.id));
      if (selectedFileId === target.id) setSelectedFileId(null);
    }
    if (target.kindTarget === 'category') {
      setCategories(current => current.filter(category => category.id !== target.id));
      setFiles(current => current.filter(file => file.categoryId !== target.id));
      if (selectedCategoryId === target.id) showAll();
    }
    if (target.kindTarget === 'subcategory' && target.categoryId) {
      const categoryId = target.categoryId;
      setCategories(current => current.map(category => category.id === categoryId
        ? { ...category, subcategories: category.subcategories.filter(sub => sub.id !== target.id) }
        : category));
      setFiles(current => current.filter(file => file.subcategoryId !== target.id));
      if (selectedSubcategoryId === target.id) selectCategory(categoryId);
    }
    setDialog(null);
  }

  const emptyLibrary = categories.length === 0;
  const statusCategory = categories.find(category => category.id === selectedCategoryId) ?? null;
  const statusSub = statusCategory?.subcategories.find(sub => sub.id === selectedSubcategoryId) ?? null;
  const statusFiles = files.filter(file => statusSub
    ? file.subcategoryId === statusSub.id
    : statusCategory
      ? file.categoryId === statusCategory.id
      : false);
  const statusBytes = statusFiles.reduce((sum, file) => sum + file.size, 0);
  const menuFile = menu?.kind === 'file' ? files.find(item => item.id === menu.fileId) ?? null : null;
  const menuDownloads = menuFile != null && OFFICE_TYPES.includes(menuFile.type);

  return (
    <Page>
      <LibraryCard>
        <TreePane aria-label="Categories">
          <TreeHeader>
            <CategoriesLabel>Categories</CategoriesLabel>
            <IconButton type="button" aria-label="New Category" title="New Category" onClick={() => setDialog({ kind: 'category' })}>
              <FolderPlus size={16} {...iconProps} />
            </IconButton>
          </TreeHeader>
          <TreeBody>
            {categories.length === 0 && <EmptyTree>No categories yet</EmptyTree>}
            {categories.map(category => {
              const expanded = expandedIds.includes(category.id);
              const categorySelected = selectedCategoryId === category.id && !selectedSubcategoryId;
              return (
                <div key={category.id}>
                  <TreeRow
                    data-selected={categorySelected}
                    onDragEnter={() => {
                      if (!dragFileId) return;
                      setExpandedIds(ids => ids.includes(category.id) ? ids : [...ids, category.id]);
                    }}
                  >
                    <ChevronButton type="button" data-expanded={expanded} aria-label={expanded ? `Collapse ${category.name}` : `Expand ${category.name}`} onClick={() => toggleExpanded(category.id)}>
                      <ChevronRight size={14} {...iconProps} />
                    </ChevronButton>
                    <TreeLabel type="button" onClick={() => selectCategory(category.id)}>
                      <Folder size={16} {...iconProps} />
                      <span>{category.name}</span>
                    </TreeLabel>
                    <IconButton
                      type="button"
                      data-compact="true"
                      aria-label={`Actions for ${category.name}`}
                      aria-expanded={menu?.kind === 'category' && menu.categoryId === category.id}
                      onClick={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const position = { top: rect.bottom + 4, right: window.innerWidth - rect.right };
                        setMenu(current => current?.kind === 'category' && current.categoryId === category.id ? null : { kind: 'category', categoryId: category.id, ...position });
                      }}
                    >
                      <MoreVertical size={14} {...iconProps} />
                    </IconButton>
                  </TreeRow>
                  {expanded && (
                    <SubList>
                      {category.subcategories.map(sub => {
                        const subSelected = selectedSubcategoryId === sub.id;
                        return (
                          <TreeRow
                            key={sub.id}
                            data-selected={subSelected}
                            data-drop={dropTargetId === sub.id ? 'true' : undefined}
                            onDragOver={e => {
                              if (!dragFileId) return;
                              const file = files.find(item => item.id === dragFileId);
                              if (!file || file.subcategoryId === sub.id) {
                                e.dataTransfer.dropEffect = 'none';
                                return;
                              }
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              setDropTargetId(current => current === sub.id ? current : sub.id);
                            }}
                            onDragLeave={e => {
                              const next = e.relatedTarget;
                              if (next instanceof Node && e.currentTarget.contains(next)) return;
                              setDropTargetId(current => current === sub.id ? null : current);
                            }}
                            onDrop={e => {
                              e.preventDefault();
                              if (dragFileId) moveFile(dragFileId, category.id, sub.id);
                            }}
                          >
                            <TreeLabel type="button" onClick={() => selectSubcategory(category.id, sub.id)}>
                              {subSelected ? <FolderOpen size={14} {...iconProps} /> : <Folder size={14} {...iconProps} />}
                              <span>{sub.name}</span>
                            </TreeLabel>
                            <IconButton
                              type="button"
                              data-compact="true"
                              aria-label={`Actions for ${sub.name}`}
                              aria-expanded={menu?.kind === 'subcategory' && menu.subcategoryId === sub.id}
                              onClick={e => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const position = { top: rect.bottom + 4, right: window.innerWidth - rect.right };
                                setMenu(current => current?.kind === 'subcategory' && current.subcategoryId === sub.id ? null : { kind: 'subcategory', categoryId: category.id, subcategoryId: sub.id, ...position });
                              }}
                            >
                              <MoreVertical size={14} {...iconProps} />
                            </IconButton>
                          </TreeRow>
                        );
                      })}
                    </SubList>
                  )}
                </div>
              );
            })}
          </TreeBody>
          {statusCategory && (
            <TreeStatus>
              <TreeStatusName>{statusSub ? `${statusCategory.name} / ${statusSub.name}` : statusCategory.name}</TreeStatusName>
              <TreeStatusMeta>{statusFiles.length === 1 ? '1 file' : `${statusFiles.length} files`} · {formatBytes(statusBytes)}</TreeStatusMeta>
            </TreeStatus>
          )}
        </TreePane>

        {emptyLibrary ? (
          <EmptyPane>
            <EmptyIcon aria-hidden="true"><Library size={24} {...iconProps} /></EmptyIcon>
            <EmptyTitle>Build your information library</EmptyTitle>
            <EmptyBody>Create a category, then add subcategories and files. Upload PDFs, images, video, Office docs, or author a custom page.</EmptyBody>
            <EmptyActions>
              <ActionButton type="button" tone="secondary" onClick={() => setDialog({ kind: 'category' })}>
                <FolderPlus size={16} {...iconProps} />
                New category
              </ActionButton>
              <ActionButton type="button" tone="primary" onClick={() => setDialog({ kind: 'upload' })}>
                <Upload size={16} {...iconProps} />
                Upload files
              </ActionButton>
            </EmptyActions>
          </EmptyPane>
        ) : (
          <ContentPane aria-label="Files">
            <FilesToolbar>
              <ActionButton type="button" tone="primary" onClick={() => setDialog({ kind: 'upload' })}>
                <Upload size={16} {...iconProps} />
                Upload
              </ActionButton>
              <ActionButton type="button" tone="secondary" onClick={() => setDialog({ kind: 'custom' })}>
                <FilePen size={16} {...iconProps} />
                Create custom
              </ActionButton>
              <ActionButton type="button" tone="secondary" disabled={!selectedSubcategoryId} onClick={() => selectedCategoryId && selectedSubcategoryId && setDialog({ kind: 'permissions', categoryId: selectedCategoryId, subcategoryId: selectedSubcategoryId })}>
                <Lock size={16} {...iconProps} />
                Edit permissions
              </ActionButton>
              <Spacer />
              <SearchWrap>
                <Search size={16} {...iconProps} />
                <SearchInput
                  type="search"
                  placeholder="Search library"
                  aria-label="Search library"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </SearchWrap>
              <FilterSelect aria-label="Type" value={typeFilter} onChange={e => setTypeFilter(e.target.value as FileType | 'all')}>
                <option value="all">All types</option>
                {FILE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </FilterSelect>
            </FilesToolbar>
            <TableWrap>
              {visibleFiles.length === 0 ? (
                <NoMatches>No files match this view.</NoMatches>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <th style={{ width: 32 }} />
                      {renderSortHeader('name', 'Name')}
                      {renderSortHeader('type', 'Type', 130)}
                      {renderSortHeader('category', 'Category', 240)}
                      {renderSortHeader('updated', 'Updated', 200)}
                      <th aria-label="More" style={{ width: 40, padding: 0 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleFiles.map(file => {
                      const located = place(file);
                      return (
                        <Row key={file.id} data-selected={selectedFileId === file.id} data-dragging={dragFileId === file.id ? 'true' : undefined} onClick={() => setSelectedFileId(file.id)}>
                          <td>
                            <Grip
                              type="button"
                              draggable
                              aria-label={`Move ${file.name}`}
                              title="Drag to another subcategory"
                              onDragStart={e => {
                                e.dataTransfer.setData('text/plain', file.id);
                                e.dataTransfer.effectAllowed = 'move';
                                setDragFileId(file.id);
                              }}
                              onDragEnd={() => {
                                setDragFileId(null);
                                setDropTargetId(null);
                              }}
                            >
                              <GripVertical size={14} {...iconProps} />
                            </Grip>
                          </td>
                          <td style={{ overflow: 'hidden' }}>
                            <FileName>
                              <FileIcon aria-hidden="true">{fileIcon(file.type)}</FileIcon>
                              <NameButton type="button" onClick={e => { e.stopPropagation(); openFile(file); }}>{file.name}</NameButton>
                            </FileName>
                          </td>
                          <td><TypeBadge>{file.type}</TypeBadge></td>
                          <MutedCell>{located.category} · {located.sub}</MutedCell>
                          <MutedCell>{formatUpdated(file.updated)}</MutedCell>
                          <td style={{ padding: 0, textAlign: 'center' }}>
                            <RowActions onClick={e => e.stopPropagation()}>
                              <IconButton
                                type="button"
                                aria-label="More"
                                aria-expanded={menu?.kind === 'file' && menu.fileId === file.id}
                                onClick={e => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setMenu(menu?.kind === 'file' && menu.fileId === file.id ? null : {
                                    kind: 'file',
                                    fileId: file.id,
                                    top: rect.bottom + 4,
                                    right: window.innerWidth - rect.right,
                                  });
                                }}
                              >
                                <MoreVertical size={14} {...iconProps} />
                              </IconButton>
                            </RowActions>
                          </td>
                        </Row>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </TableWrap>
          </ContentPane>
        )}
      </LibraryCard>

      {menu?.kind === 'file' && (
        <Menu ref={menuRef} role="menu" style={{ top: menu.top, right: menu.right }}>
          <MenuItem type="button" role="menuitem" onClick={() => { setMenu(null); if (menuFile) openFile(menuFile); }}>
            {menuDownloads ? <Download size={14} {...iconProps} /> : <Eye size={14} {...iconProps} />}
            {menuDownloads ? 'Download' : 'View file'}
          </MenuItem>
          <MenuItem type="button" role="menuitem" onClick={() => { const file = files.find(item => item.id === menu.fileId); if (file) openEdit(file); }}>
            <Pencil size={14} {...iconProps} /> Edit
          </MenuItem>
          <MenuItem type="button" role="menuitem" onClick={() => { setDialog({ kind: 'upload', replaceFileId: menu.fileId }); setMenu(null); }}>
            <RefreshCw size={14} {...iconProps} /> Replace file
          </MenuItem>
          <MenuDivider />
          <MenuItem type="button" role="menuitem" data-danger="true" onClick={() => { setDialog({ kind: 'delete', kindTarget: 'file', id: menu.fileId }); setMenu(null); }}>
            <Trash2 size={14} {...iconProps} /> Delete
          </MenuItem>
        </Menu>
      )}

      {menu?.kind === 'category' && (
        <Menu ref={menuRef} role="menu" style={{ top: menu.top, right: menu.right }}>
          <MenuItem type="button" role="menuitem" onClick={() => { setDialog({ kind: 'subcategory', categoryId: menu.categoryId }); setMenu(null); }}>
            <FolderPlus size={14} {...iconProps} /> New subcategory
          </MenuItem>
          <MenuItem type="button" role="menuitem" onClick={() => { setDialog({ kind: 'category', categoryId: menu.categoryId }); setMenu(null); }}>
            <Pencil size={14} {...iconProps} /> Rename
          </MenuItem>
          <MenuDivider />
          <MenuItem type="button" role="menuitem" data-danger="true" onClick={() => { setDialog({ kind: 'delete', kindTarget: 'category', id: menu.categoryId }); setMenu(null); }}>
            <Trash2 size={14} {...iconProps} /> Delete
          </MenuItem>
        </Menu>
      )}

      {menu?.kind === 'subcategory' && (
        <Menu ref={menuRef} role="menu" style={{ top: menu.top, right: menu.right }}>
          <MenuItem type="button" role="menuitem" onClick={() => { setDialog({ kind: 'subcategory', categoryId: menu.categoryId, subcategoryId: menu.subcategoryId }); setMenu(null); }}>
            <Pencil size={14} {...iconProps} /> Rename
          </MenuItem>
          <MenuDivider />
          <MenuItem type="button" role="menuitem" data-danger="true" onClick={() => { setDialog({ kind: 'delete', kindTarget: 'subcategory', id: menu.subcategoryId, categoryId: menu.categoryId }); setMenu(null); }}>
            <Trash2 size={14} {...iconProps} /> Delete
          </MenuItem>
        </Menu>
      )}

      {dialog?.kind === 'upload' && (
        <UploadDialog
          destinations={destinations}
          initialSubcategoryId={selectedSubcategoryId ?? destinations.find(item => item.categoryId === selectedCategoryId)?.subcategoryId ?? ''}
          replaceFile={dialog.replaceFileId ? files.find(file => file.id === dialog.replaceFileId) ?? null : null}
          onClose={() => setDialog(null)}
          onNeedCategory={() => setDialog({ kind: 'category' })}
          onUpload={(subcategoryId, items) => {
            const destination = destinations.find(item => item.subcategoryId === subcategoryId);
            if (!destination) return;
            if (dialog.replaceFileId && items[0]) {
              const next = items[0];
              setFiles(current => current.map(file => file.id === dialog.replaceFileId
                ? { ...file, name: next.name, type: next.type, size: next.size, updated: todayIso() }
                : file));
            } else {
              const created: LibraryFile[] = items.map(item => ({
                id: crypto.randomUUID(),
                name: item.name,
                type: item.type,
                categoryId: destination.categoryId,
                subcategoryId,
                size: item.size,
                updated: todayIso(),
              }));
              setFiles(current => [...created, ...current]);
              if (created[0]) setSelectedFileId(created[0].id);
            }
            selectSubcategory(destination.categoryId, subcategoryId);
            setDialog(null);
          }}
        />
      )}

      {dialog?.kind === 'custom' && (
        <CustomDialog
          destinations={destinations}
          file={dialog.fileId ? files.find(item => item.id === dialog.fileId) ?? null : null}
          initialSubcategoryId={selectedSubcategoryId ?? destinations.find(item => item.categoryId === selectedCategoryId)?.subcategoryId ?? ''}
          onClose={() => setDialog(null)}
          onSave={(draft, thenPermissions) => {
            const destination = destinations.find(item => item.subcategoryId === draft.subcategoryId);
            if (!destination) return;
            const id = dialog.fileId ?? crypto.randomUUID();
            const nextFile: LibraryFile = {
              id,
              name: draft.name,
              type: 'Custom',
              categoryId: destination.categoryId,
              subcategoryId: draft.subcategoryId,
              updated: todayIso(),
              content: draft.content,
              size: textBytes(draft.content),
            };
            setFiles(current => dialog.fileId
              ? current.map(file => file.id === id ? nextFile : file)
              : [nextFile, ...current]);
            selectSubcategory(destination.categoryId, draft.subcategoryId);
            setSelectedFileId(id);
            setDialog(thenPermissions ? { kind: 'permissions', categoryId: destination.categoryId, subcategoryId: draft.subcategoryId } : null);
          }}
        />
      )}

      {dialog?.kind === 'permissions' && (
        <PermissionsDialog
          subcategory={categories.find(category => category.id === dialog.categoryId)?.subcategories.find(sub => sub.id === dialog.subcategoryId) ?? null}
          categoryName={categories.find(category => category.id === dialog.categoryId)?.name ?? ''}
          onClose={() => setDialog(null)}
          onSave={next => {
            setCategories(current => current.map(category => category.id === dialog.categoryId
              ? { ...category, subcategories: category.subcategories.map(sub => sub.id === next.id ? next : sub) }
              : category));
            setDialog(null);
          }}
        />
      )}

      {dialog?.kind === 'viewer' && (
        <ViewerDialog
          file={files.find(item => item.id === dialog.fileId) ?? null}
          placeLabel={(() => {
            const file = files.find(item => item.id === dialog.fileId);
            if (!file) return '';
            const located = place(file);
            return `${located.category} / ${located.sub}`;
          })()}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'edit' && (
        <EditFileDialog
          file={files.find(item => item.id === dialog.fileId) ?? null}
          destinations={destinations}
          onClose={() => setDialog(null)}
          onSave={draft => {
            const destination = destinations.find(item => item.subcategoryId === draft.subcategoryId);
            if (!destination || !dialog || dialog.kind !== 'edit') return;
            setFiles(current => current.map(file => file.id === dialog.fileId
              ? { ...file, name: draft.name, categoryId: destination.categoryId, subcategoryId: draft.subcategoryId, updated: todayIso() }
              : file));
            selectSubcategory(destination.categoryId, draft.subcategoryId);
            setDialog(null);
          }}
        />
      )}

      {(dialog?.kind === 'category' || dialog?.kind === 'subcategory') && (
        <NameDialog
          dialog={dialog}
          categories={categories}
          onClose={() => setDialog(null)}
          onSave={(name, categoryId) => {
            if (dialog.kind === 'category') {
              if (dialog.categoryId) {
                setCategories(current => current.map(category => category.id === dialog.categoryId ? { ...category, name } : category));
              } else {
                const id = crypto.randomUUID();
                setCategories(current => [...current, { id, name, subcategories: [] }]);
                setExpandedIds(ids => [...ids, id]);
                setSelectedCategoryId(id);
                setSelectedSubcategoryId(null);
              }
            }
            if (dialog.kind === 'subcategory') {
              if (dialog.subcategoryId) {
                setCategories(current => current.map(category => category.id === dialog.categoryId
                  ? { ...category, subcategories: category.subcategories.map(sub => sub.id === dialog.subcategoryId ? { ...sub, name } : sub) }
                  : category));
              } else {
                const id = crypto.randomUUID();
                setCategories(current => current.map(category => category.id === categoryId
                  ? { ...category, subcategories: [...category.subcategories, emptySubcategory(id, name)] }
                  : category));
                selectSubcategory(categoryId, id);
              }
            }
            setDialog(null);
          }}
        />
      )}

      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title={deleteTitle(dialog, categories, files)}
          body={deleteBody(dialog, categories, files)}
          onClose={() => setDialog(null)}
          onConfirm={() => removeTarget(dialog)}
        />
      )}
    </Page>
  );
}

function fileIcon(type: FileType) {
  if (type === 'JPG' || type === 'PNG') return <Image size={14} {...iconProps} />;
  if (type === 'MP4') return <Film size={14} {...iconProps} />;
  if (type === 'XLSX') return <Sheet size={14} {...iconProps} />;
  if (type === 'Custom') return <FilePen size={14} {...iconProps} />;
  return <FileText size={14} {...iconProps} />;
}

function downloadPlaceholder(file: LibraryFile) {
  const blob = new Blob(
    [`${file.name}\n\nThis prototype does not store the original file.\n`],
    { type: 'text/plain' },
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${file.name}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function deleteTitle(dialog: Extract<Dialog, { kind: 'delete' }>, categories: Category[], files: LibraryFile[]) {
  if (dialog.kindTarget === 'file') return `Delete ${files.find(file => file.id === dialog.id)?.name ?? 'file'}?`;
  if (dialog.kindTarget === 'category') return `Delete ${categories.find(category => category.id === dialog.id)?.name ?? 'category'}?`;
  const category = categories.find(item => item.id === dialog.categoryId);
  const sub = category?.subcategories.find(item => item.id === dialog.id);
  return `Delete ${sub?.name ?? 'subcategory'}?`;
}

function deleteBody(dialog: Extract<Dialog, { kind: 'delete' }>, categories: Category[], files: LibraryFile[]) {
  if (dialog.kindTarget === 'file') return 'This removes the file from the library.';
  if (dialog.kindTarget === 'category') {
    const count = files.filter(file => file.categoryId === dialog.id).length;
    return count === 0 ? 'This category has no files.' : `This also removes ${count} file${count === 1 ? '' : 's'} in the category.`;
  }
  const count = files.filter(file => file.subcategoryId === dialog.id).length;
  return count === 0 ? 'This subcategory has no files.' : `This also removes ${count} file${count === 1 ? '' : 's'} in the subcategory.`;
}

function UploadDialog({
  destinations, initialSubcategoryId, replaceFile, onClose, onNeedCategory, onUpload,
}: {
  destinations: { subcategoryId: string; categoryId: string; label: string }[];
  initialSubcategoryId: string;
  replaceFile: LibraryFile | null;
  onClose: () => void;
  onNeedCategory: () => void;
  onUpload: (subcategoryId: string, items: { name: string; type: FileType }[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subcategoryId, setSubcategoryId] = useState(replaceFile?.subcategoryId ?? initialSubcategoryId);
  const [picked, setPicked] = useState<{ name: string; type: FileType; size: number }[]>([]);
  const [error, setError] = useState('');

  function addFiles(list: FileList | null) {
    if (!list) return;
    const accepted: { name: string; type: FileType; size: number }[] = [];
    let skipped = false;
    Array.from(list).forEach(file => {
      const type = typeFromFileName(file.name);
      if (!type) { skipped = true; return; }
      accepted.push({ name: file.name.replace(/\.[^.]+$/, ''), type, size: file.size });
    });
    setPicked(current => replaceFile ? accepted.slice(0, 1) : [...current, ...accepted]);
    setError(skipped ? 'Skipped files that are not PDF, JPG, PNG, MP4, XLSX, or DOCX.' : '');
  }

  const canSave = Boolean(subcategoryId) && picked.length > 0;
  const label = replaceFile
    ? 'Replace'
    : picked.length > 0
      ? `Upload ${picked.length} file${picked.length === 1 ? '' : 's'}`
      : 'Upload';

  return (
    <Scrim role="presentation" onMouseDown={onClose}>
      <Modal role="dialog" aria-modal="true" aria-labelledby="upload-title" onMouseDown={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle id="upload-title">{replaceFile ? 'Replace file' : 'Upload your own file(s)'}</ModalTitle>
          <HeaderClose type="button" aria-label="Close" onClick={onClose}><X size={16} {...iconProps} /></HeaderClose>
        </ModalHeader>
        <ModalBody>
          {destinations.length === 0 ? (
            <>
              <Help>Create a category and a subcategory before uploading.</Help>
              <ActionButton type="button" tone="primary" onClick={onNeedCategory}>New category</ActionButton>
            </>
          ) : (
            <>
              <FormField>
                <FormLabel>Destination <Req>*</Req></FormLabel>
                <SelectInput aria-label="Destination" value={subcategoryId} disabled={Boolean(replaceFile)} onChange={e => setSubcategoryId(e.target.value)}>
                  {!replaceFile && <option value="">Select a category</option>}
                  {destinations.map(item => <option key={item.subcategoryId} value={item.subcategoryId}>{item.label}</option>)}
                </SelectInput>
              </FormField>
              <Dropzone
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              >
                <Upload size={24} {...iconProps} />
                <DropTitle>{replaceFile ? `Replace ${replaceFile.name}` : 'Drop files here or browse'}</DropTitle>
                <DropSub>PDF, JPG, PNG, MP4, XLSX, DOCX</DropSub>
              </Dropzone>
              <HiddenFile ref={inputRef} type="file" multiple={!replaceFile} accept=".pdf,.jpg,.jpeg,.png,.mp4,.xlsx,.docx" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
              {error && <Help>{error}</Help>}
              {picked.map(file => (
                <FileChip key={`${file.name}-${file.size}`}>
                  <FileIcon>{fileIcon(file.type)}</FileIcon>
                  <ChipName>{file.name}</ChipName>
                  <ChipSize>{formatBytes(file.size)}</ChipSize>
                  <IconButton type="button" aria-label={`Remove ${file.name}`} onClick={() => setPicked(current => current.filter(item => item !== file))}>
                    <X size={14} {...iconProps} />
                  </IconButton>
                </FileChip>
              ))}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <ActionButton type="button" tone="neutral" onClick={onClose}>Cancel</ActionButton>
          {destinations.length > 0 && (
            <ActionButton
              type="button"
              tone="primary"
              disabled={!canSave}
              onClick={() => {
                onUpload(subcategoryId, picked.map(file => ({ name: file.name, type: file.type })));
              }}
            >
              {label}
            </ActionButton>
          )}
        </ModalFooter>
      </Modal>
    </Scrim>
  );
}

function CustomDialog({
  destinations, file, initialSubcategoryId, onClose, onSave,
}: {
  destinations: { subcategoryId: string; label: string }[];
  file: LibraryFile | null;
  initialSubcategoryId: string;
  onClose: () => void;
  onSave: (draft: { name: string; subcategoryId: string; content: string }, thenPermissions: boolean) => void;
}) {
  const [name, setName] = useState(file?.name ?? '');
  const [subcategoryId, setSubcategoryId] = useState(file?.subcategoryId ?? initialSubcategoryId);
  const [content, setContent] = useState(file?.content ?? '');
  const ready = name.trim().length > 0 && content.trim().length > 0 && Boolean(subcategoryId);

  return (
    <Scrim role="presentation" onMouseDown={onClose}>
      <Modal role="dialog" aria-modal="true" aria-labelledby="custom-title" onMouseDown={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle id="custom-title">{file ? 'Edit custom file' : 'Create a custom file'}</ModalTitle>
          <HeaderClose type="button" aria-label="Close" onClick={onClose}><X size={16} {...iconProps} /></HeaderClose>
        </ModalHeader>
        <ModalBody>
          <FormField>
            <FormLabel>Title <Req>*</Req></FormLabel>
            <TextInput value={name} onChange={e => setName(e.target.value)} />
          </FormField>
          <FormField>
            <FormLabel>Destination <Req>*</Req></FormLabel>
            <SelectInput aria-label="Destination" value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)}>
              {!file && <option value="">Select a category</option>}
              {destinations.map(item => <option key={item.subcategoryId} value={item.subcategoryId}>{item.label}</option>)}
            </SelectInput>
          </FormField>
          <FormField>
            <FormLabel>Content <Req>*</Req></FormLabel>
            <TextArea value={content} onChange={e => setContent(e.target.value)} />
            <Help>Custom files are text pages in this prototype, not a rich-text editor.</Help>
          </FormField>
        </ModalBody>
        <ModalFooter>
          <ActionButton type="button" tone="neutral" onClick={onClose}>Cancel</ActionButton>
          {!file && (
            <ActionButton type="button" tone="secondary" disabled={!ready} onClick={() => onSave({ name: name.trim(), subcategoryId, content: content.trim() }, true)}>
              Save & set permissions
            </ActionButton>
          )}
          <ActionButton type="button" tone="primary" disabled={!ready} onClick={() => onSave({ name: name.trim(), subcategoryId, content: content.trim() }, false)}>
            {file ? 'Save' : 'Create'}
          </ActionButton>
        </ModalFooter>
      </Modal>
    </Scrim>
  );
}

function scopeById(id: string) {
  return nodes.find(node => node.id === id);
}

function scopeChildren(parentId: string) {
  return nodes.filter(node => node.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name));
}

function isTenantScope(scope: OrgNode | undefined) {
  return !scope || scope.parentId === null;
}

function everyoneOption(scopeId: string) {
  const scope = scopeById(scopeId);
  if (isTenantScope(scope)) return 'Everyone at this tenant';
  return `Everyone in ${scope?.name}`;
}

function everyoneHelp(scopeId: string) {
  const scope = scopeById(scopeId);
  if (isTenantScope(scope)) return 'Everyone at the tenant can view files in this subcategory.';
  return `Everyone in ${scope?.name} can view files in this subcategory.`;
}

function containsSelection(nodeId: string, selectedId: string) {
  let current = scopeById(selectedId);
  while (current?.parentId) {
    if (current.parentId === nodeId) return true;
    current = scopeById(current.parentId);
  }
  return false;
}

function ScopeLabel({ node }: { node: OrgNode }) {
  return (
    <>
      {node.kind === 'location' ? <MapPin size={14} {...iconProps} /> : <Building2 size={14} {...iconProps} />}
      <ScopeLevel>{node.levelName}</ScopeLevel>
      <ScopeName>{node.name}</ScopeName>
      {node.externalId && <ScopeExt>{node.externalId}</ScopeExt>}
    </>
  );
}

function ScopeNode({
  node, depth, selectedId, onSelect,
}: {
  node: OrgNode;
  depth: number;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const kids = scopeChildren(node.id);
  const [expanded, setExpanded] = useState(() => node.parentId === null || containsSelection(node.id, selectedId));
  const selected = selectedId === node.id;

  return (
    <div>
      <ScopeRow data-selected={selected ? 'true' : undefined} style={{ paddingLeft: depth * 16 + 8 }}>
        <ScopeTwist
          type="button"
          aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
          aria-expanded={kids.length > 0 ? expanded : undefined}
          data-hidden={kids.length === 0 ? 'true' : undefined}
          onClick={() => kids.length > 0 && setExpanded(value => !value)}
        >
          <ChevronRight size={14} {...iconProps} style={{ transform: expanded ? 'rotate(90deg)' : undefined }} />
        </ScopeTwist>
        <ScopePick type="button" aria-pressed={selected} onClick={() => onSelect(node.id)}>
          <ScopeLabel node={node} />
        </ScopePick>
      </ScopeRow>
      {expanded && kids.map(child => (
        <ScopeNode key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

function DistributionScope({ scopeId, onSelect }: { scopeId: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const tenantId = nodes.find(node => node.parentId === null)?.id ?? 't_root';
  const root = scopeById(tenantId);
  const selected = scopeById(scopeId) ?? root;
  if (!root || !selected) return null;

  return (
    <ScopeTree role="tree" aria-label="Distribution scope">
      {open ? (
        <ScopeNode node={root} depth={0} selectedId={scopeId} onSelect={id => { onSelect(id); setOpen(false); }} />
      ) : (
        <ScopeRow data-selected="true" style={{ paddingLeft: 8 }}>
          <ScopeTwist type="button" aria-label={`Expand ${selected.name}`} aria-expanded={false} onClick={() => setOpen(true)}>
            <ChevronRight size={14} {...iconProps} />
          </ScopeTwist>
          <ScopePick type="button" aria-pressed onClick={() => setOpen(true)}>
            <ScopeLabel node={selected} />
          </ScopePick>
        </ScopeRow>
      )}
    </ScopeTree>
  );
}

function PermissionsDialog({
  subcategory, categoryName, onClose, onSave,
}: {
  subcategory: Subcategory | null;
  categoryName: string;
  onClose: () => void;
  onSave: (subcategory: Subcategory) => void;
}) {
  const tenantId = nodes.find(node => node.parentId === null)?.id ?? 't_root';
  const [scopeId, setScopeId] = useState(subcategory?.scopeId ?? tenantId);
  const [audience, setAudience] = useState<ViewAudience>(subcategory?.audience ?? 'everyone');
  const [roles, setRoles] = useState<RoleAccess[]>(subcategory?.roles ?? defaultRoles());
  const root = scopeById(tenantId);
  if (!subcategory || !root) return null;

  return (
    <Scrim role="presentation" onMouseDown={onClose}>
      <Modal role="dialog" aria-modal="true" aria-labelledby="perm-title" onMouseDown={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle id="perm-title">Edit subcategory permissions</ModalTitle>
          <HeaderClose type="button" aria-label="Close" onClick={onClose}><X size={16} {...iconProps} /></HeaderClose>
        </ModalHeader>
        <ModalBody>
          <PermLead><strong>{categoryName} / {subcategory.name}</strong></PermLead>
          <FormField>
            <FormLabel>Distribution scope</FormLabel>
            <DistributionScope scopeId={scopeId} onSelect={setScopeId} />
          </FormField>
          <FormField>
            <FormLabel>Who can view</FormLabel>
            <SelectInput aria-label="Who can view" value={audience} onChange={e => setAudience(e.target.value as ViewAudience)}>
              <option value="everyone">{everyoneOption(scopeId)}</option>
              <option value="roles">Selected roles</option>
            </SelectInput>
            {audience === 'everyone' && <Help>{everyoneHelp(scopeId)}</Help>}
          </FormField>
          {audience === 'roles' && (
            <FormField>
              <FormLabel>Roles with access</FormLabel>
              <PermList>
                {roles.map(role => (
                  <PermRow key={role.id}>
                    <Avatar data-off={!role.enabled}>{role.initials}</Avatar>
                    <PermMeta>
                      <PermName>{role.name}</PermName>
                      <PermNote>{roleNote(role.enabled)}</PermNote>
                    </PermMeta>
                    <Toggle type="button" aria-pressed={role.enabled} aria-label={`Toggle ${role.name}`} on={role.enabled} onClick={() => setRoles(current => current.map(item => item.id === role.id ? { ...item, enabled: !item.enabled } : item))} />
                  </PermRow>
                ))}
              </PermList>
            </FormField>
          )}
        </ModalBody>
        <ModalFooter>
          <ActionButton type="button" tone="neutral" onClick={onClose}>Cancel</ActionButton>
          <ActionButton type="button" tone="primary" onClick={() => onSave({ ...subcategory, audience, roles, scopeId })}>Save permissions</ActionButton>
        </ModalFooter>
      </Modal>
    </Scrim>
  );
}

function ViewerDialog({
  file, placeLabel, onClose,
}: {
  file: LibraryFile | null;
  placeLabel: string;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  if (!file) return null;

  return (
    <Scrim role="presentation" onMouseDown={onClose}>
      <Modal role="dialog" aria-modal="true" aria-labelledby="viewer-title" data-wide="true" onMouseDown={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle id="viewer-title">{file.name}</ModalTitle>
          <HeaderClose type="button" aria-label="Close" onClick={onClose}><X size={16} {...iconProps} /></HeaderClose>
        </ModalHeader>
        <ModalBody>
          <ViewerKicker>{file.type} · {formatBytes(file.size)} · {placeLabel}</ViewerKicker>
          {file.type === 'Custom' ? (
            <CustomStage>{file.content}</CustomStage>
          ) : file.type === 'MP4' ? (
            <MediaStage>
              <PlayButton type="button" aria-label="Play" disabled><Play size={24} {...iconProps} /></PlayButton>
              <StageTitle>Video player · MP4</StageTitle>
              <StageSub>Playback is a placeholder in this prototype.</StageSub>
            </MediaStage>
          ) : (
            <PdfStage style={{ transform: `scale(${zoom / 100})` }}>
              {file.type === 'JPG' || file.type === 'PNG' ? <Image size={24} {...iconProps} /> : <FileText size={24} {...iconProps} />}
              <StageTitle>{file.type === 'PDF' ? 'Embedded PDF viewer' : 'Image preview'}</StageTitle>
              <StageSub>{file.name}</StageSub>
            </PdfStage>
          )}
        </ModalBody>
        <ModalFooter>
          {file.type === 'PDF' && (
            <>
              <ActionButton type="button" tone="neutral" aria-label="Zoom out" onClick={() => setZoom(value => Math.max(50, value - 25))}>−</ActionButton>
              <ActionButton type="button" tone="neutral" onClick={() => setZoom(100)}>{zoom}%</ActionButton>
              <ActionButton type="button" tone="neutral" aria-label="Zoom in" onClick={() => setZoom(value => Math.min(200, value + 25))}>+</ActionButton>
            </>
          )}
          <Spacer />
          <ActionButton type="button" tone="neutral" onClick={onClose}>Close</ActionButton>
          <ActionButton type="button" tone="primary" onClick={() => downloadPlaceholder(file)}>
            <Download size={16} {...iconProps} />
            Download
          </ActionButton>
        </ModalFooter>
      </Modal>
    </Scrim>
  );
}

function EditFileDialog({
  file, destinations, onClose, onSave,
}: {
  file: LibraryFile | null;
  destinations: { subcategoryId: string; label: string }[];
  onClose: () => void;
  onSave: (draft: { name: string; subcategoryId: string }) => void;
}) {
  const [name, setName] = useState(file?.name ?? '');
  const [subcategoryId, setSubcategoryId] = useState(file?.subcategoryId ?? '');
  if (!file) return null;
  const ready = name.trim().length > 0 && Boolean(subcategoryId);

  return (
    <Scrim role="presentation" onMouseDown={onClose}>
      <Modal role="dialog" aria-modal="true" aria-labelledby="edit-title" onMouseDown={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle id="edit-title">Edit file</ModalTitle>
          <HeaderClose type="button" aria-label="Close" onClick={onClose}><X size={16} {...iconProps} /></HeaderClose>
        </ModalHeader>
        <ModalBody>
          <FormField>
            <FormLabel>Name <Req>*</Req></FormLabel>
            <TextInput value={name} onChange={e => setName(e.target.value)} />
          </FormField>
          <FormField>
            <FormLabel>Destination <Req>*</Req></FormLabel>
            <SelectInput aria-label="Destination" value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)}>
              {destinations.map(item => <option key={item.subcategoryId} value={item.subcategoryId}>{item.label}</option>)}
            </SelectInput>
          </FormField>
        </ModalBody>
        <ModalFooter>
          <ActionButton type="button" tone="neutral" onClick={onClose}>Cancel</ActionButton>
          <ActionButton type="button" tone="primary" disabled={!ready} onClick={() => onSave({ name: name.trim(), subcategoryId })}>
            Save
          </ActionButton>
        </ModalFooter>
      </Modal>
    </Scrim>
  );
}

function NameDialog({
  dialog, categories, onClose, onSave,
}: {
  dialog: Extract<Dialog, { kind: 'category' | 'subcategory' }>;
  categories: Category[];
  onClose: () => void;
  onSave: (name: string, categoryId: string) => void;
}) {
  const existing = dialog.kind === 'category'
    ? categories.find(category => category.id === dialog.categoryId)?.name ?? ''
    : categories.find(category => category.id === dialog.categoryId)?.subcategories.find(sub => sub.id === dialog.subcategoryId)?.name ?? '';
  const [name, setName] = useState(existing);
  const [categoryId, setCategoryId] = useState(dialog.kind === 'subcategory' ? dialog.categoryId : '');
  const creatingSub = dialog.kind === 'subcategory' && !dialog.subcategoryId;
  const title = dialog.kind === 'category'
    ? (dialog.categoryId ? 'Rename category' : 'New category')
    : (dialog.subcategoryId ? 'Rename subcategory' : 'New subcategory');

  return (
    <Scrim role="presentation" onMouseDown={onClose}>
      <Modal role="dialog" aria-modal="true" aria-labelledby="name-title" onMouseDown={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle id="name-title">{title}</ModalTitle>
          <HeaderClose type="button" aria-label="Close" onClick={onClose}><X size={16} {...iconProps} /></HeaderClose>
        </ModalHeader>
        <ModalBody>
          {creatingSub && (
            <FormField>
              <FormLabel>Category <Req>*</Req></FormLabel>
              <SelectInput aria-label="Category" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
              </SelectInput>
            </FormField>
          )}
          <FormField>
            <FormLabel>Name <Req>*</Req></FormLabel>
            <TextInput autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => {
              if (e.key === 'Enter' && name.trim()) onSave(name.trim(), categoryId);
            }} />
          </FormField>
        </ModalBody>
        <ModalFooter>
          <ActionButton type="button" tone="neutral" onClick={onClose}>Cancel</ActionButton>
          <ActionButton type="button" tone="primary" disabled={!name.trim()} onClick={() => onSave(name.trim(), categoryId)}>
            Save
          </ActionButton>
        </ModalFooter>
      </Modal>
    </Scrim>
  );
}

function ConfirmDialog({ title, body, onClose, onConfirm }: { title: string; body: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <Scrim role="presentation" onMouseDown={onClose}>
      <Modal role="dialog" aria-modal="true" aria-labelledby="delete-title" onMouseDown={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle id="delete-title">{title}</ModalTitle>
          <HeaderClose type="button" aria-label="Close" onClick={onClose}><X size={16} {...iconProps} /></HeaderClose>
        </ModalHeader>
        <ModalBody><Help>{body}</Help></ModalBody>
        <ModalFooter>
          <ActionButton type="button" tone="neutral" onClick={onClose}>Cancel</ActionButton>
          <ActionButton type="button" tone="danger" onClick={onConfirm}>Delete</ActionButton>
        </ModalFooter>
      </Modal>
    </Scrim>
  );
}

const Page = styled.div({
  label: 'information-library',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 52px - var(--ss-space-6) - var(--ss-space-6))',
  minHeight: 0,
  fontFamily: 'var(--ss-font-sans)',
  color: 'var(--ss-fg-primary)',
});

const selectChevron = {
  appearance: 'none' as const,
  WebkitAppearance: 'none' as const,
  MozAppearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239ba0b0' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  backgroundSize: '14px 14px',
  paddingRight: 32,
};

const FilterSelect = styled.select({
  label: 'library-filter',
  height: 'var(--ss-space-8)',
  minWidth: 'calc(var(--ss-space-8) * 5)',
  padding: '0 var(--ss-space-3)',
  fontFamily: 'var(--ss-font-sans)',
  fontSize: 'var(--ss-size-body-sm)',
  fontWeight: 600,
  color: 'var(--ss-fg-primary)',
  backgroundColor: 'var(--ss-bg-surface)',
  border: '1px solid var(--ss-border-default)',
  borderRadius: 'var(--ss-rd-4)',
  ...selectChevron,
  '&:focus-visible': { outline: '2px solid var(--ss-sky-blue)', outlineOffset: '2px' },
});

const SearchWrap = styled.div({
  label: 'library-search',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--ss-space-2)',
  height: 'var(--ss-space-8)',
  minWidth: 'calc(var(--ss-space-8) * 7)',
  padding: '0 var(--ss-space-3)',
  background: 'var(--ss-bg-surface)',
  border: '1px solid var(--ss-border-default)',
  borderRadius: 'var(--ss-rd-4)',
  color: 'var(--ss-fg-tertiary)',
});

const SearchInput = styled.input({
  label: 'library-search-input',
  flex: 1,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'var(--ss-font-sans)',
  fontSize: 'var(--ss-size-body-sm)',
  fontWeight: 400,
  color: 'var(--ss-fg-primary)',
  '&::placeholder': { color: 'var(--ss-fg-tertiary)' },
});

const LibraryCard = styled.div({
  label: 'library-card',
  flex: 1,
  display: 'flex',
  minHeight: 0,
  overflow: 'hidden',
  background: 'var(--ss-bg-surface)',
  border: '1px solid var(--ss-border-default)',
  borderRadius: 'var(--ss-rd-4)',
  boxShadow: 'var(--ss-shadow-2)',
});

const TreePane = styled.aside({
  label: 'library-tree',
  width: 300,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid var(--ss-border-default)',
  minHeight: 0,
});

const TreeHeader = styled.div({
  label: 'library-tree-header',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--ss-space-2)',
  padding: 'var(--ss-space-2) var(--ss-space-3)',
  borderBottom: '1px solid var(--ss-border-default)',
});

const CategoriesLabel = styled.span({
  label: 'library-categories-label',
  padding: 'var(--ss-space-1) var(--ss-space-2)',
  fontFamily: 'var(--ss-font-sans)',
  fontSize: 'var(--ss-size-body-sm)',
  fontWeight: 700,
  letterSpacing: 'var(--ss-tracking-banner)',
  textTransform: 'uppercase',
  color: 'var(--ss-fg-secondary)',
  cursor: 'default',
});

const TreeBody = styled.div({
  label: 'library-tree-body',
  flex: 1,
  overflowY: 'auto',
  padding: 'var(--ss-space-1)',
});

const TreeStatus = styled.div({
  label: 'library-tree-status',
  flexShrink: 0,
  padding: 'var(--ss-space-2) var(--ss-space-3)',
  borderTop: '1px solid var(--ss-border-default)',
  background: 'var(--ss-bg-app)',
});

const TreeStatusName = styled.div({
  label: 'library-tree-status-name',
  fontSize: 'var(--ss-size-body-sm)',
  fontWeight: 700,
  color: 'var(--ss-fg-primary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const TreeStatusMeta = styled.div({
  label: 'library-tree-status-meta',
  marginTop: 'var(--ss-space-1)',
  fontSize: 'var(--ss-size-body-sm)',
  color: 'var(--ss-fg-secondary)',
});

const TreeRow = styled.div({
  label: 'library-tree-row',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--ss-space-1)',
  borderRadius: 'var(--ss-rd-4)',
  '&[data-selected="true"]': { background: 'var(--ss-pale-blue)' },
  '&[data-drop="true"]': { boxShadow: 'inset 0 0 0 1px var(--ss-sky-blue)' },
});

const ChevronButton = styled.button({
  label: 'library-tree-chevron',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'var(--ss-space-6)',
  height: 'var(--ss-space-6)',
  border: 'none',
  background: 'transparent',
  color: 'var(--ss-fg-tertiary)',
  cursor: 'pointer',
  borderRadius: 'var(--ss-rd-4)',
  '& svg': { transition: 'transform var(--ss-duration-base) var(--ss-ease-standard)' },
  '&[data-expanded="true"] svg': { transform: 'rotate(90deg)' },
  '[data-selected="true"] &': { color: 'var(--ss-dark-blue)' },
});

const TreeLabel = styled.button({
  label: 'library-tree-label',
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--ss-space-2)',
  minWidth: 0,
  padding: 'var(--ss-space-2) 0',
  border: 'none',
  background: 'transparent',
  color: 'var(--ss-fg-primary)',
  fontFamily: 'var(--ss-font-sans)',
  fontSize: 'var(--ss-size-body-sm)',
  fontWeight: 600,
  textAlign: 'left',
  cursor: 'pointer',
  '& span': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  '[data-selected="true"] &': { color: 'var(--ss-dark-blue)' },
});

const SubList = styled.div({
  label: 'library-subcategories',
  paddingLeft: 'calc(var(--ss-space-6) + var(--ss-space-1) + var(--ss-space-3))',
});

const EmptyTree = styled.p({
  label: 'library-tree-empty',
  margin: 0,
  padding: 'var(--ss-space-3)',
  fontSize: 'var(--ss-size-body-sm)',
  color: 'var(--ss-fg-tertiary)',
});

const ContentPane = styled.section({
  label: 'library-files',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  minHeight: 0,
});

const FilesToolbar = styled.div({
  label: 'library-files-toolbar',
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 'var(--ss-space-2)',
  padding: 'var(--ss-space-2) var(--ss-space-3)',
  background: 'var(--ss-pale-blue)',
  borderBottom: '1px solid var(--ss-light-blue)',
});

const Spacer = styled.span({ label: 'library-spacer', flex: 1 });

const TableWrap = styled.div({
  label: 'library-table-wrap',
  flex: 1,
  overflow: 'auto',
});

const HeaderSort = styled.button({
  label: 'library-sort-header',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--ss-space-1)',
  margin: 0,
  padding: 0,
  border: 'none',
  background: 'transparent',
  fontFamily: 'var(--ss-font-sans)',
  fontSize: 'var(--ss-size-body-sm)',
  fontWeight: 700,
  color: 'var(--ss-fg-secondary)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  '&[data-active="true"]': { color: 'var(--ss-sky-blue)' },
  '&:hover': { color: 'var(--ss-sky-blue)' },
  '&:focus-visible': { outline: '2px solid var(--ss-sky-blue)', outlineOffset: '2px' },
});

const Table = styled.table({
  label: 'library-table',
  width: '100%',
  tableLayout: 'fixed',
  borderCollapse: 'collapse',
  fontSize: 'var(--ss-size-body-sm)',
  '& th': {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    height: 'var(--ss-space-8)',
    padding: '0 var(--ss-space-3)',
    textAlign: 'left',
    fontSize: 'var(--ss-size-body-sm)',
    fontWeight: 700,
    color: 'var(--ss-fg-secondary)',
    background: 'var(--ss-bg-app)',
    borderBottom: '1px solid var(--ss-border-default)',
    whiteSpace: 'nowrap',
  },
  '& td': {
    height: 'var(--ss-space-8)',
    padding: '0 var(--ss-space-3)',
    borderBottom: '1px solid var(--ss-grey-300)',
    verticalAlign: 'middle',
  },
});

const Row = styled.tr({
  label: 'library-row',
  background: 'var(--ss-bg-surface)',
  cursor: 'pointer',
  '&:hover': { background: 'var(--ss-bg-app)' },
  '&[data-selected="true"]': { background: 'var(--ss-pale-blue)' },
  '&[data-dragging="true"]': { opacity: 0.55 },
});

const MutedCell = styled.td({
  label: 'library-muted-cell',
  color: 'var(--ss-fg-secondary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const FileName = styled.div({
  label: 'library-file-name',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--ss-space-2)',
  minWidth: 0,
});

const FileIcon = styled.span({
  label: 'library-file-icon',
  width: 'var(--ss-space-6)',
  height: 'var(--ss-space-6)',
  borderRadius: 'var(--ss-rd-4)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  background: 'var(--ss-pale-blue)',
  color: 'var(--ss-dark-blue)',
});

const NameButton = styled.button({
  label: 'library-file-link',
  border: 'none',
  background: 'transparent',
  padding: 0,
  fontFamily: 'var(--ss-font-sans)',
  fontSize: 'var(--ss-size-body-sm)',
  fontWeight: 700,
  color: 'var(--ss-fg-primary)',
  cursor: 'pointer',
  textAlign: 'left',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  '&:hover': { color: 'var(--ss-sky-blue)' },
});

const TypeBadge = styled.span({
  label: 'library-type-badge',
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: 'var(--ss-size-special)',
  fontWeight: 700,
  padding: 'var(--ss-space-1) var(--ss-space-2)',
  borderRadius: 'var(--ss-rd-4)',
  background: 'var(--ss-pale-blue)',
  color: 'var(--ss-dark-blue)',
  textTransform: 'uppercase',
});

const Grip = styled.button({
  label: 'library-grip',
  display: 'inline-flex',
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'var(--ss-fg-tertiary)',
  cursor: 'grab',
  '&:active': { cursor: 'grabbing' },
});

const RowActions = styled.div({
  label: 'library-row-actions',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const IconButton = styled.button({
  label: 'library-icon-button',
  width: 'var(--ss-space-8)',
  height: 'var(--ss-space-8)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  color: 'var(--ss-fg-tertiary)',
  borderRadius: 'var(--ss-rd-4)',
  cursor: 'pointer',
  padding: 0,
  '&[data-compact="true"]': {
    width: 'var(--ss-space-6)',
    height: 'var(--ss-space-6)',
  },
  '&:hover': { background: 'var(--ss-bg-app)', color: 'var(--ss-fg-primary)' },
});

const ActionButton = styled.button<{ tone: 'primary' | 'secondary' | 'neutral' | 'ghost' | 'danger'; block?: boolean }>(({ tone, block }) => ({
  label: 'library-action',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: block ? 'flex-start' : 'center',
  gap: 'var(--ss-space-1)',
  width: block ? '100%' : undefined,
  height: 'var(--ss-space-8)',
  padding: '0 var(--ss-space-3)',
  borderRadius: 'var(--ss-rd-4)',
  fontFamily: 'var(--ss-font-sans)',
  fontSize: 'var(--ss-size-body-sm)',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  border: tone === 'secondary' || tone === 'neutral' ? '1px solid var(--ss-border-default)' : 'none',
  background: tone === 'primary' ? 'var(--ss-sky-blue)' : tone === 'danger' ? 'var(--ss-danger)' : tone === 'ghost' ? 'transparent' : 'var(--ss-bg-surface)',
  color: tone === 'primary' || tone === 'danger' ? 'var(--ss-fg-on-dark)' : tone === 'secondary' ? 'var(--ss-sky-blue)' : tone === 'ghost' ? 'var(--ss-fg-secondary)' : 'var(--ss-fg-primary)',
  ...(tone === 'secondary' ? { borderColor: 'var(--ss-sky-blue)' } : {}),
  '&:hover:not(:disabled)': {
    background: tone === 'primary' ? 'var(--ss-medium-blue)' : tone === 'secondary' ? 'var(--ss-pale-blue)' : tone === 'ghost' || tone === 'neutral' ? 'var(--ss-bg-app)' : 'var(--ss-danger)',
  },
  '&:disabled': { opacity: 0.45, cursor: 'not-allowed' },
  '&:focus-visible': { outline: '2px solid var(--ss-sky-blue)', outlineOffset: '2px' },
}));

const EmptyPane = styled.div({
  label: 'library-empty',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--ss-space-3)',
  padding: 'var(--ss-space-8)',
  textAlign: 'center',
});

const EmptyIcon = styled.div({
  label: 'library-empty-icon',
  width: 'calc(var(--ss-space-8) + var(--ss-space-6))',
  height: 'calc(var(--ss-space-8) + var(--ss-space-6))',
  borderRadius: 'var(--ss-rd-8)',
  background: 'var(--ss-pale-blue)',
  color: 'var(--ss-dark-blue)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const EmptyTitle = styled.h1({
  label: 'library-empty-title',
  margin: 0,
  fontSize: 'var(--ss-size-h2)',
  fontWeight: 700,
  color: 'var(--ss-fg-heading)',
});

const EmptyBody = styled.p({
  label: 'library-empty-body',
  margin: 0,
  maxWidth: 'calc(var(--ss-space-8) * 12)',
  fontSize: 'var(--ss-size-body)',
  color: 'var(--ss-fg-secondary)',
});

const EmptyActions = styled.div({
  label: 'library-empty-actions',
  display: 'flex',
  gap: 'var(--ss-space-2)',
});

const NoMatches = styled.p({
  label: 'library-no-matches',
  margin: 0,
  padding: 'var(--ss-space-6)',
  color: 'var(--ss-fg-secondary)',
  fontSize: 'var(--ss-size-body)',
});

const Scrim = styled.div({
  label: 'library-scrim',
  position: 'fixed',
  top: '52px',
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 80,
  background: 'rgba(0, 0, 0, 0.40)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--ss-space-6)',
});

const Modal = styled.div({
  label: 'library-modal',
  width: '100%',
  maxWidth: 'calc(var(--ss-space-8) * 18)',
  maxHeight: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--ss-bg-surface)',
  borderRadius: 'var(--ss-rd-4)',
  boxShadow: 'var(--ss-shadow-3)',
  overflow: 'hidden',
  '&[data-wide="true"]': { maxWidth: 'calc(var(--ss-space-8) * 28)' },
});

const ModalHeader = styled.div({
  label: 'library-modal-header',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--ss-space-3)',
  padding: '0 var(--ss-space-3) 0 var(--ss-space-4)',
  height: 'calc(var(--ss-space-8) + var(--ss-space-3))',
  flexShrink: 0,
  background: 'var(--ss-dark-blue)',
  color: 'var(--ss-fg-on-dark)',
});

const ModalTitle = styled.h2({
  label: 'library-modal-title',
  margin: 0,
  fontSize: 'var(--ss-size-body)',
  fontWeight: 700,
  color: 'var(--ss-fg-on-dark)',
});

const HeaderClose = styled.button({
  label: 'library-modal-close',
  width: 'var(--ss-space-8)',
  height: 'var(--ss-space-8)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  color: 'var(--ss-fg-on-dark)',
  borderRadius: 'var(--ss-rd-4)',
  cursor: 'pointer',
  '&:hover': { opacity: 0.75 },
});

const ModalBody = styled.div({
  label: 'library-modal-body',
  flex: 1,
  overflowY: 'auto',
  padding: 'var(--ss-space-4)',
});

const ModalFooter = styled.div({
  label: 'library-modal-footer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 'var(--ss-space-2)',
  padding: 'var(--ss-space-3) var(--ss-space-4)',
  borderTop: '1px solid var(--ss-border-default)',
});

const FormField = styled.div({
  label: 'library-form-field',
  marginBottom: 'var(--ss-space-4)',
});

const FormLabel = styled.label({
  label: 'library-form-label',
  display: 'block',
  marginBottom: 'var(--ss-space-1)',
  fontSize: 'var(--ss-size-body-sm)',
  fontWeight: 700,
  color: 'var(--ss-fg-secondary)',
});

const Req = styled.span({ label: 'library-required', color: 'var(--ss-danger)' });
const TextInput = styled.input({
  label: 'library-input',
  width: '100%',
  height: 'var(--ss-space-8)',
  padding: '0 var(--ss-space-3)',
  fontFamily: 'var(--ss-font-sans)',
  fontSize: 'var(--ss-size-body)',
  fontWeight: 400,
  color: 'var(--ss-fg-primary)',
  backgroundColor: 'var(--ss-bg-surface)',
  border: '1px solid var(--ss-border-default)',
  borderRadius: 'var(--ss-rd-4)',
  '&:focus': { borderColor: 'var(--ss-border-focus)', boxShadow: 'var(--ss-shadow-focus)', outline: 'none' },
  '&:disabled': { backgroundColor: 'var(--ss-bg-app)', color: 'var(--ss-fg-secondary)' },
});

const SelectInput = styled.select({
  label: 'library-select',
  width: '100%',
  height: 'var(--ss-space-8)',
  padding: '0 var(--ss-space-3)',
  fontFamily: 'var(--ss-font-sans)',
  fontSize: 'var(--ss-size-body)',
  fontWeight: 400,
  color: 'var(--ss-fg-primary)',
  backgroundColor: 'var(--ss-bg-surface)',
  border: '1px solid var(--ss-border-default)',
  borderRadius: 'var(--ss-rd-4)',
  ...selectChevron,
  '&:focus': { borderColor: 'var(--ss-border-focus)', boxShadow: 'var(--ss-shadow-focus)', outline: 'none' },
  '&:disabled': { backgroundColor: 'var(--ss-bg-app)', color: 'var(--ss-fg-secondary)' },
});

const TextArea = styled.textarea({
  label: 'library-textarea',
  width: '100%',
  minHeight: 'calc(var(--ss-space-8) * 4)',
  padding: 'var(--ss-space-2) var(--ss-space-3)',
  resize: 'vertical',
  fontFamily: 'var(--ss-font-sans)',
  fontSize: 'var(--ss-size-body)',
  lineHeight: 'var(--ss-lh-relaxed)',
  color: 'var(--ss-fg-primary)',
  background: 'var(--ss-bg-surface)',
  border: '1px solid var(--ss-border-default)',
  borderRadius: 'var(--ss-rd-4)',
  '&:focus': { borderColor: 'var(--ss-border-focus)', boxShadow: 'var(--ss-shadow-focus)', outline: 'none' },
});

const Help = styled.p({
  label: 'library-help',
  margin: 'var(--ss-space-2) 0 0',
  fontSize: 'var(--ss-size-body-sm)',
  color: 'var(--ss-fg-secondary)',
});

const Dropzone = styled.div({
  label: 'library-dropzone',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--ss-space-2)',
  padding: 'var(--ss-space-6)',
  border: '1px dashed var(--ss-border-strong)',
  borderRadius: 'var(--ss-rd-4)',
  background: 'var(--ss-bg-app)',
  color: 'var(--ss-dark-blue)',
  cursor: 'pointer',
  textAlign: 'center',
  '&:hover': { borderColor: 'var(--ss-sky-blue)', background: 'var(--ss-pale-blue)' },
});

const DropTitle = styled.div({
  label: 'library-drop-title',
  fontSize: 'var(--ss-size-body)',
  fontWeight: 700,
  color: 'var(--ss-fg-primary)',
});

const DropSub = styled.div({
  label: 'library-drop-sub',
  fontSize: 'var(--ss-size-body-sm)',
  color: 'var(--ss-fg-tertiary)',
});

const HiddenFile = styled.input({
  label: 'library-file-input',
  display: 'none',
});

const FileChip = styled.div({
  label: 'library-file-chip',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--ss-space-2)',
  marginTop: 'var(--ss-space-2)',
  padding: 'var(--ss-space-2) var(--ss-space-3)',
  background: 'var(--ss-bg-app)',
  border: '1px solid var(--ss-border-default)',
  borderRadius: 'var(--ss-rd-4)',
});

const ChipName = styled.span({
  label: 'library-chip-name',
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 'var(--ss-size-body-sm)',
  fontWeight: 600,
});

const ChipSize = styled.span({
  label: 'library-chip-size',
  fontSize: 'var(--ss-size-special)',
  color: 'var(--ss-fg-tertiary)',
});

const ScopeTree = styled.div({
  label: 'library-scope-tree',
  maxHeight: 280,
  overflowY: 'auto',
  border: '1px solid var(--ss-border-default)',
  borderRadius: 'var(--ss-rd-4)',
  padding: 'var(--ss-space-1) 0',
});

const ScopeRow = styled.div({
  label: 'library-scope-row',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--ss-space-1)',
  minHeight: 32,
  paddingRight: 'var(--ss-space-2)',
  color: 'var(--ss-fg-primary)',
  '&:hover': { background: 'var(--ss-pale-blue)' },
});

const ScopeTwist = styled.button({
  label: 'library-scope-twist',
  width: 20,
  height: 20,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  '&[data-hidden="true"]': { visibility: 'hidden' },
});

const ScopePick = styled.button({
  label: 'library-scope-pick',
  flex: 1,
  display: 'flex',
  alignItems: 'baseline',
  gap: 'var(--ss-space-2)',
  minWidth: 0,
  padding: '6px 0',
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
});

const ScopeLevel = styled.span({
  label: 'library-scope-level',
  flexShrink: 0,
  fontSize: 'var(--ss-size-body-sm)',
  color: 'var(--ss-fg-tertiary)',
});

const ScopeName = styled.span({
  label: 'library-scope-name',
  fontSize: 'var(--ss-size-body-sm)',
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const ScopeExt = styled.span({
  label: 'library-scope-ext',
  flexShrink: 0,
  fontSize: 'var(--ss-size-body-sm)',
  color: 'var(--ss-fg-tertiary)',
});

const PermLead = styled.p({
  label: 'library-perm-lead',
  margin: '0 0 var(--ss-space-4)',
  fontSize: 'var(--ss-size-body-sm)',
  color: 'var(--ss-fg-secondary)',
  '& strong': { color: 'var(--ss-fg-primary)', fontWeight: 700 },
});

const PermList = styled.div({
  label: 'library-perm-list',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--ss-space-2)',
});

const PermRow = styled.div({
  label: 'library-perm-row',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--ss-space-3)',
  padding: 'var(--ss-space-3)',
  border: '1px solid var(--ss-border-default)',
  borderRadius: 'var(--ss-rd-4)',
});

const Avatar = styled.span({
  label: 'library-perm-avatar',
  width: 'var(--ss-space-8)',
  height: 'var(--ss-space-8)',
  borderRadius: 'var(--ss-rd-pill)',
  background: 'var(--ss-dark-blue)',
  color: 'var(--ss-fg-on-dark)',
  fontSize: 'var(--ss-size-special)',
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  '&[data-off="true"]': { background: 'var(--ss-grey-600)' },
});

const PermMeta = styled.div({ label: 'library-perm-meta', flex: 1, minWidth: 0 });
const PermName = styled.div({ label: 'library-perm-name', fontWeight: 600, fontSize: 'var(--ss-size-body-sm)' });
const PermNote = styled.div({ label: 'library-perm-note', fontSize: 'var(--ss-size-body-sm)', color: 'var(--ss-fg-secondary)' });

const Toggle = styled.button<{ on: boolean }>(({ on }) => ({
  label: 'library-toggle',
  position: 'relative',
  width: 'calc(var(--ss-space-8) + var(--ss-space-1))',
  height: 'var(--ss-space-6)',
  borderRadius: 'var(--ss-rd-pill)',
  background: on ? 'var(--ss-sky-blue)' : 'var(--ss-grey-400)',
  border: 'none',
  cursor: 'pointer',
  flexShrink: 0,
  padding: 0,
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 'var(--ss-space-1)',
    left: on ? 'auto' : 'var(--ss-space-1)',
    right: on ? 'var(--ss-space-1)' : 'auto',
    width: 'var(--ss-space-4)',
    height: 'var(--ss-space-4)',
    borderRadius: 'var(--ss-rd-pill)',
    background: 'var(--ss-white)',
  },
}));

const ViewerKicker = styled.p({
  label: 'library-viewer-kicker',
  margin: '0 0 var(--ss-space-3)',
  fontSize: 'var(--ss-size-body-sm)',
  color: 'var(--ss-fg-secondary)',
});

const PdfStage = styled.div({
  label: 'library-pdf-stage',
  minHeight: 'calc(var(--ss-space-8) * 8)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--ss-space-2)',
  background: 'var(--ss-bg-app)',
  border: '1px solid var(--ss-border-default)',
  borderRadius: 'var(--ss-rd-4)',
  color: 'var(--ss-dark-blue)',
  transformOrigin: 'top center',
});

const MediaStage = styled.div({
  label: 'library-media-stage',
  minHeight: 'calc(var(--ss-space-8) * 8)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--ss-space-2)',
  background: 'var(--ss-dark-blue)',
  borderRadius: 'var(--ss-rd-4)',
  color: 'var(--ss-fg-on-dark)',
});

const CustomStage = styled.pre({
  label: 'library-custom-stage',
  margin: 0,
  whiteSpace: 'pre-wrap',
  fontFamily: 'var(--ss-font-sans)',
  fontSize: 'var(--ss-size-body)',
  lineHeight: 'var(--ss-lh-relaxed)',
  color: 'var(--ss-fg-primary)',
});

const StageTitle = styled.div({ label: 'library-stage-title', fontWeight: 700, fontSize: 'var(--ss-size-body)' });
const StageSub = styled.div({ label: 'library-stage-sub', fontSize: 'var(--ss-size-body-sm)', fontWeight: 400 });

const PlayButton = styled.button({
  label: 'library-play',
  width: 'calc(var(--ss-space-8) + var(--ss-space-2))',
  height: 'calc(var(--ss-space-8) + var(--ss-space-2))',
  borderRadius: 'var(--ss-rd-pill)',
  border: 'none',
  background: 'var(--ss-sky-blue)',
  color: 'var(--ss-fg-on-dark)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&:disabled': { cursor: 'default' },
});

const Menu = styled.div({
  label: 'library-menu',
  position: 'fixed',
  zIndex: 70,
  minWidth: 'calc(var(--ss-space-8) * 6)',
  background: 'var(--ss-bg-surface)',
  border: '1px solid var(--ss-border-default)',
  borderRadius: 'var(--ss-rd-4)',
  boxShadow: 'var(--ss-shadow-3)',
  padding: 'var(--ss-space-1)',
});

const MenuItem = styled.button({
  label: 'library-menu-item',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--ss-space-2)',
  width: '100%',
  padding: 'var(--ss-space-2) var(--ss-space-3)',
  border: 'none',
  background: 'transparent',
  borderRadius: 'var(--ss-rd-4)',
  color: 'var(--ss-fg-primary)',
  fontFamily: 'var(--ss-font-sans)',
  fontSize: 'var(--ss-size-body-sm)',
  fontWeight: 400,
  textAlign: 'left',
  cursor: 'pointer',
  '&:hover': { background: 'var(--ss-bg-app)' },
  '&[data-danger="true"]': { color: 'var(--ss-danger)' },
  '&[data-danger="true"]:hover': { background: 'var(--ss-danger-bg)' },
});

const MenuDivider = styled.div({
  label: 'library-menu-divider',
  height: '1px',
  background: 'var(--ss-grey-300)',
  margin: 'var(--ss-space-1) 0',
});
