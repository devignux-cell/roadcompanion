"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageWrapper from "@/components/layout/PageWrapper";
import BackHeader from "@/components/ui/BackHeader";
import { COLORS } from "@/lib/constants/colors";
import { getAccountByUsername } from "@/lib/data/account";

interface TipEntry {
  name: string;
  handle: string;
  icon: string;
  color: string;
  url: string;
}

function buildTips(username: string): TipEntry[] {
  const account = getAccountByUsername(username);
  if (!account) return [];

  const entries: TipEntry[] = [];
  if (account.tips.cashapp) {
    entries.push({
      name: "Cash App",
      handle: account.tips.cashapp,
      icon: "💚",
      color: "#00D632",
      url: `https://cash.app/${account.tips.cashapp}`,
    });
  }
  if (account.tips.venmo) {
    entries.push({
      name: "Venmo",
      handle: account.tips.venmo,
      icon: "💙",
      color: "#3D95CE",
      url: `https://venmo.com/${account.tips.venmo.replace("@", "")}`,
    });
  }
  if (account.tips.paypal) {
    entries.push({
      name: "PayPal",
      handle: account.tips.paypal,
      icon: "💛",
      color: "#FFB700",
      url: `https://paypal.me/${account.tips.paypal}`,
    });
  }
  return entries;
}

export default function TipPage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const [sent, setSent] = useState<string | null>(null);

  const tips = buildTips(username);

  return (
    <PageWrapper>
      <div style={{ padding: "24px 16px 40px" }}>
        <BackHeader title="Tip Jar" onBack={() => router.push(`/${username}`)} />

        {/* Hero */}
        <div style={{ textAlign: "center", paddingTop: 32, paddingBottom: 32 }}>
          <div
            style={{
              fontSize: 64,
              marginBottom: 12,
              display: "block",
              animation: "float 3s ease-in-out infinite",
            }}
          >
            💛
          </div>
          <div
            style={{
              fontFamily: "'Syne', var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: 26,
              marginBottom: 8,
            }}
          >
            Leave a Tip
          </div>
          <div
            style={{
              fontSize: 14,
              color: COLORS.muted,
              lineHeight: 1.7,
              maxWidth: 260,
              margin: "0 auto",
            }}
          >
            Tips appreciated, never expected.
            <br />
            Every bit means a lot.
          </div>
        </div>

        {/* Payment methods */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tips.map((tip, i) => (
            <a
              key={tip.name}
              href={tip.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
              onClick={() => setSent(tip.name)}
            >
              <div
                className="card-hover"
                style={{
                  background: sent === tip.name ? tip.color + "20" : COLORS.card,
                  border: `1px solid ${sent === tip.name ? tip.color + "60" : COLORS.border}`,
                  borderRadius: 20,
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  animation: `fadeUp 0.4s ease ${i * 80}ms both`,
                }}
              >
                <div style={{ fontSize: 32 }}>{tip.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: COLORS.text }}>
                    {tip.name}
                  </div>
                  <div style={{ fontSize: 13, color: tip.color, marginTop: 2 }}>
                    {tip.handle}
                  </div>
                </div>
                {sent === tip.name ? (
                  <div style={{ color: tip.color, fontSize: 20 }}>✓</div>
                ) : (
                  <div style={{ color: COLORS.muted, fontSize: 16 }}>→</div>
                )}
              </div>
            </a>
          ))}
        </div>

        {sent && (
          <div
            style={{
              marginTop: 24,
              textAlign: "center",
              animation: "fadeUp 0.3s ease",
              background: "rgba(45,255,199,0.08)",
              border: "1px solid rgba(45,255,199,0.2)",
              borderRadius: 16,
              padding: 16,
              fontSize: 14,
              color: COLORS.teal,
            }}
          >
            🙏 Thank you! Your generosity keeps this ride going.
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
