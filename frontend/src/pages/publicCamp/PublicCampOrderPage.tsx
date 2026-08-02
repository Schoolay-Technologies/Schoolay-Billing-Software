import {
  useParams
} from "react-router-dom";

export default function PublicCampOrderPage() {
  const {
    token
  } = useParams<{
    token: string;
  }>();

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px",
        background: "#f5f7fa"
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "24px",
          borderRadius: "12px",
          background: "#ffffff",
          boxShadow:
            "0 8px 24px rgba(0, 0, 0, 0.08)"
        }}
      >
        <h1>
          School Uniform Order
        </h1>

        <p>
          The camp QR route is working.
        </p>

        <p>
          Camp token:
        </p>

        <code>
          {token ?? "Token not found"}
        </code>
      </div>
    </main>
  );
}