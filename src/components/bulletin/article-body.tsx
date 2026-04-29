"use client";

import { useMemo, useState } from "react";
import { processArticleBody } from "@/lib/bulletin/content-sanitizer";

interface ArticleBodyProps {
  content: string;
  variant?: "classic" | "modern";
  withDropCap?: boolean;
  collapsibleAfterWords?: number;
}

const COLLAPSED_WORD_BUDGET_DEFAULT = 220;

export function ArticleBody({
  content,
  variant = "classic",
  withDropCap = true,
  collapsibleAfterWords = COLLAPSED_WORD_BUDGET_DEFAULT,
}: ArticleBodyProps) {
  const [expanded, setExpanded] = useState(false);

  const { paragraphs, totalWords } = useMemo(
    () => processArticleBody(content),
    [content],
  );

  const isLong = totalWords > collapsibleAfterWords;

  const visibleParagraphs = useMemo(() => {
    if (!isLong || expanded) return paragraphs;
    const result: string[] = [];
    let acc = 0;
    for (const p of paragraphs) {
      result.push(p);
      acc += p.trim().split(/\s+/).length;
      if (acc >= collapsibleAfterWords) break;
    }
    return result;
  }, [paragraphs, isLong, expanded, collapsibleAfterWords]);

  if (paragraphs.length === 0) return null;

  const isClassic = variant === "classic";
  const bodyFontSize = isClassic ? "20px" : "16px";
  const bodyLineHeight = isClassic ? "1.75" : "1.7";
  const paragraphSpacing = isClassic ? "1.1em" : "1em";

  return (
    <div className="article-body">
      {visibleParagraphs.map((paragraph, idx) => (
        <p
          key={idx}
          className={
            withDropCap && idx === 0 && isClassic ? "first-para" : undefined
          }
          style={{
            fontSize: bodyFontSize,
            lineHeight: bodyLineHeight,
            color: "var(--otto-ink-soft, #2d2d31)",
            marginBottom: paragraphSpacing,
            textAlign: isClassic ? "justify" : "left",
            textWrap: "pretty",
            hyphens: "auto",
          }}
        >
          {paragraph}
        </p>
      ))}

      {isLong && !expanded && (
        <div className="fade-mask" aria-hidden />
      )}

      {isLong && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="font-mono-otto inline-flex items-center gap-2 rounded-[8px] border bg-white px-4 py-2 text-[10px] font-semibold uppercase transition-colors hover:bg-[var(--otto-bg)]"
            style={{
              borderColor: "var(--otto-rule)",
              color: "var(--otto-ink)",
              letterSpacing: ".14em",
            }}
          >
            {expanded ? "Mostrar menos ↑" : "Mostrar nota completa ↓"}
          </button>
        </div>
      )}

      <style jsx>{`
        .article-body {
          position: relative;
        }
        .article-body :global(.first-para)::first-letter {
          float: left;
          font-family: var(--font-oswald), "Oswald", system-ui, sans-serif;
          font-size: 4.2em;
          line-height: 0.85;
          font-weight: 700;
          padding: 0.05em 0.12em 0 0;
          color: var(--otto-primary);
        }
        .fade-mask {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 56px;
          height: 80px;
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.95) 80%,
            #fff 100%
          );
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
