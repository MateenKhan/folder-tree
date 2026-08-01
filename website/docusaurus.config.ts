import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const GITHUB = 'https://github.com/MateenKhan/folder-tree';
const NPM = 'https://www.npmjs.com/package/@jugaaadi/folder-tree';

const config: Config = {
  title: 'folder-tree',
  tagline: 'A dark-first React tree view — drag, search, multi-select, keyboard',
  favicon: 'img/favicon.ico',

  future: { v4: true },

  url: 'https://folder-tree.jugaaadi.com',
  baseUrl: '/',

  organizationName: 'MateenKhan',
  projectName: 'folder-tree',

  onBrokenLinks: 'throw',

  i18n: { defaultLocale: 'en', locales: ['en'] },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          editUrl: `${GITHUB}/tree/main/website/`,
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: { respectPrefersColorScheme: true },
    navbar: {
      title: 'folder-tree',
      items: [
        { type: 'docSidebar', sidebarId: 'docsSidebar', position: 'left', label: 'Docs' },
        { to: '/docs/events', label: 'Events', position: 'left' },
        { to: '/docs/helpers', label: 'Helpers', position: 'left' },
        { href: NPM, label: 'npm', position: 'right' },
        { href: GITHUB, label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Getting started', to: '/docs/intro' },
            { label: 'Events', to: '/docs/events' },
            { label: 'Helpers', to: '/docs/helpers' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'npm', href: NPM },
            { label: 'GitHub', href: GITHUB },
            { label: 'Issues', href: `${GITHUB}/issues` },
          ],
        },
      ],
      copyright: `MIT © ${new Date().getFullYear()} jugaaadi. Provided as is, without warranty — onDelete hands you intent, not action.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
