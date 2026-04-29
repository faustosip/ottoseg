const COLORS = [
  "#d62828",
  "#0a7d3d",
  "#b06b00",
  "#9b1c2d",
  "#1d4ed8",
  "#7c3aed",
  "#0891b2",
  "#be185d",
  "#65a30d",
  "#ea580c",
  "#0f766e",
  "#0a3d62",
  "#34495e",
  "#16a085",
  "#8e44ad",
];

function colorForName(name: string) {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLORS[h % COLORS.length];
}

function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

type SourceFaviconProps = {
  name: string;
  size?: number;
};

export function SourceFavicon({ name, size = 42 }: SourceFaviconProps) {
  const bg = colorForName(name);
  return (
    <div
      className="font-display flex flex-shrink-0 items-center justify-center font-bold text-white"
      style={{
        width: size,
        height: size,
        borderRadius: "10px",
        background: bg,
        fontSize: `${Math.round(size * 0.43)}px`,
        letterSpacing: "-.5px",
      }}
      aria-hidden
    >
      {initialsForName(name)}
    </div>
  );
}
