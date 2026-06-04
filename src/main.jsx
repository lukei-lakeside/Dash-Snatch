import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Award,
  Camera,
  CheckCircle2,
  Crosshair,
  ImagePlus,
  LocateFixed,
  Lock,
  MapPinned,
  Medal,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Upload,
  UserPlus,
  UserRound,
  Users,
  XCircle
} from "lucide-react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  GoogleAuthProvider
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where
} from "firebase/firestore";
import { firebaseApp, firebaseAuth, firebaseDb } from "./firebase";
import "./styles.css";

void firebaseApp;

const STORAGE_KEY = "dash-snatch-real-sightings";
const PROFILE_KEY = "dash-snatch-profile";
const ONBOARDING_KEY = "dash-snatch-onboarded";
const THEME_KEY = "dash-snatch-theme";

const googleProvider = new GoogleAuthProvider();

const DASH_REFERENCES = [
  "/dash-references/dash-1.png",
  "/dash-references/dash-2.png",
  "/dash-references/dash-3.png"
];

const NAV_ITEMS = [
  { label: "Hunt", path: "/hunt.html", icon: Crosshair },
  { label: "Map", path: "/map.html", icon: MapPinned },
  { label: "Feed", path: "/feed.html", icon: Radio },
  { label: "Friends", path: "/friends.html", icon: UserPlus },
  { label: "Leaders", path: "/leaders.html", icon: Trophy },
  { label: "Profile", path: "/profile.html", icon: UserRound },
  { label: "Settings", path: "/settings.html", icon: Settings }
];

const RANKS = [
  { name: "Spotter", min: 0, color: "#6366f1" },
  { name: "Scout", min: 100, color: "#0ea5e9" },
  { name: "Tracker", min: 300, color: "#10b981" },
  { name: "Hunter", min: 600, color: "#f59e0b" },
  { name: "Master Hunter", min: 1000, color: "#ec4899" },
  { name: "Legend", min: 1500, color: "#8b5cf6" }
];

const QUALITY = [
  { name: "Common", xp: 10, color: "#64748b", threshold: 0.72 },
  { name: "Uncommon", xp: 25, color: "#10b981", threshold: 0.79 },
  { name: "Rare", xp: 50, color: "#3b82f6", threshold: 0.86 },
  { name: "Epic", xp: 100, color: "#a855f7", threshold: 0.92 },
  { name: "Legendary", xp: 250, color: "#f59e0b", threshold: 0.96 }
];

const DEFAULT_PROFILE = {
  username: "You",
  homeBase: "",
  privateByDefault: false,
  theme: "light",
  friends: []
};

const THEMES = [
  { id: "light", label: "Light", description: "Clean bright scouting console." },
  { id: "dusk", label: "Dusk", description: "Indigo and pink hunt mode." },
  { id: "night", label: "Night", description: "Low-light map tracking." }
];

function firebaseMessage(error) {
  const code = error?.code ?? "";
  if (code.includes("email-already-in-use")) return "That email already has an account.";
  if (code.includes("invalid-email")) return "Enter a valid email address.";
  if (code.includes("weak-password")) return "Use a password with at least 6 characters.";
  if (code.includes("invalid-credential") || code.includes("wrong-password")) {
    return "Email or password is incorrect.";
  }
  if (code.includes("user-not-found")) return "No account exists for that email.";
  if (code.includes("operation-not-allowed")) {
    return "Enable Email/Password sign-in in Firebase Authentication.";
  }
  return "Authentication failed. Try again.";
}

function getPage() {
  const name = window.location.pathname.split("/").pop()?.replace(".html", "");
  return name && name !== "index" ? name : "hunt";
}

function getStoredSightings() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveSightings(sightings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sightings));
}

function getStoredProfile() {
  try {
    return { ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem(PROFILE_KEY)) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || getStoredProfile().theme || "light";
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
}

function getOnboardingComplete(user) {
  if (!user) return false;
  return localStorage.getItem(`${ONBOARDING_KEY}:${user.uid}`) === "true";
}

function saveOnboardingComplete(user) {
  localStorage.setItem(`${ONBOARDING_KEY}:${user.uid}`, "true");
}

function normalizeSearch(value) {
  return value.trim().toLowerCase();
}

function profileFromUser(user, profile = DEFAULT_PROFILE) {
  const username =
    profile.username && profile.username !== "You"
      ? profile.username
      : user.displayName || user.email?.split("@")[0] || "You";
  return {
    username,
    usernameLower: normalizeSearch(username),
    email: user.email || "",
    emailLower: normalizeSearch(user.email || ""),
    homeBase: profile.homeBase || "",
    privateByDefault: Boolean(profile.privateByDefault),
    theme: profile.theme || "light",
    friends: profile.friends ?? [],
    updatedAt: serverTimestamp()
  };
}

async function upsertUserProfile(user, profile = DEFAULT_PROFILE) {
  if (!user) return;
  await setDoc(doc(firebaseDb, "users", user.uid), profileFromUser(user, profile), { merge: true });
}

function getCurrentRank(xp) {
  return RANKS.slice().reverse().find((rank) => xp >= rank.min) ?? RANKS[0];
}

function getNextRank(xp) {
  return RANKS.find((rank) => xp < rank.min) ?? RANKS[RANKS.length - 1];
}

function getQualityByConfidence(confidence) {
  return (
    QUALITY.slice()
      .reverse()
      .find((quality) => confidence >= quality.threshold) ?? QUALITY[0]
  );
}

function qualityMeta(name) {
  return QUALITY.find((quality) => quality.name === name) ?? QUALITY[0];
}

function friendKey(friend) {
  return typeof friend === "string" ? friend : friend.uid;
}

function friendName(friend) {
  return typeof friend === "string" ? friend : friend.username || friend.email || "Friend";
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function imageSignature(src) {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, size, size);
  const pixels = context.getImageData(0, 0, size, size).data;
  const bins = new Array(64).fill(0);
  let brightness = 0;
  let contrast = 0;
  let darkPixels = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const light = (red + green + blue) / 3;
    const bin =
      Math.min(3, Math.floor(red / 64)) * 16 +
      Math.min(3, Math.floor(green / 64)) * 4 +
      Math.min(3, Math.floor(blue / 64));
    bins[bin] += 1;
    brightness += light;
    contrast += Math.abs(red - green) + Math.abs(green - blue) + Math.abs(blue - red);
    if (light < 80) darkPixels += 1;
  }

  const total = size * size;
  const magnitude = Math.sqrt(bins.reduce((sum, value) => sum + value * value, 0)) || 1;
  return {
    bins: bins.map((value) => value / magnitude),
    brightness: brightness / total / 255,
    contrast: contrast / total / 255,
    darkRatio: darkPixels / total
  };
}

async function resizeImageDataUrl(src, maxSize = 900, quality = 0.82) {
  const image = await loadImage(src);
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

function similarity(a, b) {
  const histogram = a.bins.reduce((sum, value, index) => sum + value * b.bins[index], 0);
  const brightness = 1 - Math.min(1, Math.abs(a.brightness - b.brightness));
  const contrast = 1 - Math.min(1, Math.abs(a.contrast - b.contrast));
  const dark = 1 - Math.min(1, Math.abs(a.darkRatio - b.darkRatio));
  return histogram * 0.7 + brightness * 0.12 + contrast * 0.08 + dark * 0.1;
}

function timeAgo(iso) {
  const createdAt = iso?.toDate ? iso.toDate() : new Date(iso);
  if (Number.isNaN(createdAt.getTime())) return "just now";
  const seconds = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} day ago`;
}

function useDashReferences() {
  const [referenceSignatures, setReferenceSignatures] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    Promise.all(DASH_REFERENCES.map((src) => imageSignature(src)))
      .then((signatures) => {
        if (!cancelled) {
          setReferenceSignatures(signatures);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { referenceSignatures, status };
}

function useAppState(user) {
  const [sightings, setSightings] = useState(getStoredSightings);
  const [profile, setProfileState] = useState(getStoredProfile);
  const [theme, setThemeState] = useState(getStoredTheme);

  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!user) return undefined;

    upsertUserProfile(user, getStoredProfile()).catch(() => {});

    const unsubscribe = onSnapshot(
      doc(firebaseDb, "users", user.uid),
      (snapshot) => {
        if (!snapshot.exists()) return;
        const remoteProfile = { ...DEFAULT_PROFILE, ...snapshot.data() };
        setProfileState(remoteProfile);
        saveProfile(remoteProfile);
        if (remoteProfile.theme) setThemeState(remoteProfile.theme);
      },
      () => {}
    );

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;

    const ownerIds = [user.uid, ...((profile.friends ?? []).map((friend) => friend.uid).filter(Boolean))];
    const uniqueOwnerIds = [...new Set(ownerIds)].slice(0, 30);
    if (!uniqueOwnerIds.length) return undefined;

    const sightingsQuery = query(
      collection(firebaseDb, "sightings"),
      where("ownerUid", "in", uniqueOwnerIds),
      limit(80)
    );

    const unsubscribe = onSnapshot(
      sightingsQuery,
      (snapshot) => {
        const remoteSightings = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter(
            (item) =>
              item.ownerUid === user.uid ||
              item.privacy === "Public" ||
              (item.privacy === "Friends" && uniqueOwnerIds.includes(item.ownerUid))
          )
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
            return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
          });
        setSightings(remoteSightings);
        saveSightings(remoteSightings);
      },
      () => {}
    );

    return unsubscribe;
  }, [profile.friends, user]);

  const setProfile = (nextProfile) => {
    const mergedProfile = { ...nextProfile, theme };
    setProfileState(mergedProfile);
    saveProfile(mergedProfile);
    if (user) upsertUserProfile(user, mergedProfile).catch(() => {});
  };

  const setTheme = (nextTheme) => {
    setThemeState(nextTheme);
    const nextProfile = { ...profile, theme: nextTheme };
    setProfileState(nextProfile);
    saveProfile(nextProfile);
    saveTheme(nextTheme);
    if (user) upsertUserProfile(user, nextProfile).catch(() => {});
  };

  const addSighting = async (sighting) => {
    const next = [sighting, ...sightings];
    setSightings(next);
    saveSightings(next);
    if (user) {
      await setDoc(doc(firebaseDb, "sightings", sighting.id), {
        ...sighting,
        ownerUid: user.uid,
        ownerUsername: profile.username || user.displayName || user.email || "You",
        createdAt: serverTimestamp()
      });
    }
  };

  const deleteSighting = async (sighting) => {
    const next = sightings.filter((item) => item.id !== sighting.id);
    setSightings(next);
    saveSightings(next);
    if (user && sighting.ownerUid === user.uid) {
      await deleteDoc(doc(firebaseDb, "sightings", sighting.id));
    }
  };

  const clearSightings = () => {
    setSightings([]);
    saveSightings([]);
  };

  return { sightings, profile, setProfile, theme, setTheme, addSighting, deleteSighting, clearSightings };
}

function useAuthUser() {
  const [authState, setAuthState] = useState({ loading: true, user: null });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setAuthState({ loading: false, user });
    });
    return unsubscribe;
  }, []);

  return authState;
}

function usePageNavigation() {
  const [page, setPage] = useState(getPage);

  useEffect(() => {
    const onPopState = () => setPage(getPage());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState(null, "", path);
    setPage(getPage());
    window.scrollTo(0, 0);
  };

  return { page, navigate };
}

function App() {
  const { loading: authLoading, user } = useAuthUser();
  const { page, navigate } = usePageNavigation();
  const {
    sightings,
    profile,
    setProfile,
    theme,
    setTheme,
    addSighting,
    deleteSighting,
    clearSightings
  } = useAppState(user);
  const [onboardingComplete, setOnboardingComplete] = useState(() => getOnboardingComplete(user));
  const [celebration, setCelebration] = useState(null);
  const { referenceSignatures, status: referenceStatus } = useDashReferences();
  const playerXp = sightings.reduce((sum, item) => sum + item.xp, 0);
  const currentRank = getCurrentRank(playerXp);
  const nextRank = getNextRank(playerXp);
  const progress =
    nextRank.min === currentRank.min
      ? 100
      : Math.min(100, ((playerXp - currentRank.min) / (nextRank.min - currentRank.min)) * 100);

  const stats = useMemo(() => {
    const valid = sightings.filter((item) => item.valid);
    return {
      total: sightings.length,
      valid: valid.length,
      xp: playerXp,
      rate: sightings.length ? Math.round((valid.length / sightings.length) * 100) : 0,
      best: valid.reduce((best, item) => Math.max(best, item.confidence), 0)
    };
  }, [playerXp, sightings]);

  useEffect(() => {
    setOnboardingComplete(getOnboardingComplete(user));
  }, [user]);

  useEffect(() => {
    if (!celebration) return undefined;
    const timeout = window.setTimeout(() => setCelebration(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [celebration]);

  if (authLoading) {
    return null;
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!onboardingComplete) {
    return (
      <OnboardingPage
        profile={profile}
        setProfile={setProfile}
        setTheme={setTheme}
        theme={theme}
        user={user}
        onComplete={() => {
          saveOnboardingComplete(user);
          setOnboardingComplete(true);
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <CelebrationOverlay celebration={celebration} />
      <Sidebar navigate={navigate} page={page} />
      <main className="workspace">
        <Header currentRank={currentRank} navigate={navigate} playerXp={playerXp} user={user} />
        <RankStrip currentRank={currentRank} nextRank={nextRank} progress={progress} />
        <div className="page-motion" key={page}>
          {page === "hunt" && (
            <HuntPage
              addSighting={addSighting}
              onCelebrate={setCelebration}
              profile={profile}
              referenceSignatures={referenceSignatures}
              referenceStatus={referenceStatus}
              user={user}
            />
          )}
          {page === "map" && <MapPage sightings={sightings} />}
          {page === "feed" && <FeedPage deleteSighting={deleteSighting} sightings={sightings} user={user} />}
          {page === "friends" && <FriendsPage profile={profile} setProfile={setProfile} user={user} />}
          {page === "leaders" && <LeadersPage profile={profile} stats={stats} />}
          {page === "profile" && (
            <ProfilePage
              deleteSighting={deleteSighting}
              profile={profile}
              setProfile={setProfile}
              stats={stats}
              sightings={sightings}
              user={user}
            />
          )}
          {page === "settings" && (
            <SettingsPage
              clearSightings={clearSightings}
              profile={profile}
              setProfile={setProfile}
              setTheme={setTheme}
              sightings={sightings}
              theme={theme}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function CelebrationOverlay({ celebration }) {
  const pieces = useMemo(() => {
    if (!celebration) return [];
    const colors = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#0ea5e9", "#8b5cf6"];
    return Array.from({ length: 42 }, (_, index) => ({
      id: `${celebration.id}-${index}`,
      color: colors[index % colors.length],
      left: 8 + ((index * 19) % 84),
      delay: (index % 9) * 0.045,
      drift: ((index % 7) - 3) * 22,
      rotation: 140 + ((index * 31) % 260)
    }));
  }, [celebration]);

  if (!celebration) return null;

  return (
    <div className="celebration-layer" aria-live="polite" aria-atomic="true">
      <div className="confetti-burst" aria-hidden="true">
        {pieces.map((piece) => (
          <span
            key={piece.id}
            style={{
              "--confetti-color": piece.color,
              "--confetti-left": `${piece.left}%`,
              "--confetti-delay": `${piece.delay}s`,
              "--confetti-drift": `${piece.drift}px`,
              "--confetti-rotation": `${piece.rotation}deg`
            }}
          />
        ))}
      </div>
      <div className="xp-toast">
        <Sparkles size={18} />
        <div>
          <strong>Dash secured</strong>
          <span>
            +{celebration.xp} XP · {celebration.quality}
          </span>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ navigate, page }) {
  return (
    <aside className="sidebar">
      <a
        className="brand"
        href="/hunt.html"
        aria-label="Dash-Snatch home"
        onClick={(event) => {
          event.preventDefault();
          navigate("/hunt.html");
        }}
      >
        <img className="logo-mark" src="/dash-logo.png" alt="" />
        <span>Dash-Snatch</span>
      </a>
      <nav className="nav-list" aria-label="Primary navigation">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
          <a
            className={page === label.toLowerCase() ? "active" : ""}
            href={path}
            key={label}
            onClick={(event) => {
              event.preventDefault();
              navigate(path);
            }}
          >
            {React.createElement(Icon, { size: 18 })}
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}

function AuthPage() {
  const [mode, setMode] = useState("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === "signup";

  async function submitAuth(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isSignup) {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        if (displayName.trim()) {
          await updateProfile(credential.user, { displayName: displayName.trim() });
        }
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      }
    } catch (authError) {
      setError(firebaseMessage(authError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <a className="auth-brand" href="/hunt.html" aria-label="Dash-Snatch">
          <img className="logo-mark" src="/dash-logo.png" alt="" />
          <span>Dash-Snatch</span>
        </a>
        <div>
          <h1>{isSignup ? "Create your hunter account" : "Sign in to hunt"}</h1>
          <p>Sign in first, then submit verified Dash Bottenberg sightings.</p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            className={!isSignup ? "active" : ""}
            type="button"
            onClick={() => {
              setMode("signin");
              setError("");
            }}
          >
            Sign in
          </button>
          <button
            className={isSignup ? "active" : ""}
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            Sign up
          </button>
        </div>

        <form className="auth-form" onSubmit={submitAuth}>
          {isSignup && (
            <label>
              <span>Hunter name</span>
              <input
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Dash hunter"
              />
            </label>
          )}
          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              inputMode="email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label>
            <span>Password</span>
            <input
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button className="submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Working..." : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>
        <div className="auth-divider"><span>or</span></div>
        <button
          className="google-button"
          type="button"
          onClick={async () => {
            setError("");
            setIsSubmitting(true);
            try {
              await signInWithPopup(firebaseAuth, googleProvider);
            } catch (authError) {
              setError(firebaseMessage(authError));
            } finally {
              setIsSubmitting(false);
            }
          }}
          disabled={isSubmitting}
        >
          <span>G</span>
          Continue with Google
        </button>
      </section>
    </main>
  );
}

function OnboardingPage({ profile, setProfile, setTheme, theme, user, onComplete }) {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState(
    profile.username === "You" ? user.displayName || "" : profile.username
  );
  const [homeBase, setHomeBase] = useState(profile.homeBase);
  const [privateByDefault, setPrivateByDefault] = useState(profile.privateByDefault);
  const [friendQuery, setFriendQuery] = useState("");
  const [friends, setFriends] = useState(profile.friends ?? []);

  function addFriend() {
    const friend = friendQuery.trim();
    if (!friend || friends.includes(friend)) return;
    setFriends([...friends, friend]);
    setFriendQuery("");
  }

  function finishOnboarding(event) {
    event.preventDefault();
    setProfile({
      ...profile,
      username: username.trim() || user.displayName || "You",
      homeBase,
      privateByDefault,
      theme,
      friends
    });
    onComplete();
  }

  const steps = [
    "About",
    "Capture",
    "Friends",
    "Settings"
  ];

  return (
    <main className="auth-shell">
      <section className="onboarding-card">
        <div className="onboarding-hero">
          <img className="auth-logo" src="/dash-logo.png" alt="" />
          <div>
            <h1>{steps[step]} setup</h1>
            <p>Learn the hunt, connect your crew, and tune your console.</p>
          </div>
        </div>
        <div className="onboarding-steps" aria-label="Onboarding progress">
          {steps.map((label, index) => (
            <button
              className={index === step ? "active" : ""}
              key={label}
              type="button"
              onClick={() => setStep(index)}
            >
              {label}
            </button>
          ))}
        </div>
        <form className="auth-form" onSubmit={finishOnboarding}>
          {step === 0 && (
            <div className="onboarding-panel">
              <div className="feature-list">
                <article>
                  <MapPinned size={22} />
                  <strong>What Dash-Snatch is</strong>
                  <p>Dash-Snatch is a location photo hunt. You spot Dash Bottenberg, prove it with a photo, and place that verified sighting on your map.</p>
                </article>
                <article>
                  <Trophy size={22} />
                  <strong>How you score</strong>
                  <p>Only photos that match Dash earn XP. Better matches unlock higher proof ranks and move you up the leaderboard.</p>
                </article>
                <article>
                  <ShieldCheck size={22} />
                  <strong>Why validation matters</strong>
                  <p>The app compares uploads against the Dash reference images before a sighting can be submitted.</p>
                </article>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="onboarding-panel">
              <div className="capture-guide">
                <div>
                  <Camera size={28} />
                  <strong>Capture him clearly</strong>
                  <p>Use Hunt, upload or take a photo, then allow location. A clear face/body shot in good light has the best chance to pass.</p>
                </div>
                <ol>
                  <li>Open Hunt and choose Capture.</li>
                  <li>Upload a photo where Dash is visible.</li>
                  <li>Tap Location so the map pin is real.</li>
                  <li>Submit only after it says Dash match.</li>
                </ol>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-panel">
              <label>
                <span>Find friends you know</span>
                <div className="friend-entry">
                  <input
                    value={friendQuery}
                    onChange={(event) => setFriendQuery(event.target.value)}
                    placeholder="Enter a friend's username or email"
                  />
                  <button type="button" onClick={addFriend}>
                    Add
                  </button>
                </div>
              </label>
              <div className="friend-chips">
                {friends.length ? (
                  friends.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setFriends(friends.filter((friend) => friend !== name))}
                    >
                      {name} x
                    </button>
                  ))
                ) : (
                  <p>No friends added yet. Add people you actually know by username or email.</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-panel">
              <label>
                <span>Hunter name</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Your display name"
                />
              </label>
              <label>
                <span>Home base</span>
                <input
                  value={homeBase}
                  onChange={(event) => setHomeBase(event.target.value)}
                  placeholder="City or neighborhood"
                />
              </label>
              <label className="toggle-row onboarding-toggle">
                <span>
                  <strong>Private sightings by default</strong>
                  <small>You can still change privacy on each upload.</small>
                </span>
                <input
                  checked={privateByDefault}
                  type="checkbox"
                  onChange={(event) => setPrivateByDefault(event.target.checked)}
                />
              </label>
              <ThemePicker theme={theme} setTheme={setTheme} />
            </div>
          )}

          <div className="onboarding-actions">
            <button
              className="ghost-button"
              type="button"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
            >
              Back
            </button>
            {step < steps.length - 1 ? (
              <button className="submit-button" type="button" onClick={() => setStep(step + 1)}>
                Next
              </button>
            ) : (
              <button className="submit-button" type="submit">
                Start hunting
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}

function ThemePicker({ theme, setTheme }) {
  return (
    <div className="theme-picker">
      <span className="field-label">Theme</span>
      <div className="theme-grid">
        {THEMES.map((item) => (
          <button
            className={theme === item.id ? "theme-option active" : "theme-option"}
            key={item.id}
            type="button"
            onClick={() => setTheme(item.id)}
          >
            <span className={`theme-swatch ${item.id}`} />
            <strong>{item.label}</strong>
            <small>{item.description}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function Header({ currentRank, navigate, playerXp, user }) {
  return (
    <header className="topbar">
      <div>
        <h1>Dash hunt console</h1>
        <p>Capture, validate, and map verified Dash Bottenberg sightings.</p>
      </div>
      <div className="top-actions">
        <label className="search">
          <Search size={17} />
          <input placeholder="Search your sightings" />
        </label>
        <a
          className="rank-chip"
          href="/profile.html"
          onClick={(event) => {
            event.preventDefault();
            navigate("/profile.html");
          }}
          style={{ "--rank": currentRank.color }}
        >
          <Medal size={18} />
          <span>{currentRank.name}</span>
          <strong>{playerXp} XP</strong>
        </a>
        <a
          className="primary-button"
          href="/hunt.html"
          onClick={(event) => {
            event.preventDefault();
            navigate("/hunt.html");
          }}
        >
          <Camera size={18} />
          Capture
        </a>
        <button className="logout-button" type="button" onClick={() => signOut(firebaseAuth)}>
          {user.displayName || "Sign out"}
        </button>
      </div>
    </header>
  );
}

function RankStrip({ currentRank, nextRank, progress }) {
  return (
    <section className="rank-strip" aria-label="Rank progress">
      <div>
        <span>Current rank</span>
        <strong>{currentRank.name}</strong>
      </div>
      <div className="progress-track">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div>
        <span>Next unlock</span>
        <strong>{nextRank.name}</strong>
      </div>
    </section>
  );
}

function HuntPage({ addSighting, onCelebrate, profile, referenceSignatures, referenceStatus, user }) {
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [privacy, setPrivacy] = useState(profile.privateByDefault ? "Private" : "Public");
  const [locationName, setLocationName] = useState("No GPS fix");
  const [coords, setCoords] = useState(null);
  const [validation, setValidation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  async function onPhoto(file) {
    if (!file) return;
    setIsChecking(true);
    setValidation(null);
    const originalDataUrl = await fileToDataUrl(file);
    const dataUrl = await resizeImageDataUrl(originalDataUrl);
    setPhotoPreview(dataUrl);
    setPhotoName(file.name);

    try {
      const signature = await imageSignature(originalDataUrl);
      const match = referenceSignatures.length
        ? Math.max(...referenceSignatures.map((reference) => similarity(signature, reference)))
        : 0;
      const confidence = Number(match.toFixed(3));
      const isReferenceImage = confidence >= 0.995;
      const valid = confidence >= 0.72 && !isReferenceImage;
      const quality = getQualityByConfidence(confidence);
      setValidation({
        valid,
        confidence,
        quality: isReferenceImage ? "Reference image" : valid ? quality.name : "No match",
        xp: valid ? quality.xp : 0,
        isReferenceImage
      });
    } catch {
      setValidation({
        valid: false,
        confidence: 0,
        quality: "No match",
        xp: 0
      });
    } finally {
      setIsChecking(false);
    }
  }

  function useLocation() {
    if (!navigator.geolocation) {
      setLocationName("GPS unavailable");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setIsLocating(false);
      },
      () => {
        setLocationName("GPS permission needed");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function submitSighting() {
    if (!validation?.valid || !photoPreview || !coords) return;
    const localId = crypto.randomUUID();
    await addSighting({
      id: localId,
      user: profile.username || "You",
      ownerUid: user.uid,
      ownerUsername: profile.username || user.displayName || user.email || "You",
      title: photoName.replace(/\.[^.]+$/, "") || "Dash sighting",
      locationName,
      lat: coords.lat,
      lng: coords.lng,
      quality: validation.quality,
      xp: validation.xp,
      confidence: validation.confidence,
      privacy,
      image: photoPreview,
      valid: true,
      createdAt: new Date().toISOString()
    });
    onCelebrate({
      id: localId,
      xp: validation.xp,
      quality: validation.quality
    });
    setPhotoPreview("");
    setPhotoName("");
    setValidation(null);
  }

  return (
    <div className="page-grid hunt-grid">
      <section className="panel capture-panel">
        <div className="panel-header">
          <div>
            <h2>Submit sighting</h2>
            <p>Dash Bottenberg is the bounty. Capture a real verified sighting to earn XP.</p>
          </div>
          <ShieldCheck size={24} />
        </div>

        <label className={`drop-zone ${photoPreview ? "has-photo" : ""}`} htmlFor="photo-upload">
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => onPhoto(event.target.files?.[0])}
            disabled={referenceStatus !== "ready"}
          />
          {photoPreview ? (
            <img src={photoPreview} alt="Uploaded Dash sighting candidate" />
          ) : (
            <span>
              <ImagePlus size={36} />
              <strong>Drop or capture photo</strong>
              <small>
                {referenceStatus === "ready" ? "Compared against Dash references" : "Loading references"}
              </small>
            </span>
          )}
        </label>

        <div className="field-grid">
          <label>
            <span>Location</span>
            <button className="input-button" type="button" onClick={useLocation}>
              <LocateFixed size={16} />
              {isLocating ? "Locating..." : locationName}
            </button>
          </label>
          <label>
            <span>Privacy</span>
            <select value={privacy} onChange={(event) => setPrivacy(event.target.value)}>
              <option>Public</option>
              <option>Friends</option>
              <option>Private</option>
            </select>
          </label>
        </div>

        <ValidationCard validation={validation} isChecking={isChecking} />

        <button
          className={`submit-button ${validation?.valid && photoPreview && coords ? "ready-submit" : ""}`}
          type="button"
          disabled={!validation?.valid || !photoPreview || !coords}
          onClick={submitSighting}
        >
          <Upload size={18} />
          Submit sighting
        </button>
      </section>

      <section className="panel reference-panel">
        <div className="panel-header">
          <div>
            <h2>Dash references</h2>
            <p>These are the only built-in images used by the matcher.</p>
          </div>
          <Sparkles size={22} />
        </div>
        <div className="reference-grid">
          {DASH_REFERENCES.map((src, index) => (
            <img src={src} alt={`Dash Bottenberg reference ${index + 1}`} key={src} />
          ))}
        </div>
        <p className="fine-print">
          Dash Bottenberg is the bounty. These reference photos help confirm that a capture is really him.
        </p>
      </section>
    </div>
  );
}

function ValidationCard({ validation, isChecking }) {
  if (isChecking) {
    return (
      <div className="validation empty">
        <Radio size={20} />
        <div>
          <strong>Checking Dash match</strong>
          <span>Comparing upload with the three reference photos.</span>
        </div>
      </div>
    );
  }

  if (!validation) {
    return (
      <div className="validation empty">
        <Radio size={20} />
        <div>
          <strong>Awaiting image</strong>
          <span>Upload a photo and allow GPS before submitting.</span>
        </div>
      </div>
    );
  }

  const Icon = validation.valid ? CheckCircle2 : XCircle;
  const title = validation.isReferenceImage
    ? "Reference images do not earn XP"
    : validation.valid
      ? `${validation.quality} Dash match`
      : "Not Dash Bottenberg";
  const detail = validation.isReferenceImage
    ? "Use a real sighting photo, not one of the test/reference images."
    : `${Math.round(validation.confidence * 100)}% reference similarity · ${validation.xp} XP`;
  return (
    <div className={`validation ${validation.valid ? "valid" : "invalid"}`}>
      <Icon size={22} />
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      {validation.valid && (
        <div className="validation-sparkles" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      )}
    </div>
  );
}

function MapPage({ sightings }) {
  return (
    <section className="panel full-panel">
      <div className="panel-header map-title">
        <div>
          <h2>Verified sightings map</h2>
          <p>Only your validated submissions appear here.</p>
        </div>
        <div className="map-tools">
          <span className="status-pill">{sightings.length} sightings</span>
        </div>
      </div>
      <div className="large-map-stage">
        <LeafletSightingsMap sightings={sightings} />
      </div>
    </section>
  );
}

function LeafletSightingsMap({ sightings }) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const layerGroup = useRef(null);

  useEffect(() => {
    if (!mapElement.current || mapInstance.current) return;
    const map = L.map(mapElement.current, {
      zoomControl: true,
      attributionControl: true
    }).setView([37.789, -122.407], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
    layerGroup.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    const group = layerGroup.current;
    if (!map || !group) return;
    group.clearLayers();

    if (!sightings.length) {
      map.setView([37.789, -122.407], 11);
      return;
    }

    const bounds = [];
    sightings.forEach((sighting) => {
      const color = qualityMeta(sighting.quality).color;
      const marker = L.circleMarker([sighting.lat, sighting.lng], {
        radius: 10,
        color: "#ffffff",
        weight: 3,
        fillColor: color,
        fillOpacity: 0.95
      }).bindPopup(
        `<strong>${sighting.title}</strong><br />${sighting.locationName}<br />${Math.round(
          sighting.confidence * 100
        )}% Dash match`
      );
      marker.addTo(group);
      bounds.push([sighting.lat, sighting.lng]);
    });

    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [sightings]);

  return (
    <div className="leaflet-shell">
      <div ref={mapElement} className="leaflet-map" aria-label="Interactive sightings map" />
      {!sightings.length && (
        <div className="map-empty">
          <MapPinned size={28} />
          <strong>No verified sightings yet</strong>
          <span>Submit a Dash match from Hunt to place the first pin.</span>
        </div>
      )}
    </div>
  );
}

function FeedPage({ deleteSighting, sightings, user }) {
  return (
    <section className="panel full-panel">
      <div className="panel-header">
        <div>
          <h2>Proof feed</h2>
          <p>No sample posts. This feed is built only from verified uploads.</p>
        </div>
        <Radio size={22} />
      </div>
      {sightings.length ? (
        <div className="photo-feed expanded-feed">
          {sightings.map((item) => (
            <article className="photo-card" key={item.id}>
              <img src={item.image} alt="" />
              <span style={{ backgroundColor: qualityMeta(item.quality).color }}>{item.quality}</span>
              <strong>{item.title}</strong>
              <small>
                {item.ownerUsername || item.user} · {item.locationName} · {timeAgo(item.createdAt)}
              </small>
              {item.ownerUid === user.uid && (
                <button className="delete-upload" type="button" onClick={() => deleteSighting(item)}>
                  Remove upload
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Camera}
          title="No proof yet"
          body="Validated Dash photos will appear here after submission."
          href="/hunt.html"
          action="Capture a sighting"
        />
      )}
    </section>
  );
}

function FriendsPage({ profile, setProfile, user }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const friends = profile.friends ?? [];

  async function searchFriends(event) {
    event.preventDefault();
    const term = normalizeSearch(searchTerm);
    if (!term) return;
    setIsSearching(true);
    setSearchError("");

    try {
      const usersRef = collection(firebaseDb, "users");
      const [emailMatches, usernameMatches] = await Promise.all([
        getDocs(query(usersRef, where("emailLower", "==", term), limit(8))),
        getDocs(
          query(
            usersRef,
            where("usernameLower", ">=", term),
            where("usernameLower", "<=", `${term}\uf8ff`),
            limit(8)
          )
        )
      ]);
      const existing = new Set(friends.map(friendKey));
      const merged = [...emailMatches.docs, ...usernameMatches.docs]
        .map((item) => ({ uid: item.id, ...item.data() }))
        .filter((item, index, items) => item.uid !== user.uid && !existing.has(item.uid) && items.findIndex((candidate) => candidate.uid === item.uid) === index);
      setResults(merged);
      if (!merged.length) setSearchError("No matching Dash-Snatch accounts found.");
    } catch {
      setSearchError("Friend search needs Firestore enabled and readable user profiles.");
    } finally {
      setIsSearching(false);
    }
  }

  function addFriend(friend) {
    if (friends.some((item) => friendKey(item) === friend.uid)) return;
    setProfile({
      ...profile,
      friends: [
        ...friends,
        {
          uid: friend.uid,
          username: friend.username || friend.email || "Friend",
          email: friend.email || ""
        }
      ]
    });
    setResults(results.filter((item) => item.uid !== friend.uid));
  }

  function removeFriend(friend) {
    setProfile({ ...profile, friends: friends.filter((item) => friendKey(item) !== friendKey(friend)) });
  }

  return (
    <section className="panel full-panel">
      <div className="panel-header">
        <div>
          <h2>Friends</h2>
          <p>Add real people you know by username or email. They will appear on your leaderboard.</p>
        </div>
        <UserPlus size={22} />
      </div>
      <form className="friend-page-form" onSubmit={searchFriends}>
        <label>
          <span>Friend username or email</span>
          <div className="friend-entry">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search a username or email"
            />
            <button type="submit">{isSearching ? "..." : "Search"}</button>
          </div>
        </label>
      </form>
      {searchError && <div className="auth-error">{searchError}</div>}
      {results.length > 0 && (
        <div className="friends-list search-results">
          {results.map((friend) => (
            <div className="friend-row" key={friend.uid}>
              <Users size={18} />
              <strong>{friend.username || friend.email}</strong>
              <small>{friend.email}</small>
              <button type="button" onClick={() => addFriend(friend)}>
                Add
              </button>
            </div>
          ))}
        </div>
      )}
      {friends.length ? (
        <div className="friends-list">
          {friends.map((friend) => (
            <div className="friend-row" key={friendKey(friend)}>
              <Users size={18} />
              <strong>{friendName(friend)}</strong>
              <small>{typeof friend === "string" ? "Added locally" : friend.email}</small>
              <button type="button" onClick={() => removeFriend(friend)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No friends added"
          body="Add people you know by username or email. Real account search can be connected once user profiles are stored in Firestore."
          href="/friends.html"
          action="Friends"
        />
      )}
    </section>
  );
}

function LeadersPage({ profile, stats }) {
  const rows = [
    {
      name: profile.username || "You",
      xp: stats.xp,
      detail: `${stats.valid} valid`
    },
    ...(profile.friends ?? []).map((friend) => ({
      name: friendName(friend),
      xp: 0,
      detail: "friend"
    }))
  ];

  return (
    <section className="panel full-panel">
      <div className="panel-header">
        <div>
          <h2>Leaderboard</h2>
          <p>Your leaderboard uses your account and the real friends you added.</p>
        </div>
        <Users size={22} />
      </div>
      <div className="leaderboard-list">
        {rows.map((row, index) => (
          <div className="leaderboard-single" key={`${row.name}-${index}`}>
            <span>{index + 1}</span>
            <strong>{row.name}</strong>
            <small>{row.xp} XP</small>
            <em>{row.detail}</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfilePage({ deleteSighting, profile, setProfile, stats, sightings, user }) {
  return (
    <div className="page-grid profile-grid">
      <section className="panel stats-panel">
        <div className="panel-header">
          <h2>Hunter profile</h2>
          <Award size={22} />
        </div>
        <div className="profile-form">
          <label>
            <span>Username</span>
            <input
              value={profile.username}
              onChange={(event) => setProfile({ ...profile, username: event.target.value })}
            />
          </label>
          <label>
            <span>Home base</span>
            <input
              value={profile.homeBase}
              placeholder="Optional"
              onChange={(event) => setProfile({ ...profile, homeBase: event.target.value })}
            />
          </label>
        </div>
      </section>
      <section className="panel stats-panel">
        <div className="panel-header">
          <h2>Your stats</h2>
          <Medal size={22} />
        </div>
        <div className="stats-grid">
          <Stat label="Total XP" value={stats.xp} />
          <Stat label="Sightings" value={stats.total} />
          <Stat label="Valid rate" value={`${stats.rate}%`} />
          <Stat label="Best match" value={`${Math.round(stats.best * 100)}%`} />
        </div>
      </section>
      <section className="panel full-width">
        <div className="panel-header">
          <h2>Recent submissions</h2>
          <Star size={22} />
        </div>
        {sightings.filter((item) => item.ownerUid === user.uid).length ? (
          sightings.filter((item) => item.ownerUid === user.uid).slice(0, 5).map((item) => (
            <div className="submission-row" key={item.id}>
              <img src={item.image} alt="" />
              <strong>{item.title}</strong>
              <span>{item.quality}</span>
              <small>{timeAgo(item.createdAt)}</small>
              <button type="button" onClick={() => deleteSighting(item)}>
                Remove
              </button>
            </div>
          ))
        ) : (
          <p className="fine-print">No submissions yet.</p>
        )}
      </section>
    </div>
  );
}

function SettingsPage({ clearSightings, profile, setProfile, setTheme, sightings, theme }) {
  return (
    <section className="panel full-panel">
      <div className="panel-header">
        <div>
          <h2>Settings</h2>
          <p>Control local storage and default privacy.</p>
        </div>
        <Settings size={22} />
      </div>
      <div className="settings-list">
        <ThemePicker theme={theme} setTheme={setTheme} />
        <label className="toggle-row">
          <span>
            <strong>Private by default</strong>
            <small>New submissions start as private until changed.</small>
          </span>
          <input
            type="checkbox"
            checked={profile.privateByDefault}
            onChange={(event) => setProfile({ ...profile, privateByDefault: event.target.checked })}
          />
        </label>
        <div className="danger-zone">
          <div>
            <strong>Clear local sightings</strong>
            <small>Deletes {sightings.length} locally stored submissions from this browser.</small>
          </div>
          <button type="button" onClick={clearSightings} disabled={!sightings.length}>
            Clear
          </button>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState({ icon: Icon, title, body, href, action }) {
  return (
    <div className="empty-state">
      {React.createElement(Icon, { size: 34 })}
      <strong>{title}</strong>
      <p>{body}</p>
      <a className="primary-button" href={href}>{action}</a>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
