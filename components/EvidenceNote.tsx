/**
 * Highlight a verbatim quote within a text by splitting on the match
 * and wrapping the matched portion in a styled span.
 * Never uses dangerouslySetInnerHTML.
 */
interface Props {
  text: string;
  quote?: string;
}

export default function EvidenceNote({ text, quote }: Props) {
  if (!quote || !text) {
    return <span style={{ color: "#94a3b8" }}>{text}</span>;
  }

  // Case-insensitive, whitespace-normalized match
  const normalizedText = text.replace(/\s+/g, " ");
  const normalizedQuote = quote.replace(/\s+/g, " ");

  const idx = normalizedText.toLowerCase().indexOf(normalizedQuote.toLowerCase());
  if (idx === -1) {
    // Quote not found (evidence guard should have caught this, but be safe)
    return <span style={{ color: "#94a3b8" }}>{text}</span>;
  }

  const before = normalizedText.slice(0, idx);
  const match = normalizedText.slice(idx, idx + normalizedQuote.length);
  const after = normalizedText.slice(idx + normalizedQuote.length);

  return (
    <span style={{ color: "#94a3b8", lineHeight: "1.7" }}>
      {before}
      <mark
        className="evidence-highlight"
        title="Verbatim quote used as evidence by Gemma 4"
      >
        {match}
      </mark>
      {after}
    </span>
  );
}
