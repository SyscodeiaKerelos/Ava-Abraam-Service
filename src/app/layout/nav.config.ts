/** Shared app navigation — single source for sidebar + mobile drawer. */

export type AppNavGroupChild = {
  readonly labelKey: string;
  readonly link: string;
  readonly icon: string;
  readonly roles?: readonly string[];
};

export type AppNavEntry =
  | {
      readonly kind: 'link';
      readonly labelKey: string;
      readonly link: string;
      readonly icon: string;
      readonly roles?: readonly string[];
    }
  | {
      readonly kind: 'group';
      readonly labelKey: string;
      readonly link: string;
      readonly icon: string;
      readonly roles?: readonly string[];
      readonly children: readonly AppNavGroupChild[];
    };

export const APP_NAV_ENTRIES: readonly AppNavEntry[] = [
  { kind: 'link', labelKey: 'translate_nav-dashboard', link: '/dashboard', icon: 'faSolidHouse' },
  {
    kind: 'link',
    labelKey: 'translate_nav-zones',
    link: '/zones',
    icon: 'faSolidBoxesPacking',
  },
  {
    kind: 'group',
    labelKey: 'translate_nav-families',
    link: '/families',
    icon: 'faSolidHouseChimneyUser',
    children: [
      {
        labelKey: 'translate_nav-import',
        link: '/import',
        icon: 'faSolidFileImport',
        roles: ['admin', 'super_admin'],
      },
      {
        labelKey: 'translate_nav-export',
        link: '/export',
        icon: 'faSolidFileExport',
        roles: ['admin', 'super_admin'],
      },
    ],
  },
  {
    kind: 'link',
    labelKey: 'translate_nav-users',
    link: '/users',
    icon: 'faSolidUsers',
    roles: ['super_admin'],
  },
  {
    kind: 'link',
    labelKey: 'translate_nav-settings',
    link: '/settings/tags',
    icon: 'faSolidGear',
    roles: ['super_admin', 'admin'],
  },
];

export function visibleNavEntries(role: string | null | undefined): AppNavEntry[] {
  const r = role ?? '';
  const canSee = (roles?: readonly string[]) => !roles?.length || roles.includes(r);

  return APP_NAV_ENTRIES.filter((e) => canSee(e.roles)).map(
    (e) => {
      if (e.kind !== 'group') {
        return e;
      }
      return { ...e, children: e.children.filter((c) => canSee(c.roles)) };
    },
  );
}
