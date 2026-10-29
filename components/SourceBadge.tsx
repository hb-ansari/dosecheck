import type { Finding } from "@/lib/schema";

interface Props {
  source: Finding["source"];
}

export default function SourceBadge({ source }: Props) {
  return (
    <span
      className={source === "code" ? "source-code" : "source-gemma"}
      style={{
        fontSize: "0.65rem",
        fontWeight: "800",
        padding: "0.2rem 0.55rem",
        borderRadius: "20px",
        letterSpacing: "0.07em",
        textTransform: "uppercase",
      }}
    >
      {source === "code" ? "Code" : "✦ Gemma 4"}
    </span>
  );
}
