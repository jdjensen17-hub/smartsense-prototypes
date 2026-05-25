// ── attributes.ts ─────────────────────────────────────────────────────────────
// Location attribute definitions and per-location seed values.

export type AttributeType = 'Location Attribute' | 'Item Group';
export type ValueType = 'Boolean' | 'Numeric' | 'Enum';

export type AttributeDef = {
  id: string;
  name: string;
  description: string;
  tagType: AttributeType;
  valueType: ValueType;
  // Enum only — list of allowed values
  enumValues?: string[];
  // Item Group only — display color (hex) and emoji icon
  color?: string;
  icon?: string;
  // Metadata
  lastModified: string;
};

export type LocationAttributeValue = {
  locationId: string;
  attributeId: string;
  // Boolean → 'true' | 'false', Numeric → stringified number, Enum → one of enumValues
  value: string;
};

// ── Attribute definitions ─────────────────────────────────────────────────────

export const ATTRIBUTE_DEFS: AttributeDef[] = [
  {
    id: 'attr_pizza',
    name: 'Pizza',
    description: 'Location offers a pizza program.',
    tagType: 'Location Attribute',
    valueType: 'Boolean',
    lastModified: '2026-04-12',
  },
  {
    id: 'attr_breakfast',
    name: 'Breakfast',
    description: 'Location offers a breakfast program.',
    tagType: 'Location Attribute',
    valueType: 'Boolean',
    lastModified: '2026-04-12',
  },
  {
    id: 'attr_drivethu',
    name: 'Drive-Thru',
    description: 'Location supports drive-thru service.',
    tagType: 'Location Attribute',
    valueType: 'Boolean',
    lastModified: '2026-03-28',
  },
  {
    id: 'attr_wifi',
    name: 'Free Wi-Fi',
    description: 'Customers can access free Wi-Fi at the location.',
    tagType: 'Location Attribute',
    valueType: 'Boolean',
    lastModified: '2026-03-10',
  },
  {
    id: 'attr_lottery',
    name: 'Lottery',
    description: 'Location sells lottery tickets.',
    tagType: 'Location Attribute',
    valueType: 'Boolean',
    lastModified: '2026-02-14',
  },
  {
    id: 'attr_liquor',
    name: 'Liquor',
    description: 'Location is licensed to sell liquor.',
    tagType: 'Location Attribute',
    valueType: 'Boolean',
    lastModified: '2026-02-01',
  },
  {
    id: 'attr_yogurt_machines',
    name: 'Yogurt Machines',
    description: 'Number of frozen yogurt machines on site.',
    tagType: 'Location Attribute',
    valueType: 'Numeric',
    lastModified: '2026-03-15',
  },
  {
    id: 'attr_yogurt_toppings',
    name: 'Yogurt Toppings',
    description: 'Number of topping options available at the yogurt station.',
    tagType: 'Location Attribute',
    valueType: 'Numeric',
    lastModified: '2026-03-15',
  },
  {
    id: 'attr_offer_type',
    name: 'Offer Type',
    description: 'Primary food offering category at this location.',
    tagType: 'Location Attribute',
    valueType: 'Enum',
    enumValues: ['Breakfast & Pizza', 'Breakfast/Chicken/Pizza', 'To Be Upgraded'],
    lastModified: '2026-02-09',
  },
  {
    id: 'attr_store_type',
    name: 'Store Type',
    description: 'Physical store format classification.',
    tagType: 'Location Attribute',
    valueType: 'Enum',
    enumValues: ['5K Remodel', '5.5K', '6K', 'Legacy Remodel', 'Legacy Non-Remodel', 'EDO', 'Travel Center'],
    lastModified: '2026-01-20',
  },
  // ── Item Groups ──────────────────────────────────────────────────────────────
  {
    id: 'attr_cleanliness',
    name: 'Cleanliness',
    description: 'Checklist scoring group for cleanliness items.',
    tagType: 'Item Group',
    valueType: 'Boolean',
    color: '#C62828',
    icon: '🧹',
    lastModified: '2026-01-22',
  },
  {
    id: 'attr_food_safety',
    name: 'Food Safety',
    description: 'Checklist scoring group for food safety compliance.',
    tagType: 'Item Group',
    valueType: 'Boolean',
    color: '#1565C0',
    icon: '🌡️',
    lastModified: '2026-01-22',
  },
  {
    id: 'attr_operations',
    name: 'Operations',
    description: 'Checklist scoring group for general operations.',
    tagType: 'Item Group',
    valueType: 'Boolean',
    color: '#2E7D32',
    icon: '⚙️',
    lastModified: '2026-01-22',
  },
];

// ── Seed locations ─────────────────────────────────────────────────────────────

export type LocationDef = {
  id: string;
  name: string;
  region: string;
  area: string;
};

export const SEED_LOCATIONS: LocationDef[] = [
  { id: 'loc_266',  name: 'Store 266 – Slidell',       region: 'Louisiana',    area: 'Area 5' },
  { id: 'loc_2405', name: 'Store 2405 – Baton Rouge',  region: 'Louisiana',    area: 'Area 3' },
  { id: 'loc_84',   name: 'Store 84 – Hammond',        region: 'Louisiana',    area: 'Area 3' },
  { id: 'loc_92',   name: 'Store 92 – Kenner',         region: 'Louisiana',    area: 'Area 4' },
  { id: 'loc_117',  name: 'Store 117 – Baton Rouge',   region: 'Louisiana',    area: 'Area 1' },
  { id: 'loc_131',  name: 'Store 131 – LaPlace',       region: 'Louisiana',    area: 'Area 2' },
  { id: 'loc_237',  name: 'Store 237 – Gonzales',      region: 'Louisiana',    area: 'Area 2' },
  { id: 'loc_243',  name: 'Store 243 – Hammond',       region: 'Louisiana',    area: 'Area 3' },
  { id: 'loc_482',  name: 'Store 482 – St. Rose',      region: 'Louisiana',    area: 'Area 4' },
  { id: 'loc_2338', name: 'Store 2338 – Davenport',    region: 'West Florida', area: 'Area 4' },
  { id: 'loc_59',   name: 'Store 59 – Crystal River',  region: 'West Florida', area: 'Area 7' },
  { id: 'loc_87',   name: 'Store 87 – Tampa',          region: 'West Florida', area: 'Area 8' },
  { id: 'loc_97',   name: 'Store 97 – Inverness',      region: 'West Florida', area: 'Area 7' },
  { id: 'loc_126',  name: 'Store 126 – Sarasota',      region: 'West Florida', area: 'Area 3' },
  { id: 'loc_148',  name: 'Store 148 – Groveland',     region: 'West Florida', area: 'Area 7' },
  { id: 'loc_165',  name: 'Store 165 – Tampa',         region: 'West Florida', area: 'Area 8' },
  { id: 'loc_283',  name: 'Store 283 – Davenport',     region: 'West Florida', area: 'Area 4' },
  { id: 'loc_552',  name: 'Store 552 – Tampa',         region: 'West Florida', area: 'Area 5' },
  { id: 'loc_622',  name: 'Store 622 – Lutz',          region: 'West Florida', area: 'Area 2' },
  { id: 'loc_2560', name: 'Store 2560 – Davenport',    region: 'West Florida', area: 'Area 4' },
];

// ── Per-location attribute values ─────────────────────────────────────────────

export const SEED_ATTRIBUTE_VALUES: LocationAttributeValue[] = [
  // Pizza
  { locationId: 'loc_266',  attributeId: 'attr_pizza', value: 'true' },
  { locationId: 'loc_2405', attributeId: 'attr_pizza', value: 'true' },
  { locationId: 'loc_84',   attributeId: 'attr_pizza', value: 'true' },
  { locationId: 'loc_92',   attributeId: 'attr_pizza', value: 'true' },
  { locationId: 'loc_117',  attributeId: 'attr_pizza', value: 'true' },
  { locationId: 'loc_131',  attributeId: 'attr_pizza', value: 'true' },
  { locationId: 'loc_237',  attributeId: 'attr_pizza', value: 'true' },
  { locationId: 'loc_243',  attributeId: 'attr_pizza', value: 'true' },
  { locationId: 'loc_482',  attributeId: 'attr_pizza', value: 'true' },
  { locationId: 'loc_2338', attributeId: 'attr_pizza', value: 'true' },
  { locationId: 'loc_59',   attributeId: 'attr_pizza', value: 'true' },
  { locationId: 'loc_87',   attributeId: 'attr_pizza', value: 'true' },
  { locationId: 'loc_97',   attributeId: 'attr_pizza', value: 'true' },
  { locationId: 'loc_126',  attributeId: 'attr_pizza', value: 'true' },
  { locationId: 'loc_148',  attributeId: 'attr_pizza', value: 'true' },
  { locationId: 'loc_165',  attributeId: 'attr_pizza', value: 'false' },
  { locationId: 'loc_283',  attributeId: 'attr_pizza', value: 'true' },
  { locationId: 'loc_552',  attributeId: 'attr_pizza', value: 'true' },
  { locationId: 'loc_622',  attributeId: 'attr_pizza', value: 'true' },
  { locationId: 'loc_2560', attributeId: 'attr_pizza', value: 'true' },
  // Drive-Thru
  { locationId: 'loc_237',  attributeId: 'attr_drivethu', value: 'true' },
  { locationId: 'loc_482',  attributeId: 'attr_drivethu', value: 'true' },
  { locationId: 'loc_2560', attributeId: 'attr_drivethu', value: 'true' },
  // Yogurt Machines
  { locationId: 'loc_266',  attributeId: 'attr_yogurt_machines', value: '4' },
  { locationId: 'loc_2405', attributeId: 'attr_yogurt_machines', value: '4' },
  { locationId: 'loc_84',   attributeId: 'attr_yogurt_machines', value: '5' },
  { locationId: 'loc_92',   attributeId: 'attr_yogurt_machines', value: '5' },
  { locationId: 'loc_117',  attributeId: 'attr_yogurt_machines', value: '4' },
  { locationId: 'loc_131',  attributeId: 'attr_yogurt_machines', value: '5' },
  { locationId: 'loc_126',  attributeId: 'attr_yogurt_machines', value: '5' },
  { locationId: 'loc_283',  attributeId: 'attr_yogurt_machines', value: '5' },
  { locationId: 'loc_552',  attributeId: 'attr_yogurt_machines', value: '5' },
  { locationId: 'loc_622',  attributeId: 'attr_yogurt_machines', value: '5' },
  // Offer Type
  { locationId: 'loc_266',  attributeId: 'attr_offer_type', value: 'Breakfast & Pizza' },
  { locationId: 'loc_2405', attributeId: 'attr_offer_type', value: 'Breakfast & Pizza' },
  { locationId: 'loc_84',   attributeId: 'attr_offer_type', value: 'Breakfast & Pizza' },
  { locationId: 'loc_92',   attributeId: 'attr_offer_type', value: 'Breakfast & Pizza' },
  { locationId: 'loc_117',  attributeId: 'attr_offer_type', value: 'Breakfast & Pizza' },
  { locationId: 'loc_237',  attributeId: 'attr_offer_type', value: 'Breakfast/Chicken/Pizza' },
  { locationId: 'loc_243',  attributeId: 'attr_offer_type', value: 'To Be Upgraded' },
  { locationId: 'loc_148',  attributeId: 'attr_offer_type', value: 'Breakfast/Chicken/Pizza' },
  { locationId: 'loc_165',  attributeId: 'attr_offer_type', value: 'To Be Upgraded' },
  { locationId: 'loc_2560', attributeId: 'attr_offer_type', value: 'Breakfast & Pizza' },
  // Lottery
  { locationId: 'loc_266',  attributeId: 'attr_lottery', value: 'true' },
  { locationId: 'loc_2405', attributeId: 'attr_lottery', value: 'true' },
  { locationId: 'loc_84',   attributeId: 'attr_lottery', value: 'true' },
  { locationId: 'loc_92',   attributeId: 'attr_lottery', value: 'true' },
  { locationId: 'loc_117',  attributeId: 'attr_lottery', value: 'true' },
  { locationId: 'loc_131',  attributeId: 'attr_lottery', value: 'true' },
  { locationId: 'loc_2338', attributeId: 'attr_lottery', value: 'true' },
  { locationId: 'loc_59',   attributeId: 'attr_lottery', value: 'true' },
  { locationId: 'loc_87',   attributeId: 'attr_lottery', value: 'true' },
  { locationId: 'loc_126',  attributeId: 'attr_lottery', value: 'true' },
  { locationId: 'loc_283',  attributeId: 'attr_lottery', value: 'true' },
  // Liquor
  { locationId: 'loc_117',  attributeId: 'attr_liquor', value: 'true' },
  { locationId: 'loc_482',  attributeId: 'attr_liquor', value: 'true' },
];
