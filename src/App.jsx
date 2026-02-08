import React, { useEffect, useRef, useState } from "react";

export default function App() {
  const [c1, setC1] = useState(0);
  const [c2, setC2] = useState(0);
  const [c3, setC3] = useState(0);
  const [theme, setTheme] = useState("light");
  const [lastWinner, setLastWinner] = useState(null);
  const [confettiActive, setConfettiActive] = useState(false);
  const confettiRef = useRef(null);
  const particlesRef = useRef(null);
  const confettiTimerRef = useRef(null);

  const total = c1 + c2 + c3;

  let winnerText = "";
  if (total === 0) winnerText = "No votes yet — Start voting!";
  else if (c1 > c2 && c1 > c3) winnerText = "Candidate 1 wins!";
  else if (c2 > c1 && c2 > c3) winnerText = "Candidate 2 wins!";
  else if (c3 > c1 && c3 > c2) winnerText = "Candidate 3 wins!";
  else winnerText = "It's a tie — re-poll!";

  const audioCtxRef = useRef(null);
  useEffect(() => {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
    };
  }, []);

  function playClickSound() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 660;
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    o.stop(ctx.currentTime + 0.13);
  }

  function playWinnerSound() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    o1.type = "sine";
    o2.type = "triangle";
    o1.frequency.value = 440;
    o2.frequency.value = 660;
    g.gain.value = 0.06;
    o1.connect(g);
    o2.connect(g);
    g.connect(ctx.destination);
    o1.start(now);
    o2.start(now);
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    o1.stop(now + 0.82);
    o2.stop(now + 0.82);
  }

  // Responsive breakpoint detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 600);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Confetti canvas setup
  useEffect(() => {
    const canvas = confettiRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let particles = [];
    let raf;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    function spawnConfetti(x = canvas.width / (2 * (window.devicePixelRatio || 1)), y = canvas.height / (3 * (window.devicePixelRatio || 1)), spread = 120, count = 120) {
      const colors = ["#ff4d6d", "#ffd166", "#6ee7b7", "#7dd3fc", "#c084fc", "#ffd1dc"];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI / 180) * (Math.random() * spread - spread / 2);
        const speed = 2 + Math.random() * 6;
        particles.push({
          x: x + (Math.random() - 0.5) * 160,
          y: y + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 3,
          size: 6 + Math.random() * 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.3,
          ttl: 180 + Math.random() * 120,
        });
      }
    }

    function step() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += 0.15;
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        p.ttl--;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
        if (p.ttl <= 0 || p.y > canvas.height + 40) {
          particles.splice(i, 1);
        }
      }
      raf = requestAnimationFrame(step);
    }

    step();

    const unsub = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };

    canvas._spawnConfetti = spawnConfetti;

    return unsub;
  }, []);

  // Confetti effect on winner change
  useEffect(() => {
    const isClearWinner =
      total > 0 &&
      ((c1 > c2 && c1 > c3) || (c2 > c1 && c2 > c3) || (c3 > c1 && c3 > c2));

    const currentWinner = isClearWinner
      ? c1 > c2 && c1 > c3
        ? 1
        : c2 > c1 && c2 > c3
        ? 2
        : 3
      : null;

    if (currentWinner && currentWinner !== lastWinner) {
      setLastWinner(currentWinner);
      setConfettiActive(true);

      const canvas = confettiRef.current;
      if (canvas && canvas._spawnConfetti) {
        canvas._spawnConfetti(window.innerWidth / 2, window.innerHeight / 3, 160, 180);
      }
      playWinnerSound();

      clearTimeout(confettiTimerRef.current);
      confettiTimerRef.current = setTimeout(() => setConfettiActive(false), 2000);
    }

    if (!currentWinner) {
      setLastWinner(null);
    }
  }, [c1, c2, c3]);

  // Particles background canvas with proper scaling
  useEffect(() => {
    const canvas = particlesRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    let w = (canvas.width = window.innerWidth * dpr);
    let h = (canvas.height = window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const particles = [];
    const count = Math.max(12, Math.floor(window.innerWidth / 120));

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 6 + Math.random() * 28,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.6,
        alpha: 0.08 + Math.random() * 0.12,
      });
    }

    function resize() {
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    window.addEventListener("resize", resize);

    let raf;
    function draw() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -50) p.x = window.innerWidth + 50;
        if (p.x > window.innerWidth + 50) p.x = -50;
        if (p.y < -50) p.y = window.innerHeight + 50;
        if (p.y > window.innerHeight + 50) p.y = -50;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  function handleVote(setter, prev) {
    playClickSound();
    setter(prev + 1);
  }

  // Responsive style helpers
  const dark = theme === "dark";
  const rootStyle = {
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    minHeight: "100vh",
    position: "relative",
    overflowX: "hidden",
    maxWidth: "100vw",
    background: dark
      ? "radial-gradient(1200px 600px at 10% 10%, rgba(40,40,60,0.24), transparent), linear-gradient(180deg,#071026 0%, #0b1b2b 70%)"
      : "linear-gradient(180deg,#fdfbfb 0%, #e6e9f0 70%)",
    color: dark ? "#e6f7ff" : "#06232a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: isMobile ? 12 : 28,
  };

  const cardStyle = {
    width: "100%",
    maxWidth: 880,
    borderRadius: 20,
    padding: isMobile ? 12 : 28,
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 380px",
    gap: 22,
    background: dark ? "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))" : "rgba(255,255,255,0.7)",
    boxShadow: dark ? "0 10px 40px rgba(0,0,0,0.6)" : "0 10px 30px rgba(20,40,60,0.08)",
    border: dark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(10,30,60,0.04)",
    backdropFilter: "blur(6px)",
  };

  const leftStyle = {
    padding: isMobile ? 6 : 12,
    display: "flex",
    flexDirection: "column",
    gap: isMobile ? 12 : 20,
  };

  const rightStyle = {
    padding: isMobile ? 12 : 16,
    borderRadius: 14,
    background: dark ? "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))" : "rgba(0,0,0,0.02)",
  };

  const titleStyle = {
    fontSize: isMobile ? 22 : 28,
    fontWeight: 700,
    letterSpacing: -0.3,
    display: "flex",
    alignItems: "center",
    gap: 12,
  };

  const subtitleStyle = {
    opacity: 0.85,
    marginTop: 2,
    fontSize: 13,
  };

  const buttonsContainerStyle = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  };

  function buttonStyle(variant = 1) {
    const gradient =
      variant === 1
        ? "linear-gradient(135deg,#ff4d6d,#ff8a5b)"
        : variant === 2
        ? "linear-gradient(135deg,#7bd389,#3bd5d0)"
        : "linear-gradient(135deg,#7dd3fc,#7c5cff)";
    return {
      padding: "14px 18px",
      borderRadius: 12,
      border: "none",
      color: dark ? "#02121a" : "#031019",
      fontWeight: 800,
      cursor: "pointer",
      outline: "none",
      background: gradient,
      boxShadow: "0 6px 18px rgba(0,0,0,0.18), inset 0 -4px 12px rgba(0,0,0,0.06)",
      transform: "translateZ(0)",
      transition: "transform 180ms ease, box-shadow 180ms ease, filter 180ms ease",
      minWidth: isMobile ? "100%" : 180,
      display: "inline-flex",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      overflow: "hidden",
      marginBottom: isMobile ? 8 : 0,
    };
  }

  function createRipple(e) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const r = document.createElement("span");
    const size = Math.max(rect.width, rect.height) * 1.6;
    r.style.position = "absolute";
    r.style.left = `${e.clientX - rect.left - size / 2}px`;
    r.style.top = `${e.clientY - rect.top - size / 2}px`;
    r.style.width = r.style.height = `${size}px`;
    r.style.borderRadius = "50%";
    r.style.background = "rgba(255,255,255,0.18)";
    r.style.transform = "scale(0)";
    r.style.opacity = "0.95";
    r.style.pointerEvents = "none";
    r.style.transition = "transform 550ms cubic-bezier(.2,.8,.2,1), opacity 550ms";
    btn.appendChild(r);
    requestAnimationFrame(() => {
      r.style.transform = "scale(1.6)";
      r.style.opacity = "0";
    });
    setTimeout(() => {
      r.remove();
    }, 650);
  }

  const maxVotes = Math.max(1, c1, c2, c3);

  const winnerGlow = confettiActive ? { filter: "drop-shadow(0 8px 30px rgba(0,255,180,0.14))" } : {};

  return (
    <div style={rootStyle}>
      <canvas
        ref={particlesRef}
        style={{ position: "fixed", top: 0, left: 0, zIndex: 0, pointerEvents: "none", maxWidth: "100vw" }}
      />
      <canvas
        ref={confettiRef}
        style={{ position: "fixed", top: 0, left: 0, zIndex: 10, pointerEvents: "none", maxWidth: "100vw" }}
      />

      <div style={{ ...cardStyle, zIndex: 20 }}>
        <div style={leftStyle}>
          <div>
            <div style={titleStyle}>
              <span style={{ fontSize: isMobile ? 26 : 30 }}>🗳️</span>
              <div>
                Voting Booth
                <div style={subtitleStyle}>Cast your vote — results update live</div>
              </div>
            </div>
          </div>

          <div style={buttonsContainerStyle}>
            <button
              style={buttonStyle(1)}
              onClick={(e) => {
                createRipple(e);
                handleVote(setC1, c1);
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
              }}
            >
              Vote Candidate 1
            </button>

            <button
              style={buttonStyle(2)}
              onClick={(e) => {
                createRipple(e);
                handleVote(setC2, c2);
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
              }}
            >
              Vote Candidate 2
            </button>

            <button
              style={buttonStyle(3)}
              onClick={(e) => {
                createRipple(e);
                handleVote(setC3, c3);
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
              }}
            >
              Vote Candidate 3
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginTop: isMobile ? 12 : 6,
              flexWrap: isMobile ? "wrap" : "nowrap",
            }}
          >
            <div style={{ fontWeight: 900, opacity: 0.9 }}>Total Votes</div>
            <div
              style={{
                background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)",
                padding: "6px 12px",
                borderRadius: 999,
                fontWeight: 800,
                minWidth: 72,
                textAlign: "center",
                color: dark ? "#bfffe2" : "#03303a",
              }}
            >
              {total}
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ fontSize: 16, opacity: 0.85 }}>Theme</label>
              <button
                onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: dark ? "linear-gradient(90deg,#2b2f4a,#1c2536)" : "linear-gradient(90deg,#fff,#f0f6ff)",
                  boxShadow: dark ? "0 6px 16px rgba(0,0,0,0.45)" : "0 6px 18px rgba(10,30,60,0.06)",
                  color: dark ? "#9fffe6" : "#06232a",
                  fontWeight: 700,
                }}
              >
                {theme === "dark" ? "Dark" : "Light"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: isMobile ? 8 : 12, marginTop: isMobile ? 12 : 18, flexWrap: isMobile ? "wrap" : "nowrap" }}>
            <div
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                background: dark ? "rgba(26, 24, 24, 0.02)" : "rgba(255,255,255,0.9)",
                boxShadow: "inset 0 -4px 8px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: 16, opacity: 0.8 }}>Candidate 1</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{c1}</div>
            </div>

            <div
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                background: dark ? "hsla(0, 0%, 8%, 0.02)" : "rgba(255,255,255,0.9)",
              }}
            >
              <div style={{ fontSize: 16, opacity: 0.8 }}>Candidate 2</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{c2}</div>
            </div>

            <div
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                background: dark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.9)",
              }}
            >
              <div style={{ fontSize: 16, opacity: 0.8 }}>Candidate 3</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{c3}</div>
            </div>
          </div>
        </div>

        <div style={rightStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.2 }}>Live Results</div>
              <div style={{ fontSize: 13, opacity: 0.75 }}>Animated bar chart — updates instantly</div>
            </div>

            <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 700 }}>{new Date().toLocaleDateString()}</div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", height: 210 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: "100%",
                    background: "linear-gradient(180deg, rgba(255,77,109,0.18), rgba(255,138,91,0.12))",
                    borderRadius: 8,
                    height: `${(c1 / maxVotes) * 100}%`,
                    minHeight: 6,
                    transition: "height 600ms cubic-bezier(.2,.8,.2,1)",
                    boxShadow: "inset 0 -6px 16px rgba(0,0,0,0.12)",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    paddingBottom: 8,
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{c1}</div>
                </div>
                <div style={{ fontSize: 13, marginTop: 6, fontWeight: 700 }}>Candidate 1</div>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: "100%",
                    background: "linear-gradient(180deg, rgba(123,211,137,0.18), rgba(59,213,208,0.12))",
                    borderRadius: 8,
                    height: `${(c2 / maxVotes) * 100}%`,
                    minHeight: 6,
                    transition: "height 600ms cubic-bezier(.2,.8,.2,1)",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    paddingBottom: 8,
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{c2}</div>
                </div>
                <div style={{ fontSize: 13, marginTop: 6, fontWeight: 700 }}>Candidate 2</div>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: "100%",
                    background: "linear-gradient(180deg, rgba(125,211,252,0.18), rgba(124,92,255,0.12))",
                    borderRadius: 8,
                    height: `${(c3 / maxVotes) * 100}%`,
                    minHeight: 6,
                    transition: "height 600ms cubic-bezier(.2,.8,.2,1)",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    paddingBottom: 8,
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{c3}</div>
                </div>
                <div style={{ fontSize: 13, marginTop: 6, fontWeight: 700 }}>Candidate 3</div>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              background: dark ? "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(255,255,255,0.02))" : "rgba(255,255,255,0.95)",
              ...winnerGlow,
              flexWrap: isMobile ? "wrap" : "nowrap",
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    total > 0 && winnerText.includes("wins")
                      ? "linear-gradient(135deg,#00ffae,#00bcd4)"
                      : "linear-gradient(135deg,#9aa2ff,#bdb8ff)",
                  boxShadow:
                    total > 0 && winnerText.includes("wins") ? "0 12px 36px rgba(0,255,174,0.12)" : "0 8px 18px rgba(0,0,0,0.06)",
                  transform: confettiActive ? "scale(1.06)" : "scale(1)",
                  transition: "transform 320ms cubic-bezier(.2,.9,.2,1), box-shadow 320ms",
                }}
              >
                <span style={{ fontSize: 20 }}>{winnerText.includes("wins") ? "🏆" : "📊"}</span>
              </div>

              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{winnerText}</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{total === 0 ? "No votes yet Please cast your vote" : "Live from your session"}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: isMobile ? "wrap" : "nowrap" }}>
              <button
                onClick={() => {
                  setC1(0);
                  setC2(0);
                  setC3(0);
                }}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 800,
                  background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)",
                  minWidth: isMobile ? "100%" : "auto",
                  marginBottom: isMobile ? 8 : 0,
                }}
              >
                Reset
              </button>

              <button
                onClick={() => {
                  const canvas = confettiRef.current;
                  if (canvas && canvas._spawnConfetti) {
                    canvas._spawnConfetti(window.innerWidth / 2, window.innerHeight / 3, 140, 120);
                  }
                  playWinnerSound();
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 800,
                  background: "linear-gradient(90deg,#ffd166,#ff8fa3)",
                  minWidth: isMobile ? "100%" : "auto",
                }}
              >
                Celebrate
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 18,
          left: 18,
          fontSize: 12,
          opacity: 0.6,
          zIndex: 40,
        }}
      >
        Voting UI • Animations • Confetti
      </div>
    </div>
  );
}
