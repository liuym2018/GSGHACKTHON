export interface FashionPresetOutfit {
  id: string;
  name: string;
  archetype: string;
  description: string;
  imageUrl: string;
  thumbnailSvg: string;
  tags: string[];
}

export const FASHION_PRESETS: FashionPresetOutfit[] = [
  {
    id: 'preset_tailored',
    name: 'Structured Wool Blazer & Wide Pleats',
    archetype: 'Modern Architectural Tailoring',
    description: 'Double-breasted charcoal blazer with dropped shoulders, raw-edge hem, paired with relaxed wide-leg wool trousers.',
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500" fill="none"><rect width="400" height="500" fill="%231E1E24"/><circle cx="200" cy="90" r="36" fill="%23D8A287"/><path d="M160 130 L240 130 L260 270 L140 270 Z" fill="%23383B46"/><path d="M175 130 L200 200 L225 130" stroke="%2324262E" stroke-width="4"/><path d="M140 270 L160 440 L195 440 L195 270" fill="%23282A32"/><path d="M205 270 L205 440 L240 440 L260 270" fill="%23282A32"/><rect x="150" y="440" width="46" height="20" rx="4" fill="%23111114"/><rect x="204" y="440" width="46" height="20" rx="4" fill="%23111114"/><text x="200" y="485" text-anchor="middle" fill="%239CA3AF" font-family="sans-serif" font-size="12" font-weight="bold">ARCHITECTURAL SUITING</text></svg>',
    thumbnailSvg: '👔',
    tags: ['Tailoring', 'Minimalist', 'Wool', 'Structured'],
  },
  {
    id: 'preset_streetwear',
    name: 'Cyberpunk Utility Layering',
    archetype: 'Haute Streetwear / Techwear',
    description: 'Technical nylon anorak with modular tactical straps, olive cargo joggers with cinch cuffs, and chunky lug-sole sneakers.',
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500" fill="none"><rect width="400" height="500" fill="%2314191E"/><circle cx="200" cy="90" r="36" fill="%23E2B696"/><path d="M150 130 L250 130 L270 280 L130 280 Z" fill="%232A3B32"/><path d="M170 160 L230 160 M170 200 L230 200" stroke="%23E11D48" stroke-width="3"/><path d="M130 280 L150 435 L190 435 L195 280" fill="%231F2A24"/><path d="M205 280 L210 435 L250 435 L270 280" fill="%231F2A24"/><rect x="140" y="435" width="52" height="25" rx="6" fill="%23E11D48"/><rect x="208" y="435" width="52" height="25" rx="6" fill="%23E11D48"/><text x="200" y="485" text-anchor="middle" fill="%2334D399" font-family="sans-serif" font-size="12" font-weight="bold">UTILITY TECHWEAR</text></svg>',
    thumbnailSvg: '🥼',
    tags: ['Utility', 'Straps', 'Olive', 'Sneakers'],
  },
  {
    id: 'preset_evening',
    name: 'Asymmetric Draped Silk Gown',
    archetype: 'Contemporary Red Carpet Elegance',
    description: 'Liquid emerald green bias-cut silk satin slip gown with cowl neckline, fluid cascading drape, and minimalist gold cuff.',
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500" fill="none"><rect width="400" height="500" fill="%23181C19"/><circle cx="200" cy="85" r="35" fill="%23C98E70"/><path d="M170 120 C185 145, 215 145, 230 120 L245 230 L155 230 Z" fill="%23064E3B"/><path d="M155 230 C130 350, 110 450, 120 460 L280 460 C290 450, 270 350, 245 230 Z" fill="%23047857"/><circle cx="250" cy="180" r="8" fill="%23F59E0B"/><text x="200" y="485" text-anchor="middle" fill="%2334D399" font-family="sans-serif" font-size="12" font-weight="bold">BIAS-CUT SILK GOWN</text></svg>',
    thumbnailSvg: '👗',
    tags: ['Silk Satin', 'Evening', 'Emerald', 'Drape'],
  },
  {
    id: 'preset_knitwear',
    name: 'Sculptural Cashmere & Leather Maxi',
    archetype: 'Quiet Luxury Minimalist',
    description: 'Oversized ribbed mock-neck sweater in oatmeal cashmere paired with an A-line butter-soft chocolate leather maxi skirt.',
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500" fill="none"><rect width="400" height="500" fill="%231E1B18"/><circle cx="200" cy="85" r="35" fill="%23E4B89A"/><path d="M150 125 L250 125 L260 250 L140 250 Z" fill="%23D6C7B2"/><path d="M165 125 L235 125 L235 105 L165 105 Z" fill="%23C2B199"/><path d="M140 250 L110 455 L290 455 L260 250 Z" fill="%23451A03"/><rect x="145" y="455" width="40" height="15" rx="3" fill="%231C1917"/><rect x="215" y="455" width="40" height="15" rx="3" fill="%231C1917"/><text x="200" y="485" text-anchor="middle" fill="%23FDE68A" font-family="sans-serif" font-size="12" font-weight="bold">CASHMERE & LEATHER</text></svg>',
    thumbnailSvg: '🧥',
    tags: ['Cashmere', 'Leather', 'Neutral', 'A-Line'],
  },
];

export const FASHION_CONSULTATION_TOPICS = [
  { id: 'complete', label: 'Full Look & Design Critique', icon: 'Sparkles' },
  { id: 'silhouette', label: 'Silhouette & Proportions Balance', icon: 'Maximize2' },
  { id: 'colors', label: 'Color Theory & Palette Harmony', icon: 'Palette' },
  { id: 'redesign', label: 'Couture Redesign & Tailor Ideas', icon: 'Scissors' },
  { id: 'occasion', label: 'Occasion & Day-to-Night Restyling', icon: 'Compass' },
];
