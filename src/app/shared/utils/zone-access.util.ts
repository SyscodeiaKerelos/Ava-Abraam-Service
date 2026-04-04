import type { User } from '../models/user.model';
import type { Zone } from '../models/zone.model';

export function filterZonesForUser(user: User | null, zones: Zone[]): Zone[] {
  if (!user || zones.length === 0) {
    return [];
  }
  const showHidden = user.role === 'super_admin';
  const visible = (z: Zone) => !z.isHidden || showHidden;

  const sorted = [...zones].filter(visible).sort((a, b) => a.order - b.order);

  if (user.role === 'super_admin') {
    return sorted;
  }

  const ids = user.assignedZoneIds ?? [];
  if (ids.length === 0) {
    return [];
  }

  return sorted.filter((z) => ids.includes(z.id));
}
