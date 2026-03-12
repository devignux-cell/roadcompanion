"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PageWrapper from "@/components/layout/PageWrapper";
import BackHeader from "@/components/ui/BackHeader";
import { COLORS } from "@/lib/constants/colors";
import QRCode from "qrcode";
import { getCurrentAccount, saveAccount, logout } from "@/lib/data/account";
import { Account } from "@/types/account";

// ─── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({
  label,
  required,
  right,
}: {
  label: string;
  required?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
        paddingLeft: 4,
      }}
    >
      <span style={{ fontSize: 12, color: COLORS.muted }}>
        {label}
        {required && <span style={{ color: COLORS.accent }}> *</span>}
      </span>
      {right}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  prefix?: string;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <div style={{ position: "relative" }}>
        {prefix && (
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: COLORS.muted,
              fontSize: 14,
              pointerEvents: "none",
            }}
          >
            {prefix}
          </span>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 14,
            padding: prefix ? "13px 14px 13px 28px" : "13px 14px",
            fontSize: 14,
            color: COLORS.text,
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />
      </div>
    </div>
  );
}

function TextareaInput({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <FieldLabel
        label={label}
        right={
          maxLength ? (
            <span
              style={{
                fontSize: 11,
                color:
                  value.length > maxLength * 0.85 ? COLORS.accent : COLORS.muted,
              }}
            >
              {value.length}/{maxLength}
            </span>
          ) : undefined
        }
      />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={3}
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 14,
          padding: "13px 14px",
          fontSize: 14,
          color: COLORS.text,
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
          resize: "none",
          fontFamily: "inherit",
          lineHeight: 1.6,
        }}
      />
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ─── Landing Page URL field ─────────────────────────────────────────────────────

function LandingPageField({ username }: { username: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = origin ? `${origin}/${username}` : `/${username}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <FieldLabel label="Your Landing Page" />
      <div
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 14,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {/* URL text */}
        <div
          style={{
            flex: 1,
            fontSize: 13,
            color: COLORS.muted,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "monospace",
          }}
        >
          {url}
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          title="Copy link"
          style={{
            background: copied ? COLORS.teal + "15" : "none",
            border: `1px solid ${copied ? COLORS.teal + "40" : "transparent"}`,
            borderRadius: 8,
            cursor: "pointer",
            padding: "5px 7px",
            display: "flex",
            alignItems: "center",
            color: copied ? COLORS.teal : COLORS.muted,
            transition: "color 0.25s ease, background 0.25s ease, border 0.25s ease",
            transform: copied ? "scale(1.1)" : "scale(1)",
          }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>

        {/* Open in new tab */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title="Open page"
          style={{
            background: "none",
            border: "1px solid transparent",
            borderRadius: 8,
            padding: "5px 7px",
            display: "flex",
            alignItems: "center",
            color: COLORS.muted,
            textDecoration: "none",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.text)}
          onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.muted)}
        >
          <ExternalLinkIcon />
        </a>
      </div>
    </div>
  );
}

// ─── QR Code section ────────────────────────────────────────────────────────────

function QRCodeSection({ account }: { account: Account }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [origin, setOrigin] = useState("");
  const [copiedQr, setCopiedQr] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = origin ? `${origin}/${account.username}` : `/${account.username}`;

  useEffect(() => {
    if (!canvasRef.current || !origin) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 220,
      margin: 2,
      color: { dark: "#F0EDE8", light: "#13131A" },
    });
  }, [url, origin]);

  const getDataUrl = (): string | null => {
    return canvasRef.current?.toDataURL("image/png") ?? null;
  };

  const handleCopyImage = async () => {
    const dataUrl = getDataUrl();
    if (!dataUrl) return;
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    setCopiedQr(true);
    setTimeout(() => setCopiedQr(false), 2000);
  };

  const handleDownload = () => {
    const dataUrl = getDataUrl();
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `roamcompanion-qr-${account.username}.png`;
    a.click();
  };

  const handleSavePdf = () => {
    const dataUrl = getDataUrl();
    if (!dataUrl) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Roam Companion QR — ${account.display_name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, sans-serif;
              background: #fff;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              gap: 20px;
              padding: 40px;
            }
            h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
            h1 span { color: #FF5C28; }
            img { width: 220px; height: 220px; border: 1px solid #eee; border-radius: 12px; padding: 8px; }
            p { font-size: 13px; color: #888; }
            .url { font-size: 12px; color: #aaa; font-family: monospace; }
          </style>
        </head>
        <body>
          <h1>Roam<span>Companion</span></h1>
          <img src="${dataUrl}" alt="QR Code" />
          <p>${account.display_name} · @${account.username}</p>
          <p class="url">${url}</p>
          <script>window.onload = () => { window.print(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const actionBtn: React.CSSProperties = {
    flex: 1,
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: "10px 8px",
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.muted,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    transition: "border 0.2s, color 0.2s",
  };

  return (
    <div
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 20,
        padding: "24px 20px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      {/* QR canvas */}
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${COLORS.border}`,
          lineHeight: 0,
        }}
      >
        <canvas ref={canvasRef} />
      </div>

      {/* Unique identifier */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>
          {account.display_name}
        </div>
        <div
          style={{
            fontSize: 10,
            color: COLORS.muted,
            fontFamily: "monospace",
            marginTop: 4,
            letterSpacing: 0.5,
          }}
        >
          ID: {account.id} · @{account.username}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, width: "100%" }}>
        {/* Copy image */}
        <button
          onClick={handleCopyImage}
          style={{
            ...actionBtn,
            color: copiedQr ? COLORS.teal : COLORS.muted,
            border: `1px solid ${copiedQr ? COLORS.teal + "50" : COLORS.border}`,
            background: copiedQr ? COLORS.teal + "10" : COLORS.card,
          }}
        >
          <span style={{ fontSize: 16 }}>{copiedQr ? "✓" : "📋"}</span>
          {copiedQr ? "Copied!" : "Copy"}
        </button>

        {/* Download PNG */}
        <button onClick={handleDownload} style={actionBtn}>
          <span style={{ fontSize: 16 }}>⬇️</span>
          Download
        </button>

        {/* Save PDF */}
        <button onClick={handleSavePdf} style={actionBtn}>
          <span style={{ fontSize: 16 }}>🖨️</span>
          Print / PDF
        </button>
      </div>
    </div>
  );
}

// ─── Section label ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        letterSpacing: 2.5,
        color: COLORS.muted,
        textTransform: "uppercase",
        marginTop: 20,
        marginBottom: 8,
        paddingLeft: 4,
      }}
    >
      {children}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DriverEditProfilePage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [bio, setBio] = useState("");
  const [cashapp, setCashapp] = useState("");
  const [venmo, setVenmo] = useState("");
  const [paypal, setPaypal] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePicUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    // reset so the same file can be re-selected if needed
    e.target.value = "";
  };

  useEffect(() => {
    const acc = getCurrentAccount();
    if (!acc) {
      router.push("/login");
      return;
    }
    setAccount(acc);
    setDisplayName(acc.display_name);
    setCity(acc.city);
    setProfilePicUrl(acc.profile_pic_url ?? "");
    setBio(acc.bio ?? "");
    setCashapp(acc.tips.cashapp ?? "");
    setVenmo(acc.tips.venmo ?? "");
    setPaypal(acc.tips.paypal ?? "");
  }, [router]);

  const handleSave = () => {
    if (!account) return;
    if (!displayName.trim() || !city.trim()) {
      setError("Display name and city are required.");
      return;
    }
    if (!cashapp.trim() && !venmo.trim() && !paypal.trim()) {
      setError("At least one tip handle is required.");
      return;
    }
    setError("");

    const updated: Account = {
      ...account,
      display_name: displayName.trim(),
      city: city.trim(),
      profile_pic_url: profilePicUrl.trim() || undefined,
      bio: bio.trim() || undefined,
      tips: {
        cashapp: cashapp.trim() || undefined,
        venmo: venmo.trim() || undefined,
        paypal: paypal.trim() || undefined,
      },
    };

    saveAccount(updated);
    setAccount(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!account) return null;

  return (
    <PageWrapper>
      <div style={{ padding: "24px 16px 48px" }}>
        <BackHeader title="Edit Profile" onBack={() => router.push("/")} />

        {/* Avatar upload */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            margin: "28px 0 32px",
            gap: 8,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Change profile picture"
            style={{
              position: "relative",
              width: 84,
              height: 84,
              borderRadius: "50%",
              background: COLORS.card,
              border: `2px solid ${COLORS.accent}40`,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {profilePicUrl ? (
              <Image
                src={profilePicUrl}
                alt={displayName || "Profile"}
                width={84}
                height={84}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
                unoptimized
              />
            ) : (
              <span style={{ fontSize: 36 }}>👤</span>
            )}
            {/* Camera overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0,
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "none",
              border: "none",
              fontSize: 11,
              color: COLORS.muted,
              cursor: "pointer",
              padding: "2px 8px",
              fontFamily: "inherit",
            }}
          >
            Tap to change photo
          </button>
          <div style={{ fontSize: 12, color: COLORS.muted }}>
            @{account.username}
          </div>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <SectionLabel>Your Page</SectionLabel>

          <LandingPageField username={account.username} />

          <SectionLabel>QR Code</SectionLabel>

          <QRCodeSection account={account} />

          <SectionLabel>Profile</SectionLabel>

          <TextInput
            label="Display Name"
            value={displayName}
            onChange={setDisplayName}
            placeholder="e.g. Carlos V."
            required
          />
          <TextInput
            label="City"
            value={city}
            onChange={setCity}
            placeholder="e.g. Tampa"
            required
          />
          <TextInput
            label="Profile Pic URL"
            value={profilePicUrl}
            onChange={setProfilePicUrl}
            placeholder="https://..."
          />
          <TextareaInput
            label="Bio"
            value={bio}
            onChange={setBio}
            placeholder="Tell passengers about yourself…"
            maxLength={82}
          />

          <SectionLabel>Tip Handles</SectionLabel>

          <TextInput
            label="Cash App"
            value={cashapp}
            onChange={setCashapp}
            placeholder="$YourHandle"
          />
          <TextInput
            label="Venmo"
            value={venmo}
            onChange={setVenmo}
            placeholder="@YourHandle"
          />
          <TextInput
            label="PayPal"
            value={paypal}
            onChange={setPaypal}
            placeholder="YourHandle"
          />

          {error && (
            <div
              style={{
                fontSize: 13,
                color: COLORS.accent,
                textAlign: "center",
                animation: "fadeUp 0.2s ease",
                paddingTop: 4,
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            style={{
              background: saved ? "transparent" : COLORS.accent,
              border: saved ? `1px solid ${COLORS.teal}60` : "none",
              borderRadius: 16,
              padding: "16px",
              fontSize: 15,
              fontWeight: 700,
              color: saved ? COLORS.teal : "#fff",
              cursor: "pointer",
              marginTop: 16,
              transition: "all 0.3s ease",
              fontFamily: "inherit",
            }}
          >
            {saved ? "✓  Saved!" : "Save Changes"}
          </button>

          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 16,
              padding: "14px",
              fontSize: 14,
              color: COLORS.muted,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
