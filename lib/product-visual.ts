export function productEmoji(name: string, category = "") {
  const value = `${name} ${category}`.toLowerCase();
  if (/watch|fit|wearable/.test(value)) return "⌚";
  if (/headphone|earbud|buds/.test(value)) return "🎧";
  if (/speaker/.test(value)) return "🔊";
  if (/camera/.test(value)) return "📷";
  if (/mouse/.test(value)) return "🖱️";
  if (/keyboard/.test(value)) return "⌨️";
  if (/charger|power bank/.test(value)) return "🔋";
  if (/phone|mobile/.test(value)) return "📱";
  if (/shoe|sneaker|trainer|loafer|sandal|clog|footwear/.test(value)) return "👟";
  if (/bag|backpack|tote|sleeve|wallet|accessor/.test(value)) return "👜";
  if (/beauty|serum|lotion|shampoo|cleanser|perfume|mascara/.test(value)) return "🧴";
  if (/kettle|cookware|bottle|lunch|home|storage|lamp/.test(value)) return "🏠";
  if (/shirt|dress|fashion|jeans|kurta|saree/.test(value)) return "👕";
  if (/sport|cricket|football|yoga|fitness/.test(value)) return "🏃";
  if (/grocery|food|coffee|tea|rice|snack/.test(value)) return "🛒";
  if (/toy|kids|car|doll|craft|blaster/.test(value)) return "🧸";
  return "📦";
}

export function productAccent(name: string) {
  const colors = ["#d8f56f", "#74d3ae", "#ffd166", "#8ecae6", "#ff9f9f"];
  const total = Array.from(name).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return colors[total % colors.length];
}
