import type { ReactNode } from "react";
import AmbientOrbs from "./AmbientOrbs";

interface PageWrapperProps {
  children: ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  return (
    <div
      style={{
        background: "#0A0A0F",
        minHeight: "100vh",
        maxWidth: 430,
        margin: "0 auto",
        fontFamily: "'DM Sans', var(--font-dm-sans), sans-serif",
        color: "#F0EDE8",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <AmbientOrbs />
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
