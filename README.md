# 🌱 Potlink Mobile

> **Your garden, organized. One plant at a time.**

Potlink is a mobile app for people who keep plants at home (pots, balconies, urban gardens) and want to register them easily and know **what they need and when**.

---

## 🎯 Product Purpose

### Problem

Keeping plants requires memory. When did I last water the basil? Does this Pothos need more light? Is it time to fertilize? Most urban gardeners act on intuition or simply forget.

### Solution: two things, done well

**1. Plant registration with camera**
Take a photo, AI identifies the plant (species, variety, ideal conditions), and the app automatically generates a profile + care routine. You can give it any nickname you want ("Grandma's cactus").

**2. Daily care priorities**
A clear, ordered list of which plants need what today: water 💧, fertilize 🌿, prune ✂️, or repot 🪴. No overwhelming technical info.

---

## 🧭 UX Philosophy

- **One thing at a time.** The app doesn't overwhelm. First you register the plant, then care tasks appear.
- **Quick action.** The main screen shows what needs to be done today, with a one-tap "mark done". Zero friction.
- **Progressive disclosure.** Technical details (moisture threshold, sensor, coordinates) are hidden in a "Details" tab, not front and center.
- **UI language:** The interface is in Spanish (es-AR). Code, types, and function names stay in English.

---

## 📱 Screens

| Screen                    | Role                                          |
| ------------------------- | --------------------------------------------- |
| `PotsListScreen`          | Home: list of all registered plants           |
| `PotRegistrationScreen`   | Add plant (camera + AI + voice input)         |
| `PotDetailScreen`         | Plant detail (tabs: Summary / Care / Details) |
| `CareCalendarScreen`      | Global view of pending / overdue care tasks   |
| `CareSettingsScreen`      | Configure care frequencies per plant          |
| `ARPotRegistrationScreen` | Alternative AR camera registration mode       |
| `PotEditScreen`           | Edit an existing plant's data                 |
| `AuthScreen`              | Login / Auth (Supabase)                       |

---

## 🔁 Main Flow

```
Launch
  └── AuthScreen (if no session)
       └── PotsListScreen (Home)
            ├── [📅 Calendar] → CareCalendarScreen
            ├── [+ Add] → PotRegistrationScreen
            │     ├── Take photo
            │     ├── AI identifies species → suggests care routines
            │     └── Save → auto-creates care schedules
            └── [tap on plant] → PotDetailScreen
                  ├── Tab Summary: photo, species, PlantAdvisor, WeatherAlert
                  ├── Tab Care: schedules + action history
                  ├── Tab Details: technical data, delete
                  └── [⚙️] → CareSettingsScreen
```

---

## 🛠 Tech Stack

| Layer     | Technology                                                               |
| --------- | ------------------------------------------------------------------------ |
| Framework | Expo (React Native)                                                      |
| Backend   | Supabase (Auth + Postgres + Storage)                                     |
| AI        | `@eb-packages/ai-services` (Gemini)                                      |
| Logic     | `@eb-packages/logic` (`createPot`, `identifyPlant`, `getCareSchedules`…) |
| Types     | `@eb-packages/garden` (`Pot`, `CareSchedule`, `SpeciesCareGuide`)        |
| Shared UI | `@eb-packages/ui` (`Screen`, `SharedHeader`, `VoiceInput`)               |
| Analytics | `@eb-packages/analytics` (PostHog)                                       |

---

## 🚀 Running Locally

```bash
# From monorepo root
yarn start:potlink

# Or directly
cd apps/potlink-mobile && yarn start
```

Native iOS:

```bash
cd apps/potlink-mobile && yarn ios
```

---

## 📦 `/src` Structure

```
src/
├── screens/          # One file per screen
├── components/
│   ├── Care/         # CareHistoryList, PlantQuickInfo, WeatherAlert, PlantAdvisor
│   └── ARGlassOverlay.tsx
├── hooks/
│   └── useScreenLogger.ts
├── services/
│   └── analyticsService.ts
└── types/
```

---

## 🔌 Core Data Model

**`Pot`**: name, species, variety, state (seeds/seedling/young/mature), location_type (indoor/outdoor), photo_url, moisture_threshold, sensor_id, lat/lng, weather_condition.

**`CareSchedule`**: pot_id, care_type (watering/fertilizing/pruning/repotting), frequency_days, next_care_date.

**`CareLog`**: historical record of every completed care action.

---

## 🗺 Roadmap (ideas)

- [ ] Home screen widget showing the most urgent care task of the day
- [ ] Push notifications for care reminders
- [ ] Community mode: share tips by species
- [ ] Visual timeline of each plant's life cycle
