import { ACTIVE_LOCATIONS, ORG, downloadCsv, locationsCsv } from '@/data/apiKeys';
import { showToast } from './toastStore';

export function downloadLocationsCsv() {
  downloadCsv(`${ORG.file}_locations.csv`, locationsCsv());
  showToast(`${ORG.file}_locations.csv downloaded · ${ACTIVE_LOCATIONS.length} locations`);
}
