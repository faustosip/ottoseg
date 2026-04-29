const COLORS = [
  "#d62828",
  "#0e0e10",
  "#16a085",
  "#8e44ad",
  "#1d4ed8",
  "#0a7d3d",
  "#b06b00",
  "#0891b2",
  "#be185d",
  "#65a30d",
  "#34495e",
];

function colorForName(name: string) {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLORS[h % COLORS.length];
}

function initialsFor(nameOrEmail: string) {
  const source = nameOrEmail || "";
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

type UserAvatarProps = {
  name?: string | null;
  email?: string | null;
  size?: number;
};

export function UserAvatar({ name, email, size = 36 }: UserAvatarProps) {
  const display = name || email || "?";
  const bg = colorForName(display);
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: `${Math.round(size * 0.36)}px`,
        letterSpacing: ".5px",
      }}
      aria-hidden
    >
      {initialsFor(display)}
    </div>
  );
}
