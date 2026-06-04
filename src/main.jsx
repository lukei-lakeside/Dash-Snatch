import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Award,
  Camera,
  CheckCircle2,
  Compass,
  Crosshair,
  Flame,
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
  UserRound,
  Users,
  XCircle
} from "lucide-react";
import "./styles.css";

const STORAGE_KEY = "dash-snatch-real-sightings";
const PROFILE_KEY = "dash-snatch-profile";

const DASH_REFERENCES = [
  "/dash-references/dash-1.png",
  "/dash-references/dash-2.png",
  "/dash-references/dash-3.png"
];

const NAV_ITEMS = [
  { label: "Hunt", path: "/hunt.html", icon: Crosshair },
  { label: "Map", path: "/map.html", icon: MapPinned },
  { label: "Feed", path: "/feed.html", icon: Radio },
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
  privateByDefault: false
};

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

function similarity(a, b) {
  const histogram = a.bins.reduce((sum, value, index) => sum + value * b.bins[index], 0);
  const brightness = 1 - Math.min(1, Math.abs(a.brightness - b.brightness));
  const contrast = 1 - Math.min(1, Math.abs(a.contrast - b.contrast));
  const dark = 1 - Math.min(1, Math.abs(a.darkRatio - b.darkRatio));
  return histogram * 0.7 + brightness * 0.12 + contrast * 0.08 + dark * 0.1;
}

function timeAgo(iso) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
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

function useAppState() {
  const [sightings, setSightings] = useState(getStoredSightings);
  const [profile, setProfileState] = useState(getStoredProfile);

  const setProfile = (nextProfile) => {
    setProfileState(nextProfile);
    saveProfile(nextProfile);
  };

  const addSighting = (sighting) => {
    const next = [sighting, ...sightings];
    setSightings(next);
    saveSightings(next);
  };

  const clearSightings = () => {
    setSightings([]);
    saveSightings([]);
  };

  return { sightings, profile, setProfile, addSighting, clearSightings };
}

function App() {
  const page = getPage();
  const { sightings, profile, setProfile, addSighting, clearSightings } = useAppState();
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

  return (
    <div className="app-shell">
      <Sidebar page={page} />
      <main className="workspace">
        <Header currentRank={currentRank} playerXp={playerXp} />
        <RankStrip currentRank={currentRank} nextRank={nextRank} progress={progress} />
        {page === "hunt" && (
          <HuntPage
            addSighting={addSighting}
            profile={profile}
            referenceSignatures={referenceSignatures}
            referenceStatus={referenceStatus}
          />
        )}
        {page === "map" && <MapPage sightings={sightings} />}
        {page === "feed" && <FeedPage sightings={sightings} />}
        {page === "leaders" && <LeadersPage profile={profile} stats={stats} />}
        {page === "profile" && (
          <ProfilePage profile={profile} setProfile={setProfile} stats={stats} sightings={sightings} />
        )}
        {page === "settings" && (
          <SettingsPage
            clearSightings={clearSightings}
            profile={profile}
            setProfile={setProfile}
            sightings={sightings}
          />
        )}
      </main>
    </div>
  );
}

function Sidebar({ page }) {
  return (
    <aside className="sidebar">
      <a className="brand" href="/hunt.html" aria-label="Dash-Snatch home">
        <span className="brand-mark">DS</span>
        <span>Dash-Snatch</span>
      </a>
      <nav className="nav-list" aria-label="Primary navigation">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
          <a className={page === label.toLowerCase() ? "active" : ""} href={path} key={label}>
            {React.createElement(Icon, { size: 18 })}
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}

function Header({ currentRank, playerXp }) {
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
        <a className="rank-chip" href="/profile.html" style={{ "--rank": currentRank.color }}>
          <Medal size={18} />
          <span>{currentRank.name}</span>
          <strong>{playerXp} XP</strong>
        </a>
        <a className="primary-button" href="/hunt.html">
          <Camera size={18} />
          Capture
        </a>
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

function HuntPage({ addSighting, profile, referenceSignatures, referenceStatus }) {
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
    const dataUrl = await fileToDataUrl(file);
    setPhotoPreview(dataUrl);
    setPhotoName(file.name);

    try {
      const signature = await imageSignature(dataUrl);
      const match = referenceSignatures.length
        ? Math.max(...referenceSignatures.map((reference) => similarity(signature, reference)))
        : 0;
      const confidence = Number(match.toFixed(3));
      const valid = confidence >= 0.72;
      const quality = getQualityByConfidence(confidence);
      setValidation({
        valid,
        confidence,
        quality: valid ? quality.name : "No match",
        xp: valid ? quality.xp : 0
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

  function submitSighting() {
    if (!validation?.valid || !photoPreview || !coords) return;
    addSighting({
      id: crypto.randomUUID(),
      user: profile.username || "You",
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
            <p>Only photos matching the Dash references can earn XP.</p>
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
          className="submit-button"
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
          MVP validation compares image fingerprints locally. Production should replace this with a trained
          face/person recognition service and manual review.
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
  return (
    <div className={`validation ${validation.valid ? "valid" : "invalid"}`}>
      <Icon size={22} />
      <div>
        <strong>{validation.valid ? `${validation.quality} Dash match` : "Not Dash Bottenberg"}</strong>
        <span>{Math.round(validation.confidence * 100)}% reference similarity · {validation.xp} XP</span>
      </div>
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

function FeedPage({ sightings }) {
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
              <small>{item.locationName} · {timeAgo(item.createdAt)}</small>
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

function LeadersPage({ profile, stats }) {
  return (
    <section className="panel full-panel">
      <div className="panel-header">
        <div>
          <h2>Leaderboard</h2>
          <p>Fake competitors removed. Add friends later when accounts exist.</p>
        </div>
        <Users size={22} />
      </div>
      <div className="leaderboard-single">
        <span>1</span>
        <strong>{profile.username || "You"}</strong>
        <small>{stats.xp} XP</small>
        <em>{stats.valid} valid</em>
      </div>
    </section>
  );
}

function ProfilePage({ profile, setProfile, stats, sightings }) {
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
        {sightings.length ? (
          sightings.slice(0, 5).map((item) => (
            <div className="submission-row" key={item.id}>
              <img src={item.image} alt="" />
              <strong>{item.title}</strong>
              <span>{item.quality}</span>
              <small>{timeAgo(item.createdAt)}</small>
            </div>
          ))
        ) : (
          <p className="fine-print">No submissions yet.</p>
        )}
      </section>
    </div>
  );
}

function SettingsPage({ clearSightings, profile, setProfile, sightings }) {
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
