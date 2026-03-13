import type { ReactNode } from "react";
import AmbientOrbs from "./AmbientOrbs";

interface PageWrapperProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export default function PageWrapper({ children, fullWidth = false }: PageWrapperProps) {
  return (
    <div
      style={{
        background: "linear-gradient(to bottom, rgba(30, 30, 30, 0.7), rgba(5, 5, 12, .95))",
        minHeight: "100vh",
        margin: "0 auto",
        fontFamily: "'DM Sans', var(--font-dm-sans), sans-serif",
        color: "#F0EDE8",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <AmbientOrbs />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: fullWidth ? undefined : 900,
          margin: fullWidth ? undefined : "0 auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
