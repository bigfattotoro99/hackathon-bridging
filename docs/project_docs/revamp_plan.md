# Smart Traffic Assistance - Complete Overhaul Plan

## Project Rebrand
- **New Name**: Smart Traffic Assistance
- **Focus**: Professional traffic management assistance system
- **Architecture**: Clean separation of concerns with modular design

---

## 1. Authentication & Navigation Structure

### [NEW] Login Page (`app/login/page.tsx`)
- Username/Email field
- Password field  
- Login button → redirects to Dashboard on success
- "Forgot password?" link (UI only)
- Store auth state in localStorage/session

### Navigation Menu (All authenticated pages)
- Dashboard
- Simulation  
- Notifications
- Settings
- Logout (clear auth + redirect to login)

---

## 2. New Pages

### [NEW] Dashboard (`app/dashboard/page.tsx`)
- Overview cards: Total vehicles, Active phases, System status
- Quick access to Simulation and Notifications
- Recent alerts summary
- Live metrics from simulation engine

### [NEW] Notifications Page (`app/notifications/page.tsx`)
Alert buttons with Toast/Modal + log storage:
- **Congestion Alert** (รถติดสะสม)
- **Accident Alert** (อุบัติเหตุ)
- **Emergency Vehicle** (รถฉุกเฉิน)
- **Weather Impact** (สภาพอากาศ)

Each alert:
- Triggers visual notification (toast/modal)
- Logs event to localStorage with timestamp
- Displays in event history table

### [NEW] Settings Page (`app/settings/page.tsx`)
Configurable parameters:
- Green light duration (seconds)
- Red light duration (seconds)  
- Default vehicle speed (px/frame)
- Spawn rate per lane (vehicles/sec)
- Min gap (collision buffer in pixels)
- **Save** button → persist to localStorage
- **Reset to Default** button

---

## 3. Simulation Engine Upgrade

### 8-Lane 4-Way Intersection
**Road Structure:**
- 4 Directions: North, East, South, West
- Each direction has **2 lanes** (8 total lanes)
- Visual elements:
  - Clear lane dividers
  - Stop lines before intersection
  - Intersection box (pedestrian/conflict zone)

### Phase-Based Traffic Control
- **Phase A**: North + South = GREEN | East + West = RED
- **Phase B**: East + West = GREEN | North + South = RED
- **Auto Mode**: Timer-based switching (from Settings)
- **Manual Mode**: "Switch Phase" button for instant toggle

### Traffic Light Rules
- Green lanes: Vehicles cross stop line and enter intersection
- Red lanes: Vehicles MUST stop before stop line
- Vehicles already in intersection continue through (not affected by phase change)
- Safety buffer: Intersection must be clear before opposite phase starts

---

## 4. Image-Based Vehicles

### Vehicle Assets (PNG/SVG)
Required files in `/public/vehicles/`:
- `car.png` (small vehicle ~28x14px)
- `truck.png` (large vehicle ~40x18px)
- Optional: `car2.png`, `car3.png` for variety

### Rotation System
Vehicles rotate based on direction:
- **North (↑)**: 0°
- **East (→)**: 90°
- **South (↓)**: 180°
- **West (←)**: 270°

### Vehicle Properties
```typescript
interface Vehicle {
  id: string;
  type: 'car' | 'truck';
  laneId: string; // e.g., "N1", "N2", "E1", "E2"
  x: number;
  y: number;
  speed: number;
  direction: 'N' | 'E' | 'S' | 'W';
  state: 'moving' | 'stopped';
  hasCrossedIntersection: boolean;
  width: number; // 28 for car, 40 for truck
  height: number; // 14 for car, 18 for truck
}
```

---

## 5. Strict Collision Detection

### No Overlap Rules
1. **Same-lane collision**: Check distance to vehicle ahead
   - If `distance < (vehicleLength + minGap)` → STOP/SLOW
2. **Intersection collision**: 
   - Before entering, check if intersection box is occupied
   - Use "reservation" system: only one vehicle at a time (or clear path rules)
3. **Hitbox-based detection**:
   - Use actual vehicle dimensions (car vs truck)
   - Account for rotation when calculating bounding box

### Collision Algorithm
```
Before moving vehicle:
1. Calculate next position
2. Check front vehicle in same lane
3. If approaching stop line:
   - Check traffic light state
   - If RED → stop before line
4. If entering intersection:
   - Check intersection reservation
   - Check for cross-traffic
5. Only move if all checks pass
```

---

## 6. Rendering System

### Option A: HTML Canvas (Recommended)
- **Road Layer**: Draw lanes, lines, intersection box
- **Vehicle Layer**: Draw images with `drawImage()` + rotation
- **UI Layer**: Traffic lights, phase indicator, stats

Advantages:
- Better performance for many vehicles
- Easy rotation with `context.rotate()`
- Smooth animations

### Option B: DOM + CSS
- Each vehicle = `<img>` or `<div>` with background
- Use CSS `transform: translate() rotate()`
- Easier debugging, but slower with many vehicles

**Recommendation**: Use Canvas for simulation viewport

---

## 7. Code Architecture

### File Structure
```
app/
├── login/page.tsx
├── dashboard/page.tsx
├── simulation/page.tsx (upgraded)
├── notifications/page.tsx
├── settings/page.tsx
└── layout.tsx (auth wrapper)

lib/
├── simulation/
│   ├── engine.ts (update loop)
│   ├── vehicle.ts (Vehicle class)
│   ├── collision.ts (detection logic)
│   ├── traffic-light.ts (phase control)
│   └── renderer.ts (Canvas drawing)
├── store/
│   ├── settings.ts (Zustand/Context)
│   ├── auth.ts
│   └── notifications.ts
└── utils/
    └── constants.ts

public/
└── vehicles/
    ├── car.png
    └── truck.png
```

### State Management
- **Settings**: Zustand store or Context API
- **Auth**: localStorage + Context
- **Simulation**: Zustand store with engine updates
- **Notifications**: localStorage logs + Zustand for UI

---

## 8. Implementation Phases

### Phase 1: Foundation (Auth + Navigation)
- [  ] Create login page with auth flow
- [  ] Add auth middleware/wrapper
- [  ] Create navigation component
- [  ] Set up Zustand stores

### Phase 2: New Pages
- [  ] Dashboard page with overview
- [  ] Notifications page with alert buttons
- [  ] Settings page with form controls

### Phase 3: Simulation Upgrade
- [  ] Redesign to 8-lane intersection
- [  ] Create vehicle image assets (or placeholders)
- [  ] Implement image-based rendering with rotation
- [  ] Add 2 vehicle types (car/truck)

### Phase 4: Collision System
- [  ] Implement strict hitbox detection
- [  ] Add intersection reservation logic
- [  ] Prevent overlap in all scenarios

### Phase 5: Traffic Control
- [  ] Implement Phase A/B system
- [  ] Add Auto/Manual toggle
- [  ] Connect to Settings parameters

### Phase 6: Polish & Testing
- [  ] Add default values
- [  ] Test all collision scenarios
- [  ] Verify phase switching safety
- [  ] Performance optimization

---

## Default Configuration

```javascript
const DEFAULT_SETTINGS = {
  greenDuration: 30, // seconds
  redDuration: 30,
  vehicleSpeed: 2, // px/frame
  spawnRate: 0.3, // probability per lane per frame
  minGap: 10, // pixels
  intersectionSize: 80, // px
};
```

---

## Success Criteria

✅ Login works and redirects to Dashboard  
✅ All pages accessible via navigation  
✅ Simulation shows 8-lane intersection clearly  
✅ Vehicles are images that rotate properly  
✅ NO collisions or overlaps in any scenario  
✅ Phase switching works in Auto and Manual modes  
✅ Settings persist and affect simulation  
✅ Notifications log and display correctly  
✅ Can run with `npm run dev` immediately
