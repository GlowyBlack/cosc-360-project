# Design System Strategy: The Modern Curator

## 1. Overview & Creative North Star

The Creative North Star is *"The Modern Curator."* This system moves away from "warm archival" tones in favor of a crisp, high-contrast digital gallery. It prioritizes clarity, fast-scannability, and a "Digital Native" feel. The interface acts as a neutral, structured frame that allows the rich colors of book covers and portfolio assets to be the primary focus.

## 2. Colors & Tonal Architecture

The palette is rooted in a pure, high-contrast environment to reduce visual "mud" and maximize professional polish.

### Surface Hierarchy

* *Base Layer:* surface (#FFFFFF) – The primary canvas for all discovery feeds and main views.

* *Nesting Layer:* surface-container (#F5F5F5) – Used for section backgrounds, like the service details or sidebars, to create a subtle recessed look.

* *Action Primary:* on-surface (#121212) – Deep charcoal used for primary buttons, active filters, and headers.

* *Status/Accent:* signal-red (#FF3B30) – A vibrant red reserved exclusively for "New" badges to create an immediate focal point.

### The "Pill & Line" Rule

* *Pill Shapes:* All interactive triggers (filters, badges, login buttons) must use a 9999px border-radius.

* *Soft Lines:* Unlike the "no-divider" rule, we use 1px dividers (#E0E0E0) for functional separation in data-dense areas like the profile metadata or chat windows.

## 3. Typography

We use a *Geometric Sans-Serif* (Inter or DM Sans) for a clean, utilitarian voice.

* *Headlines:* Bold weights (700) for "Discover" moments.

* *Navigation:* Medium weights (500) for tabs and filters.

* *Metadata:* Use a lighter gray (#666666) for author names, years, and price tags to ensure the book title remains the primary information.

## 4. Components

### Buttons & Inputs

* *Primary Action:* Solid #121212 with white text. Pill-shaped.

* *Secondary Action:* Transparent with #E0E0E0 border or light gray fill.

* *Search Bar:* surface-container background with an icon prefix and pill shape for a tactile, modern feel.

### Cards & Grids

* *Book Gallery:* Use a standard 12px border-radius for images.

* *Portfolio:* Large, edge-to-edge images within cards to highlight visual work.

* *The "New" Badge:* Small red pill positioned at the top-left of the card with white text.

### The "Conversation Dock"

A persistent right-side panel for Chat. It uses white-on-black bubbles for the user and black-on-gray for the recipient to create an immediate visual hierarchy in the dialogue.

## 5. Do’s and Don’ts

* *Do* keep 3.5rem (56px) of padding between major sections to let the grid breathe.

* *Do* use standard sentence case for buttons and labels.

* *Don't* use serif fonts for interface elements.

* *Don't* use drop-shadows on every element; reserve them only for floating navigational bars.