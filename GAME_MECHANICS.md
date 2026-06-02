# Dash-Snatch Game Mechanics

## Overview
Dash-Snatch is a location-based photo game focused on hunting, photographing, and tracking the enigmatic character Dash Bottenberg. Players earn rewards based on photograph validity and quality.

## Core Mechanics

### 1. Photography System

#### Valid Photographs
- Player takes a photo using the in-app camera
- System validates if the photo contains Dash Bottenberg
- **Valid:** Player earns XP and ranking rewards
- **Invalid:** Player earns 0 XP, no rewards

#### Photo Validation Methods
- **AI Detection:** TensorFlow/Computer Vision model identifies Dash
- **Fallback:** Manual community validation or admin review
- **Confidence Score:** ML model assigns confidence percentage

#### Photo Quality Ranks
When a valid photo is captured, it receives a quality rank:

| Rank | Criteria | XP Reward | Notes |
|------|----------|-----------|-------|
| Common | Clear identification | 10 XP | Standard photo |
| Uncommon | Good quality, clear expression | 25 XP | Better composition |
| Rare | High quality, interesting angle | 50 XP | Creative shot |
| Epic | Exceptional quality, rare location | 100 XP | Very rare conditions |
| Legendary | Perfect photo, historic location | 250 XP | Once-in-a-lifetime shot |

### 2. XP & Progression System

#### XP Accumulation
- Players earn XP from each valid photograph
- Total XP determines current rank level
- No XP penalty for invalid photos (just no reward)

#### Rank Levels
```
Level 1: 0 XP (Starting Rank: Spotter)
Level 2: 100 XP (Rank: Scout)
Level 3: 300 XP (Rank: Tracker)
Level 4: 600 XP (Rank: Hunter)
Level 5: 1000 XP (Rank: Master Hunter)
Level 6: 1500 XP (Rank: Legend)
```

#### Achievements
- First Photo Milestone
- 100 Photos Taken
- Location Coverage (photo in all regions)
- Hot Streak (X consecutive valid photos)
- Rare Catches (collect photos of all ranks)

### 3. Location Tracking

#### Tagging System
- Player optional tags GPS location when submitting photo
- Location stored with timestamp and photo metadata
- Privacy options: Public, Friends Only, Private

#### Map Features
- **Heatmap:** Shows density of Dash sightings
- **Timeline:** Filter sightings by date range
- **Region Stats:** Most photos per region
- **Recent Sightings:** Live feed of locations where Dash was spotted

#### Location Leaderboard
- Most visited locations by players
- Highest quality photos per location
- Latest sighting timestamps

### 4. Multiplayer Features

#### Player Leaderboards
1. **Global XP Leaderboard** - Top hunters by total XP
2. **Monthly Leaders** - Reset monthly, fresh competition
3. **Location Scouts** - Players with most location tags
4. **Photo Quality Leaders** - Average rank quality per player

#### Social System
- Follow other hunters
- Compare stats with friends
- Share photos on profiles
- Private messages between hunters

### 5. Reward System

#### Direct Rewards
- **XP:** Primary reward from valid photos
- **Cosmetics:** Profile badges, frames for photos
- **Currency:** (Optional) In-game currency from milestones

#### Milestone Rewards
- 10th photo: Starter Badge
- 50th photo: Dedication Badge
- 100th photo: Master Badge
- Legendary rank photo: Rare achievement unlock

## Fraud Prevention

### Anti-Cheating Measures
- Geolocation verification (prevent instant teleportation)
- Image metadata validation (EXIF data checks)
- Community flagging system
- Admin review for suspicious activity
- Cooldown periods between submissions in same location

### Photo Validation Confidence
- ML model must have >75% confidence for automatic approval
- <75% confidence: Manual review queue
- Community can vote on disputed photos

## Progression Balance

### Design Principles
- Early levels reward frequent play (10-25 XP per photo)
- Mid-game requires strategy (50 XP per photo)
- Late game emphasizes quality over quantity (100+ XP rare finds)
- No pay-to-win mechanics
- Grinding possible but optional

## Future Expansions

- **Events:** Limited-time Dash appearances in specific locations
- **Challenges:** Daily/weekly themed photo challenges
- **Trading:** Exchange duplicate photos with other players
- **Guilds:** Team up with other hunters
- **AR Features:** Augmented reality overlays in photos