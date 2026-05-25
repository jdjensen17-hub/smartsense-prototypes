// ── locationManagement.ts ──────────────────────────────────────────────────────
// Seed data for the Location Tag Management page prototype.

export type AttrValueType = 'Boolean' | 'Numeric' | 'Enum';

export type AttrDef = {
  id: string;
  name: string;
  valueType: AttrValueType;
  enumValues?: string[];
};

export type Location = {
  id: string;
  storeId: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  region: string;
};

export type LocationAttrValues = Record<string, string>;

// ── Attribute definitions ─────────────────────────────────────────────────────

export const ATTR_DEFS: AttrDef[] = [
  { id: 'bulk_def',         name: 'Bulk DEF',                valueType: 'Boolean' },
  { id: 'check_cashing',    name: 'Check Cashing',           valueType: 'Boolean' },
  { id: 'chicken',          name: 'Chicken',                 valueType: 'Boolean' },
  { id: 'coam',             name: 'COAM',                    valueType: 'Boolean' },
  { id: 'comdata',          name: 'Comdata',                 valueType: 'Boolean' },
  { id: 'dcm',              name: 'DCM',                     valueType: 'Boolean' },
  { id: 'drive_thru',       name: 'Drive Thru',              valueType: 'Boolean' },
  { id: 'ev_charger',       name: 'EV Charger',              valueType: 'Boolean' },
  { id: 'freal_machine',    name: "F'real Machine",          valueType: 'Boolean' },
  { id: 'franchise',        name: 'Franchise',               valueType: 'Boolean' },
  { id: 'heat_slide',       name: 'Heat Slide',              valueType: 'Boolean' },
  { id: 'high_flow_diesel', name: 'High Flow Diesel',        valueType: 'Boolean' },
  { id: 'liquor_sales',     name: 'Liquor Sales',            valueType: 'Boolean' },
  { id: 'lottery',          name: 'Lottery',                 valueType: 'Boolean' },
  { id: 'self_checkout',    name: 'Self Checkout',           valueType: 'Boolean' },
  { id: 'truck_parking',    name: 'Truck Parking',           valueType: 'Boolean' },
  { id: 'truck_scale',      name: 'Truck Scale',             valueType: 'Boolean' },
  { id: 'yogurt',           name: 'Yogurt',                  valueType: 'Boolean' },
  { id: 'b2c_machines',     name: 'B2C Machines',            valueType: 'Numeric',
    enumValues: ['3','4','5','6','7'] },
  { id: 'backcourt_lanes',  name: 'Backcourt Lanes',         valueType: 'Numeric',
    enumValues: ['2.5','3','3.5','4','4.5','5','5.5','6','6.5','7','7.5'] },
  { id: 'bulk_def_pumps',   name: 'Bulk DEF Pumps',          valueType: 'Numeric',
    enumValues: ['2.5','3','3.5','4','4.5','5','5.5','6','6.5','7','7.5'] },
  { id: 'fuel_dispensers',  name: 'Fuel Dispensers',         valueType: 'Numeric',
    enumValues: ['1 and 2','3 and 4','5 and 6','7 and 8','9 and 10','11 and 12',
                 '13 and 14','15 and 16','17 and 18','19 and 20','21 and 22',
                 '23 and 24','25 and 26','27 and 28','29 and 30','31 and 32',
                 '33 and 34','35 and 36'] },
  { id: 'hf_diesel_pumps',  name: 'High Flow Diesel Pumps',  valueType: 'Numeric',
    enumValues: ['2.5','3','3.5','4','4.5','5','5.5','6','6.5','7','7.5'] },
  { id: 'yogurt_machines',  name: 'Yogurt Machines',         valueType: 'Numeric',
    enumValues: ['3','4','5'] },
  { id: 'yogurt_toppings',  name: 'Yogurt Toppings',         valueType: 'Numeric',
    enumValues: ['24','25','30','31','41'] },
  { id: 'breakfast_type',   name: 'Breakfast Type',          valueType: 'Enum',
    enumValues: ['AGNG','Legacy'] },
  { id: 'chicken_type',     name: 'Chicken Type',            valueType: 'Enum',
    enumValues: ['Bulk','Packaged'] },
  { id: 'coremarkdc',       name: 'Core-Mark DC',            valueType: 'Enum',
    enumValues: ['Forest City','Fort Worth','Gibsonton','Leitchfield','New Atlanta'] },
  { id: 'pizza_type',       name: 'Pizza Type',              valueType: 'Enum',
    enumValues: ['Bar','Box','Tower'] },
  { id: 'price_sign_type',  name: 'Price Sign Type',         valueType: 'Enum',
    enumValues: ['Acrylic Inserts','AUTO LED','AUTO SCROLL','Electric Scroll',
                 'Electronic Scroll','Flip Book','LED'] },
  { id: 'region',           name: 'Region',                  valueType: 'Enum',
    enumValues: ['CEN','DFW','EFL','GA','LA','North','SFL','TC','WFL'] },
  { id: 'rtd_dc',           name: 'RTD DC',                  valueType: 'Enum',
    enumValues: ['DFW-1100','FL-1137','GA-1133','LA-1145'] },
  { id: 'state',            name: 'State',                   valueType: 'Enum',
    enumValues: ['AL','FL','GA','IN','KY','LA','MS','NC','OH','SC','TN','TX'] },
  { id: 'store_type',       name: 'Store Type',              valueType: 'Enum',
    enumValues: ['5K Non-Remodel','5K Remodel','5.5K','6K','6K Remodel',
                 'EDO','EFC','Legacy Non-Remodel','Legacy Remodel','Travel Center'] },
];

// ── Location generation ───────────────────────────────────────────────────────

const REGIONS: Record<string, { states: string[]; cities: [string, string, string][] }> = {
  GA:    { states: ['GA'], cities: [['Atlanta','GA','30301'],['Marietta','GA','30060'],['Savannah','GA','31401'],['Augusta','GA','30901'],['Macon','GA','31201'],['Columbus','GA','31901'],['Albany','GA','31701'],['Athens','GA','30601'],['Roswell','GA','30075'],['Warner Robins','GA','31088']] },
  CEN:   { states: ['GA','AL'], cities: [['Birmingham','AL','35201'],['Huntsville','AL','35801'],['Montgomery','AL','36101'],['Mobile','AL','36601'],['Dothan','AL','36301'],['Kennesaw','GA','30144'],['Smyrna','GA','30080'],['Decatur','GA','30030'],['Mableton','GA','30126'],['Douglasville','GA','30134']] },
  LA:    { states: ['LA','MS'], cities: [['New Orleans','LA','70112'],['Baton Rouge','LA','70801'],['Shreveport','LA','71101'],['Metairie','LA','70001'],['Lafayette','LA','70501'],['Lake Charles','LA','70601'],['Kenner','LA','70062'],['Bossier City','LA','71111'],['Jackson','MS','39201'],['Hattiesburg','MS','39401']] },
  DFW:   { states: ['TX'], cities: [['Dallas','TX','75201'],['Fort Worth','TX','76101'],['Arlington','TX','76001'],['Plano','TX','75023'],['Irving','TX','75061'],['Garland','TX','75040'],['Frisco','TX','75034'],['McKinney','TX','75069'],['Grand Prairie','TX','75050'],['Mesquite','TX','75149']] },
  TC:    { states: ['TX'], cities: [['Austin','TX','78701'],['San Antonio','TX','78201'],['Waco','TX','76701'],['Killeen','TX','76541'],['Temple','TX','76501'],['Round Rock','TX','78664'],['Cedar Park','TX','78613'],['Georgetown','TX','78626'],['New Braunfels','TX','78130'],['San Marcos','TX','78666']] },
  North: { states: ['IN','KY','OH','TN'], cities: [['Louisville','KY','40201'],['Lexington','KY','40501'],['Nashville','TN','37201'],['Memphis','TN','38101'],['Indianapolis','IN','46201'],['Cincinnati','OH','45201'],['Columbus','OH','43201'],['Chattanooga','TN','37401'],['Knoxville','TN','37901'],['Bowling Green','KY','42101']] },
  EFL:   { states: ['FL'], cities: [['Orlando','FL','32801'],['Jacksonville','FL','32099'],['Gainesville','FL','32601'],['Daytona Beach','FL','32114'],['Palm Bay','FL','32905'],['Melbourne','FL','32901'],['Titusville','FL','32780'],['Ocala','FL','34470'],['Kissimmee','FL','34741'],['Deltona','FL','32725']] },
  WFL:   { states: ['FL'], cities: [['Tampa','FL','33601'],['St. Petersburg','FL','33701'],['Clearwater','FL','33755'],['Sarasota','FL','34230'],['Bradenton','FL','34201'],['Lakeland','FL','33801'],['Winter Haven','FL','33880'],['Spring Hill','FL','34610'],['New Port Richey','FL','34652'],['Lutz','FL','33548']] },
  SFL:   { states: ['FL'], cities: [['Miami','FL','33101'],['Fort Lauderdale','FL','33301'],['West Palm Beach','FL','33401'],['Boca Raton','FL','33431'],['Pompano Beach','FL','33060'],['Coral Springs','FL','33065'],['Hollywood','FL','33019'],['Miramar','FL','33023'],['Deerfield Beach','FL','33441'],['Delray Beach','FL','33444']] },
};

const STREET_PREFIXES = ['100','200','300','400','500','600','700','800','900','1000','1200','1400','1600','1800','2000','2200','2400','2600','2800','3000','3200','3500','4000','4500','5000','5500','6000','7000','8000','9000','10000','12000'];
const STREET_NAMES = ['Main St','Oak Ave','Maple Dr','Highway 41','US Hwy 19','State Rd 50','Peachtree Rd','Commerce Blvd','Industrial Pkwy','Memorial Dr','Veterans Blvd','Airport Rd','College Ave','University Blvd','Market St','Park Ave','Lake Dr','River Rd','Spring Hill Rd','Sunset Blvd'];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function generatePhone(seed: number): string {
  const areaCodes = ['404','770','678','813','727','954','214','817','469','504','225','615','901','502'];
  const area = pick(areaCodes, seed);
  const mid = String(Math.floor(seededRandom(seed * 3) * 900) + 100);
  const last = String(Math.floor(seededRandom(seed * 7) * 9000) + 1000);
  return `(${area}) ${mid}-${last}`;
}

export function generateLocations(): Location[] {
  const regionCounts: Record<string, number> = {
    GA: 95, CEN: 72, LA: 68, DFW: 88, TC: 65, North: 58, EFL: 72, WFL: 66, SFL: 47
  };
  const locations: Location[] = [];
  let storeNum = 51;
  for (const region of Object.keys(regionCounts)) {
    const count = regionCounts[region];
    const { cities } = REGIONS[region];
    for (let i = 0; i < count; i++) {
      const seed = storeNum * 17 + i * 31;
      const [city, state, zip] = pick(cities, seed + i);
      const street = `${pick(STREET_PREFIXES, seed + 5)} ${pick(STREET_NAMES, seed + 9)}`;
      locations.push({
        id: `loc_${storeNum}`,
        storeId: String(storeNum).padStart(4, '0'),
        name: `${String(storeNum).padStart(4, '0')} - ${city}`,
        street, city, state, zip,
        phone: generatePhone(seed),
        region,
      });
      storeNum++;
    }
  }
  return locations;
}

// ── Attribute value generation ────────────────────────────────────────────────
// All locations are fully configured (0% null rate).
// The 15 "needs attention" locations are handled by unsetting store_type
// for those specific store IDs — clean and deterministic.

export function generateAttrValues(locations: Location[]): Record<string, LocationAttrValues> {
  const result: Record<string, LocationAttrValues> = {};

  for (const loc of locations) {
    const seed = parseInt(loc.storeId, 10);
    const vals: LocationAttrValues = {};
    const nullRate = 0; // All locations fully configured
    const r = (offset: number) => seededRandom(seed * 13 + offset);

    // Core structural attributes — almost always set (99%+)
    vals['region'] = loc.region;
    vals['state'] = loc.state;
    if (r(1) > nullRate) {
      const storeTypes = ATTR_DEFS.find(a => a.id === 'store_type')!.enumValues!;
      vals['store_type'] = pick(storeTypes, Math.floor(r(2) * storeTypes.length));
    }
    if (r(3) > nullRate) {
      const fuelOpts = ['5 and 6','7 and 8','9 and 10','11 and 12','13 and 14','15 and 16','17 and 18','19 and 20'];
      vals['fuel_dispensers'] = pick(fuelOpts, Math.floor(r(4) * fuelOpts.length));
    }
    if (r(5) > nullRate) {
      const signs = ATTR_DEFS.find(a => a.id === 'price_sign_type')!.enumValues!;
      vals['price_sign_type'] = pick(signs, Math.floor(r(6) * signs.length));
    }

    // Distribution center assignments — 99% set
    if (r(37) > nullRate) {
      const dcMap: Record<string, string> = { GA:'New Atlanta',CEN:'New Atlanta',LA:'Leitchfield',DFW:'Fort Worth',TC:'Fort Worth',North:'Leitchfield',EFL:'Gibsonton',WFL:'Gibsonton',SFL:'Gibsonton' };
      vals['coremarkdc'] = dcMap[loc.region] || 'New Atlanta';
    }
    if (r(38) > nullRate) {
      const rtdMap: Record<string, string> = { GA:'GA-1133',CEN:'GA-1133',LA:'LA-1145',DFW:'DFW-1100',TC:'DFW-1100',North:'LA-1145',EFL:'FL-1137',WFL:'FL-1137',SFL:'FL-1137' };
      vals['rtd_dc'] = rtdMap[loc.region] || 'GA-1133';
    }

    // Boolean attributes — set for all but ~2-3% of locations
    const boolAttrs: [string, number, number][] = [
      // [attrId, nullRate, trueRate]
      ['lottery',  nullRate, 0.88],
      ['drive_thru',  nullRate, 0.52],
      ['high_flow_diesel',  nullRate, 0.82],
      ['bulk_def',  nullRate, 0.68],
      ['truck_parking',  nullRate, 0.45],
      ['yogurt',  nullRate, 0.70],
      ['ev_charger',  nullRate, 0.28],
      ['freal_machine',  nullRate, 0.62],
      ['heat_slide',  nullRate, 0.54],
      ['self_checkout',  nullRate, 0.32],
      ['coam',  nullRate, 0.48],
      ['comdata',  nullRate, 0.40],
      ['dcm',  nullRate, 0.72],
      ['franchise',  nullRate, 0.09],
      ['liquor_sales',  nullRate, 0.25],
      ['check_cashing',  nullRate, 0.20],
      ['chicken',  nullRate, 0.55],
    ];
    boolAttrs.forEach(([id, nullRate, trueRate], i) => {
      if (r(60 + i) > nullRate) {
        vals[id] = r(80 + i) < trueRate ? 'true' : 'false';
      }
    });

    // Dependent numeric attrs
    if (vals['high_flow_diesel'] === 'true' && r(13) > nullRate) {
      const pumps = ATTR_DEFS.find(a => a.id === 'hf_diesel_pumps')!.enumValues!;
      vals['hf_diesel_pumps'] = pick(pumps, Math.floor(r(14) * pumps.length));
    }
    if (vals['bulk_def'] === 'true' && r(17) > nullRate) {
      const pumps = ATTR_DEFS.find(a => a.id === 'bulk_def_pumps')!.enumValues!;
      vals['bulk_def_pumps'] = pick(pumps, Math.floor(r(18) * pumps.length));
    }
    if (vals['truck_parking'] === 'true' && r(21) > nullRate) {
      vals['truck_scale'] = r(22) < 0.30 ? 'true' : 'false';
    }
    if (vals['yogurt'] === 'true') {
      if (r(24) > nullRate) vals['yogurt_machines'] = pick(['3','4','5'], Math.floor(r(25) * 3));
      if (r(26) > nullRate) vals['yogurt_toppings'] = pick(['24','25','30','31','41'], Math.floor(r(27) * 5));
    }
    if (vals['chicken'] === 'true' && r(35) > nullRate) {
      vals['chicken_type'] = r(36) < 0.5 ? 'Bulk' : 'Packaged';
    }

    // Breakfast type — 98% set
    if (r(31) > nullRate) vals['breakfast_type'] = r(32) < 0.55 ? 'AGNG' : 'Legacy';

    // Pizza type — 98% set
    if (r(28) > nullRate) {
      vals['pizza_type'] = pick(['Bar','Box','Tower'], Math.floor(r(30) * 3));
    }

    // Backcourt lanes — 97% set
    if (r(39) > nullRate) {
      const lanes = ATTR_DEFS.find(a => a.id === 'backcourt_lanes')!.enumValues!;
      vals['backcourt_lanes'] = pick(lanes, Math.floor(r(40) * lanes.length));
    }

    // B2C machines — 97% set
    if (r(41) > nullRate) {
      vals['b2c_machines'] = pick(['3','4','5','6','7'], Math.floor(r(42) * 5));
    }

    // Unset store_type for "needs attention" locations
    if (NEEDS_ATTENTION_STORE_IDS.has(loc.storeId)) {
      delete vals['store_type'];
    }

    result[loc.id] = vals;
  }

  return result;
}

// ── Needs attention ───────────────────────────────────────────────────────────
// Specific store IDs that need attention — one key attribute unset on each.
// Simulates locations where a required attribute was missed during setup.
export const NEEDS_ATTENTION_STORE_IDS = new Set([
  '0053','0071','0089','0108','0127','0143','0162','0198','0214','0237',
  '0251','0268','0312','0445','0501'
]);

export function needsAttention(
  loc: Location,
  _attrValues: Record<string, LocationAttrValues>
): boolean {
  return NEEDS_ATTENTION_STORE_IDS.has(loc.storeId);
}
