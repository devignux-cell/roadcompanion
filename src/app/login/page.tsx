"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageWrapper from "@/components/layout/PageWrapper";
import { COLORS } from "@/lib/constants/colors";
import { login } from "@/lib/data/account";
import { checkDriverPassword } from "@/lib/actions/login";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const valid = await checkDriverPassword(username.trim(), password);
    if (valid) {
      const account = login(username.trim());
      if (account) {
        router.push("/driver/edit-profile");
        return;
      }
    }
    setError("Invalid username or password.");
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    padding: "14px 16px",
    fontSize: 15,
    color: COLORS.text,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <PageWrapper>
      <div style={{ padding: "24px 24px 40px", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

        {/* Back */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: COLORS.muted,
            textDecoration: "none",
            marginBottom: 48,
          }}
        >
          ← Back
        </Link>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              fontFamily: "'Syne', var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: 36,
              marginBottom: 8,
            }}
          >
            Roam<span style={{ color: COLORS.accent }}>Companion</span>
          </div>
          <div style={{ fontSize: 13, color: COLORS.muted }}>Driver sign in</div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            autoComplete="username"
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={inputStyle}
          />

          {error && (
            <div
              style={{
                fontSize: 13,
                color: COLORS.accent,
                textAlign: "center",
                animation: "fadeUp 0.2s ease",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            style={{
              background: COLORS.accent,
              border: "none",
              borderRadius: 14,
              padding: "16px",
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              cursor: loading || !username || !password ? "default" : "pointer",
              marginTop: 4,
              opacity: loading || !username || !password ? 0.5 : 1,
              transition: "opacity 0.2s",
              fontFamily: "inherit",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </PageWrapper>
  );
}
