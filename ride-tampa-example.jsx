import { useState, useEffect, useRef } from "react";

const COLORS = {
  bg: "#0A0A0F",
  card: "#13131A",
  cardHover: "#1A1A25",
  accent: "#FF5C28",
  accentGlow: "rgba(255,92,40,0.3)",
  gold: "#F5C842",
  teal: "#2DFFC7",
  purple: "#A259FF",
  text: "#F0EDE8",
  muted: "#6B6878",
  border: "rgba(255,255,255,0.07)",
};

const Tampa = () => {
  const [screen, setScreen] = useState("home");
  const [gameState, setGameState] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [score, setScore] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [streak, setStreak] = useState(0);
  const [showStreakBurst, setShowStreakBurst] = useState(false);
  const [exploreFilter, setExploreFilter] = useState("All");
  const [tipPulse, setTipPulse] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const trivia = {
    Tampa: [
      { q: "Which NFL team plays in Tampa?", a: ["Buccaneers", "Dolphins", "Jaguars", "Panthers"], correct: 0 },
      { q: "Tampa Bay is connected to which body of water?", a: ["Atlantic Ocean", "Gulf of Mexico", "Caribbean Sea", "Lake Erie"], correct: 1 },
      { q: "Ybor City was famous for what industry?", a: ["Fishing", "Citrus", "Cigar rolling", "Shipping"], correct: 2 },
      { q: "What is Tampa's nickname?", a: ["The Sunshine City", "The Bay City", "Cigar City", "Magic City"], correct: 2 },
      { q: "Which year did Tampa host the Super Bowl most recently?", a: ["2017", "2019", "2021", "2023"], correct: 2 },
    ],
    Music: [
      { q: "What genre of music originated in Tampa's Ybor City scene?", a: ["Jazz", "Latin Trap", "Death Metal", "Blues"], correct: 2 },
      { q: "Which Florida city hosted Ultra Music Festival?", a: ["Tampa", "Orlando", "Miami", "Jacksonville"], correct: 2 },
      { q: "What's the name of the biggest music venue in Tampa?", a: ["Amalie Arena", "Raymond James", "Waterworks", "Jannus Live"], correct: 0 },
      { q: "Which legendary band is from Tampa?", a: ["Lynyrd Skynyrd", "Matchbox 20", "The Killers", "Sublime"], correct: 1 },
      { q: "Florida Man by which artist topped charts?", a: ["Post Malone", "Jon Pardi", "Kane Brown", "Luke Bryan"], correct: 1 },
    ],
    Food: [
      { q: "The Cuban sandwich originated in which Florida city?", a: ["Miami", "Tampa", "Orlando", "Key West"], correct: 1 },
      { q: "What seafood is Tampa most famous for?", a: ["Lobster", "Stone Crab", "Grouper", "Shrimp"], correct: 2 },
      { q: "Ciccio's is a famous Tampa restaurant known for what?", a: ["Pizza", "Burgers", "Tacos", "Sushi"], correct: 0 },
      { q: "What Florida citrus grows near Tampa?", a: ["Blood oranges", "Mandarins", "Navel oranges", "All of the above"], correct: 3 },
      { q: "Columbia Restaurant in Ybor City is Florida's oldest restaurant (opened when?)", a: ["1905", "1920", "1888", "1932"], correct: 0 },
    ],
    Sports: [
      { q: "Tampa Bay Lightning play which sport?", a: ["Football", "Baseball", "Hockey", "Basketball"], correct: 2 },
      { q: "The Tampa Bay Rays play at which stadium?", a: ["Tropicana Field", "Amalie Arena", "Raymond James", "Steinbrenner Field"], correct: 0 },
      { q: "In which year did the Bucs win their first Super Bowl?", a: ["1999", "2002", "2005", "2008"], correct: 1 },
      { q: "Tom Brady won how many Super Bowls with the Bucs?", a: ["0", "1", "2", "3"], correct: 1 },
      { q: "USF Bulls are the sports teams of which Tampa university?", a: ["UT", "USF", "HCC", "Eckerd"], correct: 1 },
    ],
  };

  const places = [
    { name: "Columbia Restaurant", cat: "Food", tag: "Historic", desc: "Florida's oldest restaurant. Flamenco shows nightly.", hood: "Ybor City", emoji: "🍽️", color: COLORS.accent },
    { name: "Ulele", cat: "Food", tag: "Waterfront", desc: "Native-inspired cuisine on the Hillsborough River.", hood: "Heights", emoji: "🌊", color: "#2DFFC7" },
    { name: "Armature Works", cat: "Food", tag: "Market", desc: "Tampa's coolest food hall with river views.", hood: "Heights", emoji: "🏛️", color: COLORS.gold },
    { name: "Bern's Steak House", cat: "Food", tag: "Iconic", desc: "Legendary steakhouse with the world's largest wine cellar.", hood: "Hyde Park", emoji: "🥩", color: COLORS.accent },
    { name: "Busch Gardens", cat: "Attractions", tag: "Thrill", desc: "World-class rides + live animals. All ages.", hood: "Temple Terrace", emoji: "🎢", color: COLORS.purple },
    { name: "Channelside Bay Plaza", cat: "Bars", tag: "Nightlife", desc: "Waterfront bars and live music scene.", hood: "Downtown", emoji: "🍹", color: "#FF87C3" },
    { name: "Sparkman Wharf", cat: "Bars", tag: "Outdoor", desc: "Container bars, fire pits, great vibes.", hood: "Downtown", emoji: "⚓", color: COLORS.teal },
    { name: "Clearwater Beach", cat: "Beaches", tag: "30 min away", desc: "Consistently ranked America's best beach.", hood: "Pinellas", emoji: "🏖️", color: COLORS.gold },
    { name: "The Tampa Riverwalk", cat: "Attractions", tag: "Free", desc: "2.6 miles of waterfront walkway + parks.", hood: "Downtown", emoji: "🌿", color: COLORS.teal },
    { name: "Ichicoro Ramen", cat: "Food", tag: "Must-try", desc: "Tampa's best ramen. Cash only. Worth it.", hood: "Seminole Heights", emoji: "🍜", color: "#FF87C3" },
  ];

  const events = [
    { title: "Gasparilla Music Fest", date: "Mar 15", venue: "Curtis Hixon Park", type: "Music", color: COLORS.accent, emoji: "🎸" },
    { title: "Tampa Bay Beer Week", date: "Mar 20–27", venue: "Various venues", type: "Food", color: COLORS.gold, emoji: "🍺" },
    { title: "Bucs vs Saints", date: "Mar 22", venue: "Raymond James", type: "Sports", color: "#FF4444", emoji: "🏈" },
    { title: "Ybor City Night Market", date: "Every Sat", venue: "7th Ave", type: "Market", color: COLORS.teal, emoji: "🌙" },
    { title: "Jazz & Rib Fest", date: "Apr 5", venue: "Vinoy Park", type: "Music", color: COLORS.purple, emoji: "🎷" },
    { title: "Lightning vs Panthers", date: "Apr 2", venue: "Amalie Arena", type: "Sports", color: "#00B4D8", emoji: "🏒" },
  ];

  const categories = Object.keys(trivia);

  const startGame = (cat) => {
    setSelectedCategory(cat);
    setScore(0);
    setQuestionIndex(0);
    setAnswered(null);
    setStreak(0);
    setScreen("game");
  };

  const handleAnswer = (idx) => {
    if (answered !== null) return;
    const q = trivia[selectedCategory][questionIndex];
    const correct = idx === q.correct;
    setAnswered(idx);
    if (correct) {
      setScore(s => s + 100 + streak * 10);
      setStreak(s => {
        const ns = s + 1;
        if (ns >= 3) setShowStreakBurst(true);
        return ns;
      });
    } else {
      setStreak(0);
    }
    setTimeout(() => {
      setShowStreakBurst(false);
      if (questionIndex < trivia[selectedCategory].length - 1) {
        setQuestionIndex(i => i + 1);
        setAnswered(null);
      } else {
        setScreen("results");
      }
    }, 1200);
  };

  const exploreCategories = ["All", "Food", "Bars", "Beaches", "Attractions"];
  const filteredPlaces = exploreFilter === "All" ? places : places.filter(p => p.cat === exploreFilter);

  const goBack = () => {
    setScreen("home");
    setGameState(null);
    setSelectedCategory(null);
  };

  const styles = {
    root: {
      background: COLORS.bg,
      minHeight: "100vh",
      maxWidth: 430,
      margin: "0 auto",
      fontFamily: "'DM Sans', sans-serif",
      color: COLORS.text,
      overflowX: "hidden",
      position: "relative",
    },
    orb1: {
      position: "fixed", width: 300, height: 300,
      borderRadius: "50%", top: -80, right: -80,
      background: "radial-gradient(circle, rgba(255,92,40,0.12) 0%, transparent 70%)",
      pointerEvents: "none", zIndex: 0,
    },
    orb2: {
      position: "fixed", width: 250, height: 250,
      borderRadius: "50%", bottom: 100, left: -80,
      background: "radial-gradient(circle, rgba(45,255,199,0.08) 0%, transparent 70%)",
      pointerEvents: "none", zIndex: 0,
    },
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${COLORS.bg}; }
        ::-webkit-scrollbar { display: none; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes burst {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .card-hover {
          transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }
        .card-hover:active {
          transform: scale(0.97);
        }
        .fadeUp { animation: fadeUp 0.5s ease forwards; }
        .float { animation: float 3s ease-in-out infinite; }
      `}</style>
      <div style={styles.root}>
        <div style={styles.orb1} />
        <div style={styles.orb2} />

        {screen === "home" && <HomeScreen setScreen={setScreen} mounted={mounted} />}
        {screen === "games" && <GamesScreen categories={categories} startGame={startGame} goBack={goBack} />}
        {screen === "game" && (
          <GameScreen
            category={selectedCategory}
            questions={trivia[selectedCategory]}
            questionIndex={questionIndex}
            answered={answered}
            handleAnswer={handleAnswer}
            score={score}
            streak={streak}
            showStreakBurst={showStreakBurst}
            goBack={() => setScreen("games")}
          />
        )}
        {screen === "results" && (
          <ResultsScreen score={score} category={selectedCategory} streak={streak} goBack={goBack} playAgain={() => startGame(selectedCategory)} />
        )}
        {screen === "explore" && (
          <ExploreScreen places={filteredPlaces} filter={exploreFilter} setFilter={setExploreFilter} categories={exploreCategories} goBack={goBack} />
        )}
        {screen === "events" && <EventsScreen events={events} goBack={goBack} />}
        {screen === "tip" && <TipScreen goBack={goBack} pulse={tipPulse} setPulse={setTipPulse} />}
        {screen === "travel" && <TravelScreen goBack={goBack} />}
      </div>
    </>
  );
};

// ─── HOME ───────────────────────────────────────────────
const HomeScreen = ({ setScreen, mounted }) => {
  const nav = [
    { label: "Play Games", icon: "🎮", screen: "games", color: COLORS.accent, delay: 0 },
    { label: "Explore Tampa", icon: "🗺️", screen: "explore", color: COLORS.teal, delay: 60 },
    { label: "Things To Do", icon: "🎭", screen: "events", color: COLORS.purple, delay: 120 },
    { label: "Travel Help", icon: "✈️", screen: "travel", color: COLORS.gold, delay: 180 },
    { label: "Tip Your Driver", icon: "💛", screen: "tip", color: "#FF87C3", delay: 240 },
  ];

  return (
    <div style={{ padding: "0 0 40px", position: "relative", zIndex: 1 }}>
      {/* Hero */}
      <div style={{
        padding: "60px 24px 40px",
        textAlign: "center",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.8s ease",
      }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: COLORS.accent, fontWeight: 600, textTransform: "uppercase", marginBottom: 16 }}>
          Welcome aboard
        </div>
        <div style={{ fontSize: 44, fontFamily: "'Syne', sans-serif", fontWeight: 800, lineHeight: 1.05, marginBottom: 12 }}>
          Ride<br /><span style={{ color: COLORS.accent }}>Tampa</span>
        </div>
        <div style={{ fontSize: 15, color: COLORS.muted, lineHeight: 1.6, maxWidth: 260, margin: "0 auto" }}>
          Make your ride more fun — games, local spots & more
        </div>
      </div>

      {/* Live badge */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(45,255,199,0.08)", border: "1px solid rgba(45,255,199,0.2)",
          borderRadius: 100, padding: "8px 16px", fontSize: 12, color: COLORS.teal
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.teal, animation: "pulse 2s infinite" }} />
          Top score today: <strong>1,840</strong> — TampaKing🏆
        </div>
      </div>

      {/* Nav cards */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {nav.map((item, i) => (
          <NavCard key={item.screen} item={item} setScreen={setScreen} delay={item.delay} mounted={mounted} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 40, fontSize: 11, color: COLORS.muted }}>
        Some links may earn a commission · Tips appreciated, never expected
      </div>
    </div>
  );
};

const NavCard = ({ item, setScreen, delay, mounted }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="card-hover"
      onClick={() => setScreen(item.screen)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? COLORS.cardHover : COLORS.card,
        border: `1px solid ${hover ? item.color + "40" : COLORS.border}`,
        borderRadius: 20,
        padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms, background 0.2s, border 0.2s`,
        boxShadow: hover ? `0 0 30px ${item.color}18` : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: item.color + "18",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
          border: `1px solid ${item.color}30`,
        }}>
          {item.icon}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{item.label}</div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
            {item.screen === "games" && "Trivia · This-or-That · Leaderboard"}
            {item.screen === "explore" && "Food · Bars · Beaches · Gems"}
            {item.screen === "events" && "Concerts · Sports · Festivals"}
            {item.screen === "travel" && "Hotels · Flights · Experiences"}
            {item.screen === "tip" && "Cash App · Venmo · PayPal"}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 18, color: COLORS.muted, opacity: hover ? 1 : 0.4, transition: "opacity 0.2s" }}>→</div>
    </div>
  );
};

// ─── GAMES ──────────────────────────────────────────────
const GamesScreen = ({ categories, startGame, goBack }) => {
  const catColors = [COLORS.accent, COLORS.teal, COLORS.gold, COLORS.purple];
  const catEmojis = ["🌴", "🎵", "🍕", "⚡"];

  return (
    <div style={{ padding: "24px 16px 40px", position: "relative", zIndex: 1 }}>
      <BackHeader title="Quick Games" onBack={goBack} />

      <div style={{ marginTop: 8, marginBottom: 24 }}>
        <div style={{ fontSize: 28, fontFamily: "'Syne', sans-serif", fontWeight: 800 }}>Choose a Category</div>
        <div style={{ fontSize: 14, color: COLORS.muted, marginTop: 6 }}>5 questions · Score as high as you can</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {categories.map((cat, i) => {
          const [hover, setHover] = useState(false);
          return (
            <div
              key={cat}
              className="card-hover"
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onClick={() => startGame(cat)}
              style={{
                background: hover ? catColors[i] + "22" : COLORS.card,
                border: `1px solid ${hover ? catColors[i] + "60" : COLORS.border}`,
                borderRadius: 20, padding: "24px 16px",
                textAlign: "center",
                animation: `fadeUp 0.4s ease ${i * 80}ms both`,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10, animation: "float 3s ease-in-out infinite" }}>{catEmojis[i]}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: hover ? catColors[i] : COLORS.text }}>{cat}</div>
              <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>{Object.values({Tampa:5,Music:5,Food:5,Sports:5})[i]} questions</div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard teaser */}
      <div style={{ marginTop: 24, background: COLORS.card, borderRadius: 20, padding: 20, border: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>🏆 Today's Leaders</div>
          <div style={{ fontSize: 11, color: COLORS.accent }}>LIVE</div>
        </div>
        {[["TampaKing", 1840, COLORS.gold], ["SunshineQuiz", 1620, COLORS.muted], ["BayCityRider", 1400, "#CD7F32"]].map(([name, pts, c], i) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < 2 ? `1px solid ${COLORS.border}` : "none" }}>
            <div style={{ width: 24, fontWeight: 700, color: c, fontSize: 13 }}>#{i + 1}</div>
            <div style={{ flex: 1, fontSize: 14 }}>{name}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: c }}>{pts.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── GAME ───────────────────────────────────────────────
const GameScreen = ({ category, questions, questionIndex, answered, handleAnswer, score, streak, showStreakBurst, goBack }) => {
  const q = questions[questionIndex];
  const progress = (questionIndex / questions.length) * 100;

  return (
    <div style={{ padding: "24px 16px 40px", position: "relative", zIndex: 1, minHeight: "100vh" }}>
      <BackHeader title={`${category} Trivia`} onBack={goBack} />

      {/* Progress */}
      <div style={{ marginTop: 16, marginBottom: 8, display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.muted }}>
        <span>Q{questionIndex + 1} of {questions.length}</span>
        <span style={{ color: COLORS.gold }}>⚡ {streak} streak</span>
      </div>
      <div style={{ height: 4, background: COLORS.card, borderRadius: 100, marginBottom: 24, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${progress}%`,
          background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.gold})`,
          borderRadius: 100, transition: "width 0.4s ease"
        }} />
      </div>

      {/* Score */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: COLORS.muted }}>Score</div>
        <div style={{ fontSize: 42, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: COLORS.text }}>{score}</div>
      </div>

      {/* Question */}
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 24, padding: "28px 24px", marginBottom: 20, textAlign: "center",
        animation: "fadeUp 0.4s ease",
      }}>
        <div style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.5 }}>{q.q}</div>
      </div>

      {/* Answers */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {q.a.map((ans, i) => {
          const isCorrect = i === q.correct;
          const isSelected = i === answered;
          let bg = COLORS.card;
          let border = COLORS.border;
          let textColor = COLORS.text;
          if (answered !== null) {
            if (isCorrect) { bg = "rgba(45,255,199,0.15)"; border = COLORS.teal; textColor = COLORS.teal; }
            else if (isSelected) { bg = "rgba(255,68,68,0.15)"; border = "#FF4444"; textColor = "#FF4444"; }
          }
          return (
            <div
              key={i}
              className="card-hover"
              onClick={() => handleAnswer(i)}
              style={{
                background: bg, border: `1px solid ${border}`,
                borderRadius: 16, padding: "16px 20px",
                fontSize: 15, color: textColor,
                transition: "all 0.25s ease",
                display: "flex", alignItems: "center", gap: 12,
                animation: `fadeUp 0.3s ease ${i * 60}ms both`,
              }}
            >
              <span style={{
                width: 28, height: 28, borderRadius: "50%",
                background: answered !== null && isCorrect ? COLORS.teal + "30" : COLORS.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                color: answered !== null && isCorrect ? COLORS.teal : COLORS.muted
              }}>
                {["A", "B", "C", "D"][i]}
              </span>
              {ans}
              {answered !== null && isCorrect && <span style={{ marginLeft: "auto" }}>✓</span>}
              {answered !== null && isSelected && !isCorrect && <span style={{ marginLeft: "auto" }}>✗</span>}
            </div>
          );
        })}
      </div>

      {/* Streak burst */}
      {showStreakBurst && (
        <div style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: 64, animation: "burst 0.9s ease forwards",
          zIndex: 100, pointerEvents: "none",
        }}>
          🔥
        </div>
      )}
    </div>
  );
};

// ─── RESULTS ─────────────────────────────────────────────
const ResultsScreen = ({ score, category, streak, goBack, playAgain }) => {
  const grade = score >= 400 ? "🏆 Champion!" : score >= 250 ? "⭐ Nice!" : "📚 Keep Playing!";
  return (
    <div style={{ padding: "24px 16px 40px", position: "relative", zIndex: 1, textAlign: "center" }}>
      <div style={{ paddingTop: 60, animation: "fadeUp 0.5s ease" }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>{grade.split(" ")[0]}</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 8 }}>{grade.slice(grade.indexOf(" ") + 1)}</div>
        <div style={{ fontSize: 15, color: COLORS.muted, marginBottom: 40 }}>You scored in {category} trivia</div>

        <div style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`,
          borderRadius: 28, padding: 32, marginBottom: 32,
        }}>
          <div style={{ fontSize: 56, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: COLORS.accent }}>{score}</div>
          <div style={{ fontSize: 14, color: COLORS.muted, marginTop: 4 }}>points earned</div>
          {streak > 0 && (
            <div style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6, background: COLORS.gold + "15", border: `1px solid ${COLORS.gold}30`, borderRadius: 100, padding: "6px 14px", fontSize: 13, color: COLORS.gold }}>
              🔥 Best streak: {streak}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={playAgain} style={{
            background: COLORS.accent, color: "#fff", border: "none",
            borderRadius: 16, padding: "16px", fontSize: 15, fontWeight: 600,
            cursor: "pointer", width: "100%",
          }}>
            Play Again
          </button>
          <button onClick={goBack} style={{
            background: COLORS.card, color: COLORS.text, border: `1px solid ${COLORS.border}`,
            borderRadius: 16, padding: "16px", fontSize: 15,
            cursor: "pointer", width: "100%",
          }}>
            Home
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── EXPLORE ─────────────────────────────────────────────
const ExploreScreen = ({ places, filter, setFilter, categories, goBack }) => (
  <div style={{ padding: "24px 0 40px", position: "relative", zIndex: 1 }}>
    <div style={{ padding: "0 16px" }}>
      <BackHeader title="Explore Tampa" onBack={goBack} />
      <div style={{ marginTop: 8, marginBottom: 20 }}>
        <div style={{ fontSize: 28, fontFamily: "'Syne', sans-serif", fontWeight: 800 }}>Local Picks</div>
        <div style={{ fontSize: 14, color: COLORS.muted, marginTop: 4 }}>Curated by locals, trusted by riders</div>
      </div>
    </div>

    {/* Filters */}
    <div style={{ display: "flex", gap: 8, paddingLeft: 16, overflowX: "auto", paddingBottom: 4, paddingRight: 16, marginBottom: 20 }}>
      {categories.map(cat => (
        <div
          key={cat}
          onClick={() => setFilter(cat)}
          style={{
            flexShrink: 0, padding: "8px 16px", borderRadius: 100, fontSize: 13, fontWeight: 500,
            background: filter === cat ? COLORS.accent : COLORS.card,
            color: filter === cat ? "#fff" : COLORS.muted,
            border: `1px solid ${filter === cat ? COLORS.accent : COLORS.border}`,
            cursor: "pointer", transition: "all 0.2s",
          }}
        >
          {cat}
        </div>
      ))}
    </div>

    {/* Cards */}
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 16px" }}>
      {places.map((p, i) => <PlaceCard key={p.name} place={p} i={i} />)}
    </div>
  </div>
);

const PlaceCard = ({ place, i }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="card-hover"
      onClick={() => setExpanded(!expanded)}
      style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 20, overflow: "hidden",
        animation: `fadeUp 0.4s ease ${i * 60}ms both`,
        transition: "border 0.2s",
        borderColor: expanded ? place.color + "40" : COLORS.border,
      }}
    >
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: place.color + "18", border: `1px solid ${place.color}30`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0,
        }}>{place.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{place.name}</div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{place.hood} · {place.cat}</div>
        </div>
        <div style={{
          flexShrink: 0, background: place.color + "18", color: place.color,
          fontSize: 10, fontWeight: 700, borderRadius: 100, padding: "4px 10px",
          border: `1px solid ${place.color}30`,
        }}>
          {place.tag}
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 20px 16px", animation: "fadeUp 0.25s ease" }}>
          <div style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.6 }}>{place.desc}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <a href={`https://maps.google.com/?q=${encodeURIComponent(place.name + " Tampa FL")}`} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, background: COLORS.teal + "15", color: COLORS.teal, border: `1px solid ${COLORS.teal}30`, borderRadius: 10, padding: "10px", fontSize: 12, fontWeight: 600, textAlign: "center", textDecoration: "none" }}
              onClick={e => e.stopPropagation()}>
              📍 Directions
            </a>
            <div style={{ flex: 1, background: COLORS.accent + "15", color: COLORS.accent, border: `1px solid ${COLORS.accent}30`, borderRadius: 10, padding: "10px", fontSize: 12, fontWeight: 600, textAlign: "center", cursor: "pointer" }}
              onClick={e => e.stopPropagation()}>
              🔗 Details
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── EVENTS ──────────────────────────────────────────────
const EventsScreen = ({ events, goBack }) => (
  <div style={{ padding: "24px 16px 40px", position: "relative", zIndex: 1 }}>
    <BackHeader title="Things To Do" onBack={goBack} />
    <div style={{ marginTop: 8, marginBottom: 24 }}>
      <div style={{ fontSize: 28, fontFamily: "'Syne', sans-serif", fontWeight: 800 }}>What's Happening</div>
      <div style={{ fontSize: 14, color: COLORS.muted, marginTop: 4 }}>Tampa events this week & beyond</div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {events.map((ev, i) => {
        const [hover, setHover] = useState(false);
        return (
          <div
            key={ev.title}
            className="card-hover"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              background: hover ? COLORS.cardHover : COLORS.card,
              border: `1px solid ${hover ? ev.color + "40" : COLORS.border}`,
              borderRadius: 20, padding: "18px 20px",
              display: "flex", alignItems: "center", gap: 14,
              animation: `fadeUp 0.4s ease ${i * 70}ms both`,
              boxShadow: hover ? `0 0 20px ${ev.color}15` : "none",
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: ev.color + "18", border: `1px solid ${ev.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0,
            }}>{ev.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{ev.title}</div>
              <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 3 }}>{ev.date} · {ev.venue}</div>
            </div>
            <div style={{
              flexShrink: 0, background: ev.color + "18", color: ev.color,
              fontSize: 10, fontWeight: 700, borderRadius: 100, padding: "5px 10px",
            }}>
              {ev.type}
            </div>
          </div>
        );
      })}
    </div>
    <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: COLORS.muted }}>
      Powered by local listings · Some links may earn a commission
    </div>
  </div>
);

// ─── TRAVEL ──────────────────────────────────────────────
const TravelScreen = ({ goBack }) => {
  const links = [
    { label: "Book a Hotel", desc: "Best rates via Booking.com", icon: "🏨", color: COLORS.teal, url: "https://booking.com" },
    { label: "Rent a Car", desc: "Deals via DiscoverCars", icon: "🚗", color: COLORS.accent, url: "https://discovercars.com" },
    { label: "Tampa Experiences", desc: "Tours & Activities via Viator", icon: "🎟️", color: COLORS.purple, url: "https://viator.com" },
    { label: "Flights", desc: "Search via Expedia", icon: "✈️", color: COLORS.gold, url: "https://expedia.com" },
    { label: "Shop Tampa", desc: "Amazon local picks", icon: "🛍️", color: "#FF87C3", url: "https://amazon.com" },
  ];
  return (
    <div style={{ padding: "24px 16px 40px", position: "relative", zIndex: 1 }}>
      <BackHeader title="Travel Help" onBack={goBack} />
      <div style={{ marginTop: 8, marginBottom: 24 }}>
        <div style={{ fontSize: 28, fontFamily: "'Syne', sans-serif", fontWeight: 800 }}>Plan Your Stay</div>
        <div style={{ fontSize: 14, color: COLORS.muted, marginTop: 4 }}>Handpicked travel resources</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {links.map((l, i) => (
          <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <div
              className="card-hover"
              style={{
                background: COLORS.card, border: `1px solid ${COLORS.border}`,
                borderRadius: 20, padding: "18px 20px",
                display: "flex", alignItems: "center", gap: 16,
                animation: `fadeUp 0.4s ease ${i * 70}ms both`,
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: l.color + "18", border: `1px solid ${l.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0,
              }}>{l.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.text }}>{l.label}</div>
                <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{l.desc}</div>
              </div>
              <div style={{ color: l.color, fontSize: 16 }}>→</div>
            </div>
          </a>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: COLORS.muted }}>
        Some links may earn a commission · FTC-compliant disclosure
      </div>
    </div>
  );
};

// ─── TIP ─────────────────────────────────────────────────
const TipScreen = ({ goBack }) => {
  const [sent, setSent] = useState(null);
  const tips = [
    { name: "Cash App", handle: "$RoamCompanion", icon: "💚", color: "#00D632", url: "https://cash.app" },
    { name: "Venmo", handle: "@RoamCompanion", icon: "💙", color: "#3D95CE", url: "https://venmo.com" },
    { name: "PayPal", handle: "RoamCompanion", icon: "💛", color: "#FFB700", url: "https://paypal.me" },
  ];
  return (
    <div style={{ padding: "24px 16px 40px", position: "relative", zIndex: 1 }}>
      <BackHeader title="Tip Jar" onBack={goBack} />
      <div style={{ textAlign: "center", paddingTop: 32, paddingBottom: 32 }}>
        <div style={{ fontSize: 64, marginBottom: 12, animation: "float 3s ease-in-out infinite" }}>💛</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, marginBottom: 8 }}>Leave a Tip</div>
        <div style={{ fontSize: 14, color: COLORS.muted, lineHeight: 1.7, maxWidth: 260, margin: "0 auto" }}>
          Tips appreciated, never expected.<br />Every bit means a lot.
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tips.map((t, i) => (
          <a key={t.name} href={t.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}
            onClick={() => setSent(t.name)}>
            <div
              className="card-hover"
              style={{
                background: sent === t.name ? t.color + "20" : COLORS.card,
                border: `1px solid ${sent === t.name ? t.color + "60" : COLORS.border}`,
                borderRadius: 20, padding: "20px 24px",
                display: "flex", alignItems: "center", gap: 16,
                animation: `fadeUp 0.4s ease ${i * 80}ms both`,
              }}
            >
              <div style={{ fontSize: 32 }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, color: COLORS.text }}>{t.name}</div>
                <div style={{ fontSize: 13, color: t.color, marginTop: 2 }}>{t.handle}</div>
              </div>
              {sent === t.name
                ? <div style={{ color: t.color, fontSize: 20 }}>✓</div>
                : <div style={{ color: COLORS.muted, fontSize: 16 }}>→</div>}
            </div>
          </a>
        ))}
      </div>
      {sent && (
        <div style={{
          marginTop: 24, textAlign: "center", animation: "fadeUp 0.3s ease",
          background: "rgba(45,255,199,0.08)", border: "1px solid rgba(45,255,199,0.2)",
          borderRadius: 16, padding: 16, fontSize: 14, color: COLORS.teal,
        }}>
          🙏 Thank you! Your generosity keeps this ride going.
        </div>
      )}
    </div>
  );
};

// ─── SHARED ──────────────────────────────────────────────
const BackHeader = ({ title, onBack }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
    <div
      onClick={onBack}
      className="card-hover"
      style={{
        width: 40, height: 40, borderRadius: 12,
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, cursor: "pointer", flexShrink: 0,
      }}
    >←</div>
    <div style={{ fontSize: 13, color: COLORS.muted, fontWeight: 500 }}>{title}</div>
  </div>
);

export default Tampa;
