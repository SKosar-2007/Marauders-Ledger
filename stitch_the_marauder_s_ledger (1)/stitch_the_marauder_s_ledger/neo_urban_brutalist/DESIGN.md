---
name: Neo-Urban Brutalist
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4c4546'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#705d00'
  on-secondary: '#ffffff'
  secondary-container: '#fcd400'
  on-secondary-container: '#6e5c00'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002020'
  on-tertiary-container: '#009393'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#ffe16d'
  secondary-fixed-dim: '#e9c400'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#544600'
  tertiary-fixed: '#00fbfb'
  tertiary-fixed-dim: '#00dddd'
  on-tertiary-fixed: '#002020'
  on-tertiary-fixed-variant: '#004f4f'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.1'
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.1'
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.2'
  data-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.2'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
spacing:
  unit: 4px
  gutter: 24px
  margin-page: 40px
  border-width: 3px
  hard-shadow-offset: 6px
---

## Brand & Style

This design system is built on **Neo-Urban Brutalism**, a style that prioritizes raw functionalism and structural honesty. It is designed for high-frequency infrastructure monitoring where clarity, speed, and an authoritative "urban" edge are paramount. The aesthetic rejects soft gradients and decorative flourishes in favor of rigid grids, heavy strokes, and an architectural energy.

The emotional response should be one of absolute precision and unyielding reliability. It treats the UI as a physical control center—heavy, tactile, and industrial.

**Key Stylistic Pillars:**
- **Raw Functionalism:** Every element has a clear, structural purpose.
- **Structural Integrity:** Visible dividers and thick borders define the hierarchy.
- **Industrial Texture:** A subtle grain overlay is applied to background layers to simulate concrete and prevent "digital sterility."
- **Aggressive Contrast:** High-value accents against a grayscale foundation ensure critical data pulses are impossible to miss.

## Colors

The palette is anchored in the "Urban Grayscale," mimicking architectural materials like concrete, steel, and asphalt.

- **Foundation:** The primary background is `Concrete Gray` (#E5E5E5). Contrast this with `Pitch Black` (#000000) for all structural elements, borders, and primary text.
- **Accents:** 
    - `Warning Yellow` (#FFD700) is used for primary actions, warnings, and active states.
    - `Electric Cyan` (#00FFFF) is reserved for data pulses, terminal outputs, and secondary interactive highlights.
- **Success/Error:** Use pure Green (#00FF00) and Red (#FF0000) but only in high-saturation variants that maintain the brutalist intensity.

## Typography

The typographic system is a clash between high-impact grotesques and technical monospaced fonts.

1.  **Space Grotesk:** Used for all expressive headers and UI labels. It should be set with tight tracking (letter-spacing) for a "compressed" architectural feel. Headlines should be bold and unapologetically large.
2.  **JetBrains Mono:** Used for all quantitative data, status codes, terminal outputs, and technical metadata. This ensures that numbers are legible and aligned in dense monitoring environments.

**Guidelines:**
- All labels and technical data should favor uppercase for an authoritative, "stenciled" look.
- Use `display` sizing for hero metrics and system states only.

## Layout & Spacing

This design system uses a **Rigid Grid** model. The layout is defined by explicit containers and visible divider lines that emphasize the 4px base unit.

- **Desktop:** A strict 12-column grid with 24px gutters. Elements must snap to the grid; no "floating" components.
- **Dividers:** Use 2px - 3px solid black lines to separate layout sections (e.g., sidebar from main feed). 
- **Density:** High. Components should be packed tightly to maximize information density, using internal padding of 12px or 16px to maintain readability.
- **Mobile:** Transition to a 4-column grid. Oversized headers remain large but may wrap; do not shrink them to the point of losing their "heavy" impact.

## Elevation & Depth

Depth is not communicated via light and shadow, but through **Structural Layering** and **Hard Offsets**.

- **No Blurs:** Gaussian blurs, soft shadows, and gradients are strictly prohibited.
- **Sticker Shadows:** Use "Hard Shadows" for elevation. An element is "raised" by applying a solid black offset (typically 6px) to the bottom-right. This creates a "slab" or "sticker" effect.
- **Tonal Stacking:** Use `Concrete Gray` (#E5E5E5) as the base. Higher-level containers can use pure White (#FFFFFF) to pop against the base, but they must still maintain a 3px black border.
- **Active State:** When an element is pressed, it should shift 3px-6px towards the shadow, simulating a physical "button press" where the shadow disappears as the element meets the background.

## Shapes

The shape language is strictly **Sharp**. Rounded corners contradict the industrial, architectural nature of the design system.

- **Corners:** All buttons, inputs, cards, and modal windows must have 0px border-radius.
- **Strokes:** Use a consistent 3px stroke for primary components. Secondary components (like small chips) can use a 2px stroke, but never 1px.
- **Icons:** Use thick-stroke, geometric icons. Avoid any rounded terminals or "organic" shapes.

## Components

### Buttons
Buttons are "Heavy Slabs." They must have a 3px black border and a 6px hard black shadow.
- **Primary:** `Warning Yellow` background with black text.
- **Secondary:** `Concrete Gray` background with black text.
- **Hover:** The background color shifts to `Electric Cyan` or the hard shadow increases in size.

### Inputs
Input fields are stark white boxes with a 3px black border. Labels must be in `JetBrains Mono` uppercase, placed directly above the field or "floating" in a cutout of the top border.

### Chips & Tags
Technical tags use `JetBrains Mono` and a 2px black border. Active tags should use a solid black background with white or cyan text.

### Cards
Cards are the primary organizational unit. They use a white or light gray background, 3px borders, and must feature a "header bar"—a solid black strip at the top of the card containing the title in `Space Grotesk`.

### Data Visualizations
Charts should use solid fills (no gradients). Use `Electric Cyan` for primary data lines and `Warning Yellow` for thresholds. Grid lines within charts should be 1px solid black with low opacity (10-20%) or dotted.

### Infrastructure Health Indicators
Use high-saturation blocks of color. A "Critical" status is a solid Red square with a flickering animation or a heavy "X" glyph. "Stable" is a solid Black or Cyan block.