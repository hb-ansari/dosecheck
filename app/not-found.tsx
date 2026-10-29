import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "80vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      textAlign: "center"
    }}>
      <div style={{
        background: "#FAF9F6",
        border: "1px solid #E2E8F0",
        borderRadius: "16px",
        padding: "48px 36px",
        maxWidth: "480px",
        width: "100%",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)"
      }}>
        <div style={{
          fontSize: "48px",
          fontWeight: 800,
          color: "#2D6A4F",
          letterSpacing: "-0.03em",
          marginBottom: "8px"
        }}>
          404
        </div>
        <h2 style={{
          fontSize: "20px",
          fontWeight: 700,
          color: "#111116",
          marginBottom: "12px"
        }}>
          Page Not Found
        </h2>
        <p style={{
          fontSize: "14px",
          color: "#5C5E6E",
          lineHeight: 1.6,
          marginBottom: "28px"
        }}>
          The clinical route or prescription record you are looking for does not exist or has been archived.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#2D6A4F",
            color: "#FFFFFF",
            padding: "11px 22px",
            borderRadius: "9999px",
            fontWeight: 700,
            fontSize: "13px",
            textDecoration: "none",
            boxShadow: "0 2px 10px rgba(45, 106, 79, 0.3)"
          }}
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

