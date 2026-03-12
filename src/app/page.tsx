"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageWrapper from "@/components/layout/PageWrapper";
import { COLORS } from "@/lib/constants/colors";
import { login, getCurrentAccount, logout } from "@/lib/data/account";

export default function RootPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupNote, setSignupNote] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLoggedIn(!!getCurrentAccount());
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const account = login(username.trim(), password);
    if (account) {
      setIsLoggedIn(true);
      setLoading(false);
    } else {
      setError("Invalid username or password.");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
  };

  if (!mounted) return null;

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
      <div
        style={{
          padding: "0 0 40px",
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            justifyContent: isLoggedIn ? "space-between" : "center",
            alignItems: "center",
            padding: "16px 16px",
          }}
        >
          <div
            style={{
              fontFamily: "'Syne', var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: 20,
            }}
          >
            Roam<span style={{ color: COLORS.accent }}>Companion</span>
          </div>
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              style={{
                background: "none",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 100,
                padding: "7px 14px",
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.muted,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Sign Out
            </button>
          )}
        </div>

        {isLoggedIn ? (
          /* ── Dashboard ── */
          <div
            style={{
              flex: 1,
              padding: "48px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: "'Syne', var(--font-syne), sans-serif",
                fontWeight: 800,
                fontSize: 26,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Welcome back
            </div>
            <div
              style={{
                fontSize: 14,
                color: COLORS.muted,
                marginBottom: 48,
                textAlign: "center",
              }}
            >
              Choose your dashboard
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}
            >
              {/* Rides Card */}
              <div
                className="card-hover"
                onClick={() => router.push("/driver/edit-profile")}
                style={{
                  background: COLORS.card,
                  border: `1px solid ${COLORS.accent}30`,
                  borderRadius: 24,
                  padding: "28px 24px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    background: COLORS.accent + "18",
                    border: `1px solid ${COLORS.accent}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    flexShrink: 0,
                  }}
                >
                  🚗
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "'Syne', var(--font-syne), sans-serif",
                      fontWeight: 800,
                      fontSize: 20,
                      marginBottom: 4,
                    }}
                  >
                    Rides
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.muted }}>
                    Manage your driver profile &amp; QR
                  </div>
                </div>
                <div style={{ color: COLORS.muted, fontSize: 20 }}>→</div>
              </div>

              {/* Homes Card — disabled */}
              <div
                style={{
                  background: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 24,
                  padding: "28px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  opacity: 0.45,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    background: COLORS.purple + "18",
                    border: `1px solid ${COLORS.purple}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    flexShrink: 0,
                  }}
                >
                  🏠
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "'Syne', var(--font-syne), sans-serif",
                      fontWeight: 800,
                      fontSize: 20,
                      marginBottom: 4,
                    }}
                  >
                    Homes
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.muted }}>
                    Short-term rental management
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: COLORS.purple,
                    background: COLORS.purple + "20",
                    border: `1px solid ${COLORS.purple}40`,
                    borderRadius: 100,
                    padding: "4px 10px",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* ── Login ── */
          <div
            style={{
              flex: 1,
              padding: "48px 24px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div
                style={{
                  fontFamily: "'Syne', var(--font-syne), sans-serif",
                  fontWeight: 800,
                  fontSize: 36,
                  marginBottom: 8,
                }}
              >
                Welcome
              </div>
              <div style={{ fontSize: 13, color: COLORS.muted }}>
                Sign in to your account
              </div>
            </div>

            <form
              onSubmit={handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
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

              <button
                type="button"
                onClick={() => setSignupNote(true)}
                style={{
                  background: "none",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 14,
                  padding: "16px",
                  fontSize: 15,
                  fontWeight: 600,
                  color: COLORS.muted,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Sign Up
              </button>

              {signupNote && (
                <div
                  style={{
                    fontSize: 13,
                    color: COLORS.muted,
                    textAlign: "center",
                    animation: "fadeUp 0.2s ease",
                  }}
                >
                  Sign up is coming soon. Stay tuned!
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
