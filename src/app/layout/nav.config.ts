/** Shared app navigation — single source for sidebar + mobile drawer. */
export interface AppNavItem {
  readonly labelKey: string;
  readonly link: string;
  readonly icon: string;
  readonly roles?: readonly string[];
}

export const APP_NAV_ITEMS: readonly AppNavItem[] = [
  { labelKey: 'translate_nav-dashboard', link: '/dashboard', icon: 'faSolidHouse' },
  { labelKey: 'translate_nav-zones', link: '/zones', icon: 'faSolidBoxesPacking' },
  {
    labelKey: 'translate_nav-users',
    link: '/users',
    icon: 'faSolidUsers',
    roles: ['super_admin'],
  },
  {
    labelKey: 'translate_nav-settings',
    link: '/settings/tags',
    icon: 'faSolidGear',
    roles: ['super_admin', 'admin'],
  },
];

export function visibleNavItems(role: string | null | undefined): AppNavItem[] {
  return APP_NAV_ITEMS.filter((item) => {
    if (!item.roles?.length) {
      return true;
    }
    return item.roles.includes(role ?? '');
  });
}
