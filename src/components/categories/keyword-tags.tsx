type KeywordTagsProps = {
  keywords: string[];
  max?: number;
};

export function KeywordTags({ keywords, max = 4 }: KeywordTagsProps) {
  if (!keywords || keywords.length === 0) {
    return (
      <span
        className="font-mono-otto"
        style={{
          fontSize: "9px",
          color: "var(--otto-muted)",
          letterSpacing: ".06em",
        }}
      >
        sin keywords
      </span>
    );
  }
  const visible = keywords.slice(0, max);
  const extra = keywords.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((k) => (
        <span
          key={k}
          className="font-mono-otto"
          style={{
            fontSize: "9px",
            background: "var(--otto-rule-2)",
            color: "var(--otto-ink-2)",
            padding: "3px 7px",
            borderRadius: "5px",
            letterSpacing: ".04em",
            fontWeight: 600,
            textTransform: "none",
          }}
        >
          {k}
        </span>
      ))}
      {extra > 0 ? (
        <span
          className="font-mono-otto"
          style={{
            fontSize: "9px",
            background: "var(--otto-rule-2)",
            color: "var(--otto-muted)",
            padding: "3px 7px",
            borderRadius: "5px",
            letterSpacing: ".04em",
            fontWeight: 600,
            textTransform: "none",
          }}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
