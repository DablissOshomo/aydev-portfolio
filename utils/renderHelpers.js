function esc(str) {
  return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// Escapes HTML, then applies a tiny **bold** / *em* convention so data
// fields can carry emphasis without allowing arbitrary HTML injection.
function rich(str) {
  let out = esc(str);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*(.+?)\*/g, "<em>$1</em>");
  return out;
}

function plateBackground(colorA, colorB) {
  return `linear-gradient(135deg,${colorA},${colorB})`;
}

function monogramFor(p) {
  if (p.monogram) return p.monogram;
  const words = String(p.title || "").split(/\s+/).filter(Boolean);
  return ((words[0] || "")[0] || "") + ((words[1] || "")[0] || "");
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Turns a filterCat slug like "custom-js" into a human label "Custom JS"
// for auto-generated filter chips.
function filterLabel(slug) {
  return String(slug || "")
    .split("-")
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === "js") return "JS";
      if (lower === "javascript") return "JavaScript";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

module.exports = { esc, rich, plateBackground, monogramFor, pad2, filterLabel };
