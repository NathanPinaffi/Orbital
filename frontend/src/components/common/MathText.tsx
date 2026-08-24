import { Fragment, useMemo } from "react";
import katex from "katex";

/**
 * Splits text on $$...$$ (block) and $...$ (inline) LaTeX delimiters and
 * renders the math segments with KaTeX, leaving the rest as plain text.
 */
type Segment = { math: false; text: string } | { math: true; block: boolean; text: string };

function renderSegments(text: string): Segment[] {
  const parts: Segment[] = [];
  const pattern = /\$\$([^$]+)\$\$|\$([^$\n]+)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      parts.push({ math: false, text: text.slice(lastIndex, match.index) });
    }
    const block = match[1];
    const expr = block ?? match[2] ?? "";
    parts.push({ math: true, block: block !== undefined, text: expr });
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ math: false, text: text.slice(lastIndex) });
  }
  return parts;
}

export function MathText({ text, className }: { text: string; className?: string }) {
  const segments = useMemo(() => renderSegments(text ?? ""), [text]);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (!seg.math) return <Fragment key={i}>{seg.text}</Fragment>;
        let html: string;
        try {
          html = katex.renderToString(seg.text, {
            throwOnError: false,
            displayMode: seg.block,
          });
        } catch {
          html = seg.text;
        }
        const Tag = seg.block ? "div" : "span";
        return <Tag key={i} className={seg.block ? "my-1" : undefined} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </span>
  );
}
