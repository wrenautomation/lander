// Line icons on a 16px grid, drawn with a stroke: the service diagrams, the past work, the levels.
export const ICON = {
  person: 'M8 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 13.5c.8-2.3 2.7-3.5 5-3.5s4.2 1.2 5 3.5',
  mail: 'M2.5 4h11v8.5h-11zM2.5 4.5 8 9l5.5-4.5',
  doc: 'M4 1.5h5.5l3 3v10H4zM9.5 1.5v3h3M6.5 8h4M6.5 11h4',
  cal: 'M2.5 3.5h11v10h-11zM2.5 6.5h11M5.5 2v3M10.5 2v3',
  invoice: 'M3.5 1.5h9v13l-2.2-1.3-2.3 1.3-2.3-1.3-2.2 1.3zM6 5h4M6 8h4M6 11h2',
  check: 'M3.5 8.5l3 3 6-7',
  stack: 'M2.5 3h11v3.5h-11zM2.5 9.5h11V13h-11z',
  record: 'M3 2.5h10v11H3zM5.5 6h5M5.5 9h5',
  search: 'M7 11.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM10.3 10.3l3.2 3.2',
  link: 'M6.5 9.5l3-3M7 4.5l1-1a2.8 2.8 0 0 1 4 4l-1 1M9 11.5l-1 1a2.8 2.8 0 0 1-4-4l1-1',
  spark: 'M8 1.5l1.6 4.9 4.9 1.6-4.9 1.6L8 14.5l-1.6-4.9L1.5 8l4.9-1.6z',
  loop: 'M13 8a5 5 0 1 1-1.5-3.6M13 2.5v3h-3',
};
export type Icon = keyof typeof ICON;
export const ICONS = Object.keys(ICON) as [Icon, ...Icon[]];
