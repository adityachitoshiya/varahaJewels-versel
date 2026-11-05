// Turn a product description into a specs table + highlights.
// Supplier descriptions look like:
//   "Necklace Length: 22.00 CM x Width: 1.20 CM | Material: Brass ... | Color: Brown | Stone: American Diamond"
// Prose descriptions (no "Key: Value" lines) are returned as plain text.

const LABELS = {
  'material': 'Material',
  'fabric': 'Fabric',
  'gross weight': 'Weight',
  'weight': 'Weight',
  'color': 'Colour',
  'colour': 'Colour',
  'stone': 'Stones',
  'stones': 'Stones',
  'package content': 'In the box',
  'back finding': 'Closure',
  'earrings style': 'Earring style',
  'plating': 'Plating',
  'size': 'Size',
};

const tidy = (v) => v.replace(/\s+/g, ' ').replace(/::/g, ', ').replace(/\s*\/\/\s*/g, ', ').trim();
const cm = (v) => v.replace(/\.00\b/g, '').replace(/\s*CM\b/gi, ' cm');

export function parseSpecs(description = '') {
  const text = description.replace(/<[^>]*>/g, '\n').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
  const specs = [];
  const features = [];
  const prose = [];

  text.split('\n').map((l) => l.trim()).filter(Boolean).forEach((line) => {
    if (!line.includes(':')) {
      // "Adjustable Rope | ..." style fragments are features; long sentences are prose
      const parts = line.split('|').map((p) => p.trim()).filter(Boolean);
      if (line.length > 90 || parts.length === 1 && /[.!?]$/.test(line)) prose.push(line);
      else features.push(...parts);
      return;
    }
    line.split('|').map((p) => p.trim()).filter(Boolean).forEach((part) => {
      // "<Thing> Length: 22 CM x Width: 1.2 CM" -> "<Thing> size: 22 × 1.2 cm"
      const dim = part.match(/^(.*?)\bLength:\s*([\d.]+\s*CM)\s*x\s*Width:\s*([\d.]+\s*CM)/i);
      if (dim) {
        const what = dim[1].trim() || 'Size';
        specs.push({ label: `${what} size`.replace(/^Size size$/, 'Size'), value: `${cm(dim[2]).replace(' cm', '')} × ${cm(dim[3])} (L × W)` });
        return;
      }
      // "Back Finding: Post ... x Earrings Style: Drop" holds two specs
      part.split(/\s+x\s+(?=[A-Z][A-Za-z ]+:)/).forEach((kv) => {
        const i = kv.indexOf(':');
        if (i < 0) { features.push(kv); return; }
        const key = kv.slice(0, i).trim();
        const value = tidy(kv.slice(i + 1));
        if (!value) return;
        if (key.toLowerCase() === 'product description') { prose.push(value); return; }
        const label = LABELS[key.toLowerCase()] || key;
        specs.push({ label, value: label === 'Weight' ? value.replace(/Grams?/i, 'g') : value });
      });
    });
  });

  return { specs, features, text: prose.join('\n') };
}

// Care tips by what the piece is made of
export function careTips(product) {
  const metal = `${product.metal || ''} ${product.category || ''}`.toLowerCase();
  if (metal.includes('925') || metal.includes('silver')) {
    return [
      'Wipe with a soft dry cloth after wearing to keep the shine.',
      'Keep away from perfume, lotion and swimming pool water.',
      'Store in the zip pouch it came in; air darkens silver over time.',
      'A silver polishing cloth brings back the shine if it darkens.',
    ];
  }
  if (metal.includes('watch')) {
    return [
      'Keep away from water; these watches are not water resistant.',
      'Wipe the dial and strap with a soft dry cloth.',
      'Store flat in its box, away from other jewellery that can scratch it.',
    ];
  }
  if (metal.includes('potli') || metal.includes('fabric') || metal.includes('silk')) {
    return [
      'Spot clean with a soft dry cloth; do not wash.',
      'Store stuffed with tissue so it keeps its shape.',
      'Keep away from damp and direct sunlight to protect the colours.',
    ];
  }
  return [
    'Put it on last, after perfume, hairspray and make-up.',
    'Keep away from water and sweat to protect the plating and stones.',
    'Wipe gently with a soft dry cloth after each wear.',
    'Store separately in a pouch or box so stones do not scratch.',
  ];
}
