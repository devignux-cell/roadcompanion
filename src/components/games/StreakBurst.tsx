export default function StreakBurst() {
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        fontSize: 64,
        animation: "burst 0.9s ease forwards",
        zIndex: 100,
        pointerEvents: "none",
        transformOrigin: "0 0",
      }}
    >
      🔥
    </div>
  );
}
