# Dash-Snatch UI/UX Design System

## Design Philosophy

Dash-Snatch is a modern, engaging location-based game that requires a clean, intuitive UI with strong visual hierarchy. The design system emphasizes:

- **Clarity:** Users must easily understand what to do and where to go
- **Engagement:** Gamification elements (XP, ranks, badges) are prominently displayed
- **Performance:** Fast, responsive interactions
- **Accessibility:** WCAG 2.1 AA compliance
- **Brand Consistency:** Cohesive visual language across all screens

---

## Color Palette

### Primary Colors
```
Primary: #6366F1 (Indigo)
- Primary-Dark: #4F46E5
- Primary-Light: #818CF8
- Primary-Lighter: #C7D2FE

Secondary: #EC4899 (Pink)
- Secondary-Dark: #DB2777
- Secondary-Light: #F472B6
- Secondary-Lighter: #FBCFE8

Accent: #F59E0B (Amber)
- Accent-Dark: #D97706
- Accent-Light: #FBBF24
```

### Semantic Colors
```
Success: #10B981 (Green) - Valid photos, achievements
Warning: #F59E0B (Amber) - Caution, pending actions
Danger: #EF4444 (Red) - Errors, invalid content
Info: #3B82F6 (Blue) - Information, tips

White: #FFFFFF
Black: #000000
Gray-50: #F9FAFB
Gray-100: #F3F4F6
Gray-200: #E5E7EB
Gray-300: #D1D5DB
Gray-400: #9CA3AF
Gray-500: #6B7280
Gray-600: #4B5563
Gray-700: #374151
Gray-800: #1F2937
Gray-900: #111827
```

### Gradient Backgrounds
```
Hero Gradient: Linear (#6366F1 → #EC4899)
Success Gradient: Linear (#10B981 → #34D399)
XP Gradient: Linear (#F59E0B → #EC4899)
```

---

## Typography

### Font Families
```
Headings: Poppins (Bold, SemiBold)
Body: Inter (Regular, Medium, SemiBold)
Monospace: JetBrains Mono (for stats/numbers)
```

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 32px | Bold | 40px | Main headers, hero text |
| Heading 1 | 28px | Bold | 36px | Screen titles |
| Heading 2 | 24px | SemiBold | 32px | Section headers |
| Heading 3 | 20px | SemiBold | 28px | Subsection headers |
| Subtitle | 18px | SemiBold | 26px | Card titles, emphasis |
| Body Large | 16px | Regular | 24px | Main body text, descriptions |
| Body | 14px | Regular | 22px | Secondary body text |
| Caption | 12px | Regular | 18px | Labels, helper text |
| Overline | 11px | SemiBold | 16px | Tags, badges, stats labels |

---

## Spacing System

```
0 (None): 0px
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
4xl: 80px
```

### Padding Conventions
```
Buttons: 12px (vertical) × 16px (horizontal)
Cards: 16px (all sides)
Screens: 16px (left/right), 24px (top/bottom)
Inputs: 12px (vertical) × 14px (horizontal)
```

---

## Shadows & Elevation

```
Elevation 0: none (flat)
Elevation 1: 0 1px 2px rgba(0,0,0,0.05)
Elevation 2: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
Elevation 3: 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)
Elevation 4: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)
Elevation 5: 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)
```

---

## Border Radius

```
none: 0px (sharp corners)
sm: 4px (subtle rounding)
md: 8px (default)
lg: 12px (prominent)
xl: 16px (large)
full: 9999px (pills, circles)
```

---

## Component Library

### 1. Button Component

**Variants:**
- **Primary:** Full colored, main actions
- **Secondary:** Outlined, alternative actions
- **Ghost:** Text only, least prominent
- **Danger:** Red, destructive actions

**Sizes:**
- **Small:** 32px height, 12px padding vertical
- **Medium:** 44px height, 16px padding vertical (default)
- **Large:** 56px height, 20px padding vertical

**States:**
- Default
- Hover (10% darker)
- Active (20% darker)
- Disabled (60% opacity)
- Loading (spinner, disabled)

```typescript
<Button
  variant="primary" | "secondary" | "ghost" | "danger"
  size="small" | "medium" | "large"
  disabled={false}
  loading={false}
  onPress={() => {}}
  icon={<Icon />}
  iconPosition="left" | "right"
>
  Button Text
</Button>
```

**Usage Examples:**
```
Primary: Main actions (Login, Upload, Share)
Secondary: Alternative actions (Cancel, Skip)
Ghost: Low priority (More info, Help)
Danger: Destructive (Delete, Logout)
```

---

### 2. Input Field Component

**Variants:**
- **Text:** Standard text input
- **Email:** Email validation
- **Password:** Masked input with toggle
- **Number:** Numeric input only

**Features:**
- Placeholder text
- Helper text (gray, 12px)
- Error state with red border and error message
- Character counter (if needed)
- Leading icon
- Trailing icon (visibility toggle, clear button)
- Label above input
- Focus state (blue border, shadow)

```typescript
<Input
  label="Email Address"
  placeholder="you@example.com"
  value={email}
  onChangeText={(text) => setEmail(text)}
  type="email"
  error={emailError}
  helperText="We'll never share your email"
  icon={<EmailIcon />}
  disabled={false}
  required={true}
/>
```

**States:**
- Default (gray border)
- Focus (blue border, shadow)
- Filled
- Error (red border)
- Disabled (gray background, 60% opacity)

---

### 3. Card Component

**Structure:**
```
┌─────────────────┐
│   Card Image    │ (Optional)
├─────────────────┤
│  Card Title     │
│ Card Subtitle   │
├─────────────────┤
│  Card Content   │
├─────────────────┤
│ Action Buttons  │ (Optional)
└─────────────────┘
```

```typescript
<Card
  variant="elevated" | "outlined"
  onPress={() => {}}
  disabled={false}
>
  <Card.Image source={{ uri: imageUrl }} />
  <Card.Title>Card Title</Card.Title>
  <Card.Subtitle>Optional subtitle</Card.Subtitle>
  <Card.Content>
    Card content goes here
  </Card.Content>
  <Card.Actions>
    <Button>Action 1</Button>
    <Button>Action 2</Button>
  </Card.Actions>
</Card>
```

**Variants:**
- **Elevated:** 4px shadow, light background
- **Outlined:** 1px border, transparent background

---

### 4. Badge Component

**Variants:**
- **Success:** Green background, white text
- **Warning:** Amber background, white text
- **Danger:** Red background, white text
- **Info:** Blue background, white text
- **Default:** Gray background, dark text

```typescript
<Badge
  variant="success" | "warning" | "danger" | "info" | "default"
  size="small" | "medium"
  icon={<Icon />}
>
  Badge Text
</Badge>
```

**Usage:**
```
Status indicators
Achievement unlocked
Rank badges
Photo quality labels
```

---

### 5. Tab Navigation

**Structure:**
```
┌─────────────────────────────────────┐
│ Tab 1  │  Tab 2  │  Tab 3  │ Tab 4  │
└─────────────────────────────────────┘
   ▔▔▔    (underline on active)
```

```typescript
<TabNavigator
  tabs={[
    { label: 'Leaderboard', icon: <TrophyIcon /> },
    { label: 'Locations', icon: <MapIcon /> },
    { label: 'Profile', icon: <UserIcon /> }
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

**Features:**
- Icon + label
- Scrollable for many tabs
- Active indicator (colored underline)
- Smooth transition

---

### 6. Photo Rank Badge

**Displays:**
```
Common      - Gray background, 10 XP
Uncommon    - Green background, 25 XP
Rare        - Blue background, 50 XP
Epic        - Purple background, 100 XP
Legendary   - Gold/Orange, 250 XP + star icon
```

```typescript
<RankBadge
  rank="common" | "uncommon" | "rare" | "epic" | "legendary"
  xpReward={25}
  size="small" | "medium" | "large"
/>
```

---

### 7. XP Progress Bar

**Visual:**
```
┌────────────────────────────────────┐
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ 750 / 1000 XP to Rank 5            │
└────────────────────────────────────┘
```

```typescript
<XPProgressBar
  currentXP={750}
  requiredXP={1000}
  rankName="Hunter"
  nextRankName="Master Hunter"
/>
```

---

### 8. Location Pin Component

**Map Marker:**
```
    ┏━━━┓
    ┃ A ┃  (Letter indicator)
    ┗━━━┛
      │
      ▼ (Pin point)
```

**Info Window (on tap):**
```
┌──────────────────┐
│ Location Name    │
│ 45 photos        │
│ Last: 2h ago     │
└──────────────────┘
```

```typescript
<LocationPin
  location={location}
  photoCount={45}
  isActive={true}
  onPress={() => {}}
/>
```

---

### 9. Achievement Lock/Unlock

**Locked State:**
```
     🔒
  [Achievement]
    Locked
   (description)
```

**Unlocked State:**
```
     ⭐
  [Achievement]
    Unlocked!
  (unlock date)
```

```typescript
<Achievement
  icon={AchievementIcon}
  title="Photo Master"
  description="Take 100 valid photos"
  unlocked={false}
  unlockedDate="2026-06-15"
/>
```

---

## Screen Designs

### 1. Login Screen

```
┌─────────────────────────┐
│                         │
│    Dash Snatch Logo     │  (Icon + Text, centered)
│      (120×120px)        │
│                         │
│  "Hunt. Capture. Rank." │  (Tagline, centered, gray)
│                         │
├─────────────────────────┤
│                         │
│  ┌───────────────────┐  │
│  │ Email Input       │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ Password Input    │  │
│  │ (eye icon)        │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  LOGIN (Primary)  │  │
│  └───────────────────┘  │
│                         │
│  Don't have account?    │  (Gray text)
│  Create one            │  (Blue link)
│                         │
└─────────────────────────┘
```

**Components:**
- Logo/branding at top
- Email input with validation
- Password input with visibility toggle
- Login button (full width, primary)
- Sign-up link at bottom

**States:**
- Default (empty)
- Focused (input focused)
- Loading (button shows spinner)
- Error (red error message below inputs)

---

### 2. Register Screen

```
┌─────────────────────────┐
│ < Back                  │  (Header)
│ Create Account          │
├─────────────────────────┤
│                         │
│  ┌───────────────────┐  │
│  │ Email Input       │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ Username Input    │  │
│  │ @dashunter23      │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ Password Input    │  │
│  │ (strength bar)    │  │
│  └───────────────────┘  │
│                         │
│  Password must have:    │  (Gray text, 12px)
│  ✓ 8+ characters        │
│  ✗ Uppercase letter     │
│  ✗ Number               │
│                         │
│  ┌───────────────────┐  │
│  │ SIGN UP (Primary) │  │
│  └───────────────────┘  │
│                         │
│  Already have account?  │
│  Log in                 │
│                         │
└─────────────────────────┘
```

---

### 3. Camera Screen

```
┌─────────────────────────┐
│ ◀  Settings   Location⚪ │  (Header)
├─────────────────────────┤
│                         │
│                         │
│   [ Live Camera View ]  │
│   (Full screen)         │
│                         │
│                         │
├─────────────────────────┤
│         ⭕ 📷           │  (Capture button center)
│    (Large tap area)     │
│                         │
│    🖼️ ⟲ 💡    ⊙ ⟲ ▼    │  (Controls: gallery, flip, flash, etc)
└─────────────────────────┘
```

**Features:**
- Full-screen camera preview
- Large circular capture button (center bottom)
- Gallery access (bottom left)
- Flip camera (bottom center-left)
- Flash control
- Settings icon (top left)
- Location indicator (top right)

---

### 4. Photo Review Screen

```
┌─────────────────────────┐
│ ◀ Back        Review     │  (Header)
├─────────────────────────┤
│                         │
│    [Photo Preview]      │
│    (16:9 aspect)        │
│    (user can zoom)      │
│                         │
│                         │
├─────────────────────────┤
│  Tag Location:          │  (Label)
│  ┌───────────────────┐  │
│  │ 📍 Tap to tag...  │  │  (Input/button)
│  └───────────────────┘  │
│                         │
│  Privacy Level:         │  (Label)
│  ⚫ Public              │  (Radio options)
│  ○ Friends Only         │
│  ○ Private              │
│                         │
│  ┌───────────────────┐  │
│  │  UPLOAD (Primary) │  │  (Full width button)
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

---

### 5. Home/Leaderboard Screen

```
┌─────────────────────────┐
│ 🏆 Leaderboard          │  (Header with icon)
├─────────────────────────┤
│  Your Rank: 3rd 🥉      │  (Gold card)
│  +250 XP this month     │
├─────────────────────────┤
│  Monthly Leaders        │  (Tab: Monthly | Global | Quality)
│                         │
│  1️⃣ dashunter23        │  (Card with rank, avatar, XP)
│     5,250 XP  👑        │
│                         │
│  2️⃣ photoboss          │  
│     4,890 XP            │
│                         │
│  3️⃣ You                │  (Highlighted)
│     4,150 XP            │
│                         │
│  4️⃣ mapscout           │
│     3,920 XP            │
│                         │
│  5️⃣ raresniper         │
│     3,450 XP            │
│                         │
│  📍  🏆  🎓  👤  ⚙️    │  (Bottom tab bar)
└─────────────────────────┘
```

---

### 6. Map Screen

```
┌─────────────────────────┐
│ 🔍              ⚙️      │  (Header)
├─────────────────────────┤
│                         │
│  [ Interactive Map ]    │  (Google Maps / Mapbox)
│  - Heatmap overlay      │
│  - Location pins        │
│  - User location        │
│                         │
│                         │
├─────────────────────────┤
│ Nearby Locations        │  (Bottom sheet)
│                         │
│ 📍 Central Park         │  (Location card)
│    45 photos • 2h ago   │
│                         │
│ 📍 Times Square         │
│    28 photos • 5h ago   │
│                         │
│ 📍 Empire State Bldg    │
│    12 photos • 1d ago   │
│                         │
└─────────────────────────┘
```

---

### 7. Profile Screen

```
┌─────────────────────────┐
│ Profile                  ⚙️ │  (Header)
├─────────────────────────┤
│        👤              │  (Avatar, large)
│     dashunter23        │  (Username)
│     Hunter Level 4     │  (Rank with badge)
│                         │
├─────────────────────────┤
│  4,150 XP              │  (Stats cards, 3 columns)
│  Total XP              │
│                         │
│  42                    │
│  Photos                │
│                         │
│  36                    │
│  Valid                 │
│                         │
├─────────────────────────┤
│  Achievements          │  (Section header)
│                         │
│  ⭐ ⭐ ⭐              │  (Achievement grid, 3-4 per row)
│  ⭐ 🔒 ⭐              │
│  ⭐ ⭐ 🔒              │
│                         │
├─────────────────────────┤
│  Recent Photos         │  (Section header)
│                         │
│  [Photo] [Photo]       │  (2-column grid)
│  [Photo] [Photo]       │
│  [Photo] [Photo]       │
│                         │
├─────────────────────────┤
│  [ SETTINGS ]          │  (Secondary button)
│  [ LOG OUT ]           │  (Danger button)
│                         │
└─────────────────────────┘
```

---

## Animation & Transitions

### Micro-interactions

**Button Press:**
- Scale: 98% → 100% (200ms)
- Feedback: Light haptic (iOS) or vibration (Android)

**Screen Transition:**
- Fade + slide up from bottom (300ms)
- Slide right on back navigation (300ms)

**Photo Capture:**
- Shutter animation: flash + scale (100ms)
- Rotation animation on photo review

**XP Gain:**
- +25 text pops up (0.5s)
- Scales from 50% → 100%
- Fades out after 1.5s
- Color: Gold/yellow

**Achievement Unlock:**
- Bounce animation (500ms)
- Confetti effect (optional)
- Badge pops into position

**Loading States:**
- Spinner animation (infinite rotation)
- Pulsing skeleton screens
- Progress bars with smooth transitions

---

## Accessibility

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

**Touch Targets:**
- Minimum 44px × 44px for interactive elements
- Spacing of at least 8px between targets

**Focus Indicators:**
- 2px outline, high contrast color
- Visible on all interactive elements

**Text:**
- Minimum 14px font size
- Line spacing: 1.5× font size
- Max 80 characters per line

**Images:**
- Descriptive alt text for all images
- Decorative images have empty alt text

**Keyboard Navigation:**
- All features accessible via keyboard
- Logical tab order
- Skip links where appropriate

---

## Dark Mode Support

All colors have dark mode equivalents:

```
Light Background: #FFFFFF → Dark Background: #1F2937
Light Text: #111827 → Dark Text: #F9FAFB
Light Card: #F9FAFB → Dark Card: #374151
Borders: #E5E7EB → #4B5563
```

All components automatically switch based on system setting.

---

## Responsive Design

### Breakpoints
```
xs: 0px - 480px (mobile portrait)
sm: 480px - 600px (mobile landscape)
md: 600px - 768px (tablet portrait)
lg: 768px - 1024px (tablet landscape)
xl: 1024px+ (desktop)
```

**Mobile-First Approach:**
- Design for mobile first
- Scale up to larger screens
- Touch-friendly on mobile
- Mouse/keyboard on desktop

---

## Component Export

All components should be exported from a shared library:

```typescript
// src/components/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';
export { Badge } from './Badge';
export { RankBadge } from './RankBadge';
export { XPProgressBar } from './XPProgressBar';
export { LocationPin } from './LocationPin';
export { Achievement } from './Achievement';
export { TabNavigator } from './TabNavigator';
// ... etc
```

---

## Design Tokens

Export all design system values as constants:

```typescript
// src/theme/colors.ts
export const colors = {
  primary: '#6366F1',
  secondary: '#EC4899',
  success: '#10B981',
  danger: '#EF4444',
  // ... rest of colors
};

// src/theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  // ...
};

// src/theme/typography.ts
export const typography = {
  display: { fontSize: 32, fontWeight: 'bold' },
  h1: { fontSize: 28, fontWeight: '600' },
  // ...
};
```

---

## Quality Assurance

### Design System Testing
- [ ] All colors tested for contrast
- [ ] All components tested on multiple devices
- [ ] Animations tested for performance
- [ ] Accessibility audit completed
- [ ] Dark mode tested
- [ ] All breakpoints tested
