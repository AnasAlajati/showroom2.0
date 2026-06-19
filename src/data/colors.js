export const PANTONE_COLORS = {
  '13-0908': { name: 'Cream',              hex: '#EDE0C8', family: 'neutrals' },
  '14-6408': { name: 'Camel Tan',          hex: '#C4A882', family: 'neutrals' },
  '16-1109': { name: 'Doeskin / Greige',   hex: '#B8A896', family: 'neutrals' },
  '13-2803': { name: 'Blush Pink',         hex: '#F2D5CE', family: 'neutrals' },
  '18-1435': { name: 'Terracotta',         hex: '#B5614A', family: 'earth' },
  '15-1905': { name: 'Pale Mauve',         hex: '#C4A49A', family: 'earth' },
  '19-1620': { name: 'Burgundy',           hex: '#6B2737', family: 'earth' },
  '16-4010': { name: 'Steel Blue',         hex: '#8E9EAA', family: 'blues' },
  '19-4118': { name: 'Dark Indigo',        hex: '#2E3A52', family: 'blues' },
  '19-5350': { name: 'Bottle Green',       hex: '#2A4A40', family: 'darks' },
  '19-0403': { name: 'Dark Olive',         hex: '#3B3A2E', family: 'darks' },
  '19-1012': { name: 'Coffee Bean',        hex: '#3D2B1F', family: 'darks' },
  '19-1118': { name: 'Dark Brown',         hex: '#3E2419', family: 'darks' },
}

export const COLOR_FAMILIES = [
  {
    id: 'neutrals',
    label: 'Neutrals & Warmth',
    codes: ['13-0908', '14-6408', '16-1109', '13-2803'],
  },
  {
    id: 'earth',
    label: 'Earth & Rust',
    codes: ['18-1435', '15-1905', '19-1620'],
  },
  {
    id: 'blues',
    label: 'Blues & Indigo',
    codes: ['16-4010', '19-4118'],
  },
  {
    id: 'darks',
    label: 'Deep Darks',
    codes: ['19-5350', '19-0403', '19-1012', '19-1118'],
  },
]
