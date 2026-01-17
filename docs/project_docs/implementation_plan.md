# Bangkok Traffic Expansion & Realistic AI Simulation

## Goal
Expand the simulation to cover major Bangkok traffic hotspots (Sukhumvit, Rama 4, Sathon, Lat Phrao) and upgrade the AI Camera simulation to show "real-life" vehicles and a professional UI matching the user's reference.

## Proposed Changes

### 1. Realistic AI Camera Animation (`AICameraFeed.tsx`)
- **HUD Relocation**: Move the large "ZONE" box from the center to the top-center or top-left. Reduce its size and make it a subtle badge to avoid obstructing the view.
- **Animation Loop**:
  - Maintain a state of `vehicles` that move continuously across the screen.
  - Use a high-frequency `setInterval` (e.g., 50ms) to update vehicle `x` positions.
  - Vehicles enter from one side (left/right) and exit from the other.
- **Detection Overlay**:
  - Bounding boxes will follow the animated vehicles in real-time.
  - Update detection confidence and labels dynamically.
- **Real-time Logs**: Sync logs with vehicles entering and leaving the frame.

### 4. Full-Screen Traffic Simulation Page (`app/simulation/page.tsx`)
- **Solid Block Collisions**: 
    - Implement a rigid "Hard-Buffer" logic where each car is treated as a physical block.
    - Vehicles will calculate the exact bounding box of the car in front and stop with a minimum fixed gap (e.g., 2 units) to ensure zero overlap.
- **Opposite Lane Synchronization (Phased Control)**:
    - **Mode A**: North & South are Green; East & West are Red.
    - **Mode B**: East & West are Green; North & South are Red.
    - **Transition Logic**: When switching, the active lanes turn Red first, then the next pair turns Green after a safety delay (simulated yellow/all-red phase).
- **Manual Control Console**:
    - Add "Toggle Phase" buttons to easily switch between N+S and E+W green cycles.
    - Visual indicators showing which "Pair" is currently active.

### 5. GIS Map Enhancement
- **Visual Upgrades**: Add "Pulse" effects to traffic hotspots on the Leaflet map.
- **Small Animated Icons**: Attempt to render small moving vehicle icons on the GIS paths for added realism.

## Verification
1. Open Map: Verify background looks like a real city satellite view.
2. Check Intersections: Verify traffic lights are visible and timers are counting down in Thai/English.
3. Check Zones: Ensure lights are correctly positioned for each Bangkok hotspot.
