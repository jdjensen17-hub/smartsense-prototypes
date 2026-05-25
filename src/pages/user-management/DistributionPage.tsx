import React, { useState } from 'react';
import { Icon } from '@/components/shared/Icon';
import {
  mdiArrowLeft,
  mdiDotsVertical,
  mdiStore,
  mdiInformationOutline,
  mdiMagnify,
  mdiEarth,
  mdiTag,
  mdiOfficeBuilding,
  mdiBroadcast,
} from '@/icons/mdi';

// ── Types ─────────────────────────────────────────────────────────────────────

type ConditionType = 'all_locations' | 'org_node' | 'attribute';

interface Condition {
  id: string;
  type: ConditionType;
  value?: string;
  sublabel?: string;
  locationCount?: number;
}

interface Rule {
  id: string;
  conditions: Condition[];
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const TOTAL_LOCATIONS = 612;

const ORG_NODES = [
  { value: 'East Division',  sublabel: 'Division · 210 locations', locationCount: 210 },
  { value: 'West Division',  sublabel: 'Division · 198 locations', locationCount: 198 },
  { value: 'South Division', sublabel: 'Division · 143 locations', locationCount: 143 },
  { value: 'District 12',    sublabel: 'District · 24 locations',  locationCount: 24  },
  { value: 'District 13',    sublabel: 'District · 19 locations',  locationCount: 19  },
  { value: 'District 21',    sublabel: 'District · 31 locations',  locationCount: 31  },
  { value: 'West Region',    sublabel: 'Region · 87 locations',    locationCount: 87  },
  { value: 'East Region',    sublabel: 'Region · 95 locations',    locationCount: 95  },
  { value: 'Central Region', sublabel: 'Region · 62 locations',    locationCount: 62  },
];

const ATTRIBUTES = [
  { value: 'Drive-Thru',             sublabel: 'Location attribute', locationCount: 280 },
  { value: 'Pizza',                  sublabel: 'Location attribute', locationCount: 195 },
  { value: 'Dine-In',               sublabel: 'Location attribute', locationCount: 310 },
  { value: 'Catering',              sublabel: 'Location attribute', locationCount: 88  },
  { value: 'Open 24 Hours',         sublabel: 'Location attribute', locationCount: 412 },
  { value: 'Fuel Station',          sublabel: 'Location attribute', locationCount: 320 },
  { value: 'Onion Ring Market Test', sublabel: 'Location attribute', locationCount: 43  },
];

// ── Reach computation ─────────────────────────────────────────────────────────

function computeReach(rules: Rule[]): number {
  if (rules.length === 0) return 0;
  const ruleRatios = rules.map(rule => {
    if (rule.conditions.length === 0) return 0;
    if (rule.conditions.some(c => c.type === 'all_locations')) return 1;
    return rule.conditions.reduce((acc, c) => {
      const count = c.locationCount ?? 0;
      return acc * (count / TOTAL_LOCATIONS);
    }, 1);
  });
  const unionRatio = 1 - ruleRatios.reduce((acc, r) => acc * (1 - r), 1);
  return Math.round(unionRatio * TOTAL_LOCATIONS);
}

// ── ID generator ──────────────────────────────────────────────────────────────

let _seq = 0;
function uid() { return `r${++_seq}`; }

// ── Type badge ────────────────────────────────────────────────────────────────

const BADGE_CONFIG: Record<ConditionType, {
  bg: string; text: string; border: string; label: string; iconPath: string;
}> = {
  all_locations: { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', label: 'All Locations', iconPath: mdiEarth },
  org_node:      { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', label: 'Org Node',      iconPath: mdiOfficeBuilding },
  attribute:     { bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA', label: 'Attribute',     iconPath: mdiTag },
};

function TypeBadge({ type }: { type: ConditionType }) {
  const { bg, text, border, label } = BADGE_CONFIG[type];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      borderRadius: 12, padding: '2px 8px',
      fontSize: 11, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      backgroundColor: bg, color: text, border: `1px solid ${border}`,
      whiteSpace: 'nowrap', flexShrink: 0,
      minWidth: 90, justifyContent: 'center',
    }}>
      {label}
    </span>
  );
}

// ── Shared button styles ──────────────────────────────────────────────────────

const outlineButtonStyle: React.CSSProperties = {
  padding: '6px 16px',
  fontSize: 13,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderRadius: 4,
  border: '1px solid #1678C2',
  backgroundColor: '#ffffff',
  color: '#1678C2',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'background-color 0.1s',
};

const linkButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#1358A0',
  cursor: 'pointer',
  fontSize: 13,
  textTransform: 'uppercase',
  letterSpacing: '1.25px',
  fontFamily: 'inherit',
  padding: '6px 8px',
  borderRadius: 4,
};

// ── Condition picker ──────────────────────────────────────────────────────────

// Type chip — clean outline style, text only
function TypeChip({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    borderRadius: 4,
    border: `1px solid ${disabled ? '#EAEAEA' : hovered ? '#1678C2' : '#BABABA'}`,
    backgroundColor: disabled ? '#F7F7FA' : hovered ? '#F3F3F4' : '#ffffff',
    color: disabled ? '#BABABA' : hovered ? '#1678C2' : '#555555',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.1s',
  };

  return (
    <button
      disabled={disabled}
      onClick={!disabled ? onClick : undefined}
      style={style}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </button>
  );
}

function ConditionPicker({
  onAdd,
  hasAllLocations,
}: {
  onAdd: (condition: Omit<Condition, 'id'>) => void;
  hasAllLocations: boolean;
}) {
  const [step, setStep] = useState<'type' | 'value'>('type');
  const [selectedType, setSelectedType] = useState<'org_node' | 'attribute' | null>(null);
  const [query, setQuery] = useState('');

  function handleTypeClick(type: ConditionType) {
    if (type === 'all_locations') {
      onAdd({ type: 'all_locations', value: 'All Locations', sublabel: '612 locations', locationCount: 612 });
    } else {
      setSelectedType(type as 'org_node' | 'attribute');
      setStep('value');
    }
  }

  function handleValueSelect(r: { value: string; sublabel: string; locationCount: number }) {
    onAdd({
      type: selectedType as ConditionType,
      value: r.value,
      sublabel: r.sublabel,
      locationCount: r.locationCount,
    });
    // Auto-reset to type step — no Back button needed
    setStep('type');
    setSelectedType(null);
    setQuery('');
  }

  const results = selectedType === 'org_node'
    ? ORG_NODES.filter(n => n.value.toLowerCase().includes(query.toLowerCase()))
    : selectedType === 'attribute'
    ? ATTRIBUTES.filter(a => a.value.toLowerCase().includes(query.toLowerCase()))
    : [];

  const chips: { type: ConditionType; label: string; disabled: boolean }[] = [
    { type: 'all_locations', label: 'ALL LOCATIONS', disabled: hasAllLocations },
    { type: 'org_node',      label: 'ORG NODE',      disabled: false },
    { type: 'attribute',     label: 'ATTRIBUTE',     disabled: false },
  ];

  return (
    <div style={{ paddingTop: 0 }}>
      {step === 'type' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {chips.map(({ type, label, disabled }) => (
            <TypeChip
              key={type}
              label={label}
              disabled={disabled}
              onClick={() => handleTypeClick(type)}
            />
          ))}
        </div>
      ) : (
        <div>
          {/* Search input */}
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 10, top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              display: 'flex', alignItems: 'center',
            }}>
              <Icon path={mdiMagnify} size={15} color="#9BA0B0" />
            </span>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Search ${selectedType === 'org_node' ? 'org nodes' : 'attributes'}…`}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1px solid #BABABA', borderRadius: 4,
                padding: '8px 12px 8px 34px',
                fontSize: 14, color: '#181D1F',
                outline: 'none', fontFamily: 'inherit',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#1678C2'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#BABABA'; }}
            />
          </div>

          {/* Results */}
          <div style={{
            marginTop: 4,
            border: '1px solid #DBDBDB', borderRadius: 4,
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            maxHeight: 200, overflowY: 'auto',
          }}>
            {results.length === 0 ? (
              <div style={{ padding: '10px 14px', fontSize: 13, color: '#9BA0B0' }}>No results</div>
            ) : results.map(r => (
              <button
                key={r.value}
                onClick={() => handleValueSelect(r)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 14px', border: 'none',
                  borderBottom: '1px solid #F3F3F4',
                  backgroundColor: 'transparent', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div style={{ fontSize: 14, color: '#181D1F', fontWeight: 500 }}>{r.value}</div>
                <div style={{ fontSize: 12, color: '#9BA0B0', marginTop: 1 }}>{r.sublabel}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Rule card ─────────────────────────────────────────────────────────────────

function RuleCard({
  rule,
  index,
  onDelete,
  onAddCondition,
  onRemoveCondition,
}: {
  rule: Rule;
  index: number;
  onDelete: () => void;
  onAddCondition: (ruleId: string, cond: Omit<Condition, 'id'>) => void;
  onRemoveCondition: (ruleId: string, conditionId: string) => void;
}) {
  const hasAllLocations = rule.conditions.some(c => c.type === 'all_locations');

  function handleAdd(cond: Omit<Condition, 'id'>) {
    onAddCondition(rule.id, cond);
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #DBDBDB',
      borderRadius: 4,
      padding: '16px 20px 20px',
      minHeight: 100,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 0 }}>
        <div style={{ flex: 1 }}>
          <span style={{
            fontSize: 13, fontWeight: 700, color: '#6B7280',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            display: 'block', lineHeight: '28px',
          }}>
            Rule {index + 1}
          </span>
        </div>
        <button
          onClick={onDelete}
          style={{
            background: 'none', border: 'none',
            color: '#9BA0B0', fontSize: 13,
            fontWeight: 500, letterSpacing: '0.05em',
            textTransform: 'uppercase',
            cursor: 'pointer', padding: '4px 8px',
            lineHeight: '28px',
            borderRadius: 4, fontFamily: 'inherit',
            transition: 'color 0.1s, background-color 0.1s',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#E53935';
            e.currentTarget.style.backgroundColor = '#FEF2F2';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#9BA0B0';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          DELETE
        </button>
      </div>

      {/* Subheading — only when conditions exist */}
      {rule.conditions.length > 0 && (
        <div style={{ fontSize: 12, color: '#9BA0B0', marginBottom: 10, marginTop: 2 }}>
          Location must match ALL of the following:
        </div>
      )}

      {/* Conditions — each in its own container */}
      {rule.conditions.map((cond) => (
        <div
          key={cond.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 0,
            padding: '8px 10px',
            marginBottom: 6,
            backgroundColor: '#FAFBFC',
            border: '1px solid #EBEBEB',
            borderRadius: 4,
          }}
        >
          {/* Fixed-width pill column — sized to ALL LOCATIONS + breathing room */}
          <div style={{ width: 115, flexShrink: 0 }}>
            <TypeBadge type={cond.type} />
          </div>
          {/* Condition name */}
          <span style={{ flex: 1, fontSize: 14, color: '#181D1F', fontWeight: 500, minWidth: 0 }}>
            {cond.value ?? 'All Locations'}
          </span>
          {/* Location count — structural color so it doesn't blend with × */}
          {cond.locationCount && (
            <span style={{ fontSize: 12, color: '#6B7280', flexShrink: 0, marginRight: 8 }}>
              {cond.locationCount.toLocaleString()} locations
            </span>
          )}
          {/* Remove × */}
          <button
            onClick={() => onRemoveCondition(rule.id, cond.id)}
            aria-label="Remove condition"
            style={{
              width: 24, height: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, background: 'none', border: 'none',
              color: '#BABABA', cursor: 'pointer',
              fontSize: 18, lineHeight: 1,
              transition: 'color 0.1s', borderRadius: 4,
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E53935'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#BABABA'; }}
          >
            ×
          </button>
        </div>
      ))}

      {/* ADD CONDITION — help text style label + type chips */}
      {!hasAllLocations && (
        <div style={{ marginTop: rule.conditions.length > 0 ? 12 : 24 }}>
          <div style={{ fontSize: 12, color: '#9BA0B0', marginBottom: 8 }}>
            Select a condition type for this rule:
          </div>
          <ConditionPicker
            onAdd={handleAdd}
            hasAllLocations={hasAllLocations}
          />
        </div>
      )}
    </div>
  );
}

// ── OR separator ──────────────────────────────────────────────────────────────

function OrSeparator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
      <div style={{ flex: 1, height: 1, backgroundColor: '#DBDBDB' }} />
      <span style={{
        fontSize: 11, fontWeight: 700, color: '#9BA0B0',
        letterSpacing: '0.1em',
      }}>
        OR
      </span>
      <div style={{ flex: 1, height: 1, backgroundColor: '#DBDBDB' }} />
    </div>
  );
}

// ── Reach box ─────────────────────────────────────────────────────────────────

function ReachBox({ reach }: { reach: number }) {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      backgroundColor: '#ffffff',
      border: '1px solid #DBDBDB', borderRadius: 4,
      padding: '8px 16px',
    }}>
      <span style={{ display: 'flex', alignItems: 'center' }}>
        <Icon path={mdiStore} size={32} color="#1678C2" />
      </span>
      <span style={{ fontSize: 13 }}>
        {reach === 0 ? (
          <span style={{ color: '#9BA0B0' }}>Not assigned to any locations</span>
        ) : (
          <span style={{ color: '#555555' }}>
            Will be sent to{' '}
            <span style={{ fontWeight: 600, color: '#181D1F' }}>{reach}</span>
            {' '}locations
          </span>
        )}
      </span>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <button
          style={{
            background: 'none', border: 'none',
            color: '#9BA0B0', cursor: 'pointer',
            padding: 2, display: 'flex', alignItems: 'center',
          }}
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
          aria-label="Reach info"
        >
          <Icon path={mdiInformationOutline} size={14} color="#9BA0B0" />
        </button>
        {tooltipVisible && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 6,
            backgroundColor: '#ffffff',
            border: '1px solid #DBDBDB', borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: '8px 12px',
            fontSize: 12, color: '#555555',
            maxWidth: 220, whiteSpace: 'normal',
            zIndex: 50, lineHeight: 1.5,
            width: 'max-content',
          }}>
            Counts active locations with an Operate or Guard license.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DistributionPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const reach = computeReach(rules);

  function addRule() {
    const id = uid();
    setRules(prev => [...prev, { id, conditions: [] }]);
    setIsDirty(true);
  }

  function addAllLocationsRule() {
    const id = uid();
    setRules(prev => [...prev, {
      id,
      conditions: [{
        id: uid(),
        type: 'all_locations',
        value: 'All Locations',
        sublabel: '612 locations',
        locationCount: 612,
      }],
    }]);
    setIsDirty(true);
  }

  function deleteRule(ruleId: string) {
    setRules(prev => prev.filter(r => r.id !== ruleId));
    setIsDirty(true);
  }

  function addCondition(ruleId: string, cond: Omit<Condition, 'id'>) {
    setRules(prev => prev.map(r =>
      r.id === ruleId
        ? { ...r, conditions: [...r.conditions, { ...cond, id: uid() }] }
        : r
    ));
    setIsDirty(true);
  }

  function removeCondition(ruleId: string, conditionId: string) {
    setRules(prev => prev.map(r =>
      r.id === ruleId
        ? { ...r, conditions: r.conditions.filter(c => c.id !== conditionId) }
        : r
    ));
    setIsDirty(true);
  }

  function handleSave() {
    setIsDirty(false);
  }

  const tabs = ['Items', 'Settings', 'Distribution'] as const;

  return (
    <div style={{
      margin: '-24px -32px',
      backgroundColor: '#ffffff',
      minHeight: 'calc(100vh - 52px)',
      fontFamily: "'Open Sans', sans-serif",
    }}>

      {/* ── Full-width header ── */}
      <div style={{ padding: '24px 32px 0' }}>

        {/* Identity bar */}
        <div style={{
          position: 'relative', display: 'flex',
          alignItems: 'center', marginBottom: 16,
        }}>
          {/* Left: back + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              style={{
                background: 'none', border: 'none',
                cursor: 'pointer', padding: 4,
                display: 'flex', alignItems: 'center',
                borderRadius: 4,
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F7F7FA'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              aria-label="Back"
            >
              <Icon path={mdiArrowLeft} size={20} color="#555555" />
            </button>
            <span style={{ fontSize: 24, fontWeight: 400, color: '#555555' }}>
              Pizza Temperature Log
            </span>
          </div>

          {/* Center: reach box */}
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <ReachBox reach={reach} />
          </div>

          {/* Right: save + kebab */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={!isDirty}
              style={{
                padding: '8px 24px',
                fontSize: 13, fontWeight: 500,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                borderRadius: 4, border: 'none',
                cursor: isDirty ? 'pointer' : 'default',
                backgroundColor: isDirty ? '#1678C2' : '#EAEAEA',
                color: isDirty ? '#ffffff' : 'rgba(0,0,0,0.38)',
                transition: 'background-color 0.15s, color 0.15s',
                fontFamily: 'inherit',
              }}
            >
              Save
            </button>
            <button
              style={{
                background: 'none', border: 'none',
                color: '#6B7280', cursor: 'pointer',
                padding: 4, borderRadius: 4,
                display: 'flex', alignItems: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F7F7FA'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              aria-label="More options"
            >
              <Icon path={mdiDotsVertical} size={18} color="#6B7280" />
            </button>
          </div>
        </div>

        {/* Tabs bar */}
        <div style={{ borderBottom: '1px solid #B9B9B9', display: 'flex' }}>
          {tabs.map(tab => {
            const active = tab === 'Distribution';
            return (
              <button
                key={tab}
                style={{
                  background: 'none', border: 'none',
                  borderBottom: active ? '2px solid #1678C2' : '2px solid transparent',
                  padding: '12px 10px',
                  marginRight: 80,
                  marginBottom: -1,
                  fontSize: 14,
                  textTransform: 'uppercase',
                  color: active ? '#1678C2' : '#6B7280',
                  fontWeight: active ? 600 : 400,
                  cursor: active ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content area — 860px centered ── */}
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Empty state */}
        {rules.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center',
            padding: '60px 24px',
          }}>
            <div style={{ marginBottom: 16 }}>
              <Icon path={mdiBroadcast} size={40} color="#1678C2" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#555555', marginBottom: 6 }}>
              No locations will receive this template.
            </div>
            <div style={{ fontSize: 14, color: '#9BA0B0', marginBottom: 24 }}>
              Add a rule to define which locations receive this template.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* ADD RULE — outline button */}
              <button
                onClick={addRule}
                style={{ ...outlineButtonStyle }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F3F3F4'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
              >
                ADD RULE
              </button>
              {/* ASSIGN TO ALL LOCATIONS — link button */}
              <button
                onClick={addAllLocationsRule}
                style={{ ...linkButtonStyle }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E1F5FF'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                ASSIGN TO ALL LOCATIONS
              </button>
            </div>
          </div>
        )}

        {/* Rules list */}
        {rules.length > 0 && (
          <div style={{ paddingTop: 24, paddingBottom: 80 }}>
            {rules.map((rule, i) => (
              <React.Fragment key={rule.id}>
                {i > 0 && <OrSeparator />}
                <RuleCard
                  rule={rule}
                  index={i}
                  onDelete={() => deleteRule(rule.id)}
                  onAddCondition={addCondition}
                  onRemoveCondition={removeCondition}
                />
              </React.Fragment>
            ))}

            {/* Also Include */}
            <div style={{ marginTop: 16 }}>
              <button
                onClick={addRule}
                style={{
                  background: 'none', border: 'none',
                  color: '#1358A0', fontSize: 13,
                  fontWeight: 500, letterSpacing: '1.25px',
                  textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'inherit',
                  padding: '6px 8px', borderRadius: 4,
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E1F5FF'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                + ADD RULE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
