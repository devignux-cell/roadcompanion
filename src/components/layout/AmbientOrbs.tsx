export default function AmbientOrbs() {
  return (
    <>
      <div
        style={{
          position: "fixed",
          width: 300,
          height: 300,
          borderRadius: "50%",
          top: -80,
          right: -80,
          background: "radial-gradient(circle, rgba(255,92,40,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          width: 250,
          height: 250,
          borderRadius: "50%",
          bottom: 100,
          left: -80,
          background: "radial-gradient(circle, rgba(45,255,199,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
    </>
  );
}
