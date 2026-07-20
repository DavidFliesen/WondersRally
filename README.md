# Wonders Rally — Zero-Drift Steering Build

This build replaces the previous iPad steering code.

## Critical steering changes

- Removed device-orientation/tilt steering completely.
- Removed retained tilt values and stale keyboard steering values.
- The car receives no steering input unless the wheel is actively dragged or a keyboard steering key is held.
- The wheel now uses stable horizontal drag tracking instead of touch-angle calculations.
- Added a steering dead zone and exact neutral lock.
- Added stability control that cancels residual lateral velocity when the wheel is centered.
- Added gentle road-center assistance while steering is neutral.
- Added new versioned JavaScript and CSS filenames so iPad Safari cannot reuse the prior cached control code.

## iPad controls

- Drag the steering wheel left or right.
- Release the wheel to return it to exact center.
- Hold ACCEL to drive.
- Hold BRAKE to slow down and tighten turns.
- Hold NITRO with ACCEL for a temporary speed boost.

Use landscape orientation. Open `index.html` after replacing the complete previous folder.
