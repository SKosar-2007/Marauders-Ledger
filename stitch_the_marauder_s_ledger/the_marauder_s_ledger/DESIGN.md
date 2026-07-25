---
name: The Marauder's Ledger
colors:
  surface: '#fff8f2'
  surface-dim: '#ebd8b3'
  surface-bright: '#fff8f2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff2dd'
  surface-container: '#ffecc7'
  surface-container-high: '#fae6c0'
  surface-container-highest: '#f4e0bb'
  on-surface: '#241a04'
  on-surface-variant: '#504440'
  inverse-surface: '#3a2f15'
  inverse-on-surface: '#ffefd2'
  outline: '#827470'
  outline-variant: '#d3c3be'
  surface-tint: '#74584e'
  primary: '#090100'
  on-primary: '#ffffff'
  primary-container: '#2c1810'
  on-primary-container: '#9e7e73'
  inverse-primary: '#e3bfb2'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#040200'
  on-tertiary: '#ffffff'
  tertiary-container: '#231c09'
  on-tertiary-container: '#8f846a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#e3bfb2'
  on-primary-fixed: '#2a170f'
  on-primary-fixed-variant: '#5a4137'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#f0e1c3'
  tertiary-fixed-dim: '#d3c5a8'
  on-tertiary-fixed: '#221b08'
  on-tertiary-fixed-variant: '#4f4630'
  background: '#fff8f2'
  on-background: '#241a04'
  surface-variant: '#f4e0bb'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  title-md:
    fontFamily: Libre Caslon Text
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Literata
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Literata
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
This design system captures the arcane essence of a living magical document. It is designed for "The Marauder's Ledger," targeting users who value heritage, secrecy, and the tactile nature of ancient manuscripts. The UI should evoke the feeling of interacting with an enchanted artifact—heavy, historical, yet responsive to the user's touch.

The style is **Tactile / Skeuomorphic** with a heavy influence from **Editorial Design**. It avoids modern flatness in favor of depth created through organic textures, ink bleeds, and ornamental gold work. Every digital interaction mimics a physical act: a button click feels like a wax seal being pressed; a notification appears like ink materializing on a page. The aesthetic is "High-Fantasy Scholastic," blending the rigor of a financial ledger with the whimsy of a wizard's spellbook.

## Colors
The palette is rooted in natural, historical pigments. 

- **The Canvas (Parchment):** Use `#f5e6c8` as the universal application background. Use the lighter `#faf3e6` for elevated surfaces like scrolls and the darker `#e8d5b0` for recessed areas or depth-mapping.
- **The Script (Ink):** All primary communication uses `#2c1810`. It should never be pure black. For secondary or metadata descriptions, use the diluted `#5c3d2e`.
- **The Alchemy (Gold):** Used exclusively for interactive elements, call-to-actions, and decorative borders. It represents the "magic" in the interface.
- **The Severity (Enchanted Indicators):** Warning states are tied to magical threats. Blood Red for critical alerts, Amber for warnings, and Emerald for safe/positive confirmations.

## Typography
The typography follows a classical hierarchy. Note that while the brand utilizes Cinzel Decorative for specific ornamental titles, the primary digital implementation uses **Libre Caslon Text** for headings to ensure legibility while maintaining a regal, historical feel.

**Literata** is used for body text, providing a bookish, comfortable reading experience that mimics printed type on parchment. For transactional data, quantities, and "ledger entries," **JetBrains Mono** is used to provide a sharp, technical contrast that suggests the precision of a goblin-run bank.

All headings should be treated with a slight text-shadow of `#ffffff` at 1px offset to simulate the slight indentation of a printing press on soft paper.

## Layout & Spacing
The layout philosophy is based on **Classical Manuscripts**. Content is centered and contained within generous margins, simulating the "safe zone" of a scroll. 

- **Grid:** Use a 12-column fluid grid for desktop with wide 24px gutters to allow the parchment background to "breathe" between content blocks.
- **Padding:** Apply inner padding to containers that mimics a physical margin (minimum 32px for cards).
- **Adaptive Rules:** On mobile, containers should lose their "torn edge" margins and bleed to the edges of the screen, keeping only the 16px internal margin to maximize space for data.
- **Dividers:** Do not use simple lines. Use ornamental "Gold Filigree" dividers or horizontal ink-stroke images to separate major sections.

## Elevation & Depth
Depth in the design system is achieved through **Tonal Layers** and **Textural Contrast** rather than standard drop shadows.

- **Level 0 (Base):** The main parchment background with subtle grain noise.
- **Level 1 (Scrolls/Cards):** Elements appear slightly lighter (`#faf3e6`) and use a "Torn Edge" mask. Instead of a shadow, use a very thin, 1px inner stroke of `#d4af37` (Gold) to suggest a gilded edge.
- **Level 2 (Modals/Popovers):** These use a stronger "Ambient Glow." Instead of a black shadow, use a soft, wide-radius glow using the Gold accent color (`#d4af37`) at 15% opacity to suggest the element is enchanted and floating.
- **Recessed Fields:** Input fields and data cells should appear "pressed" into the paper using a subtle inner shadow (darker parchment tone).

## Shapes
The shape language is **Organic and Imperfect**. 

While the functional roundedness is set to `1` (0.25rem) for standard UI hitboxes, large containers (Cards, Modals) must use an SVG mask to create a "Hand-Cut" or "Torn" paper edge. Avoid perfect circles except for iconography. Buttons should have slightly irregular corners to look like hand-stamped wax seals or cut leather tags.

## Components

### Buttons
- **Primary:** Styled as a Golden Wax Seal. Circular or slightly irregular shape, `#d4af37` background, with `#2c1810` icon/text. 
- **Hover State:** A subtle gold "pulse" glow and a 2% scale increase using a spring transition.
- **Secondary:** Transparent background with a "Gold Leaf" border (2px) and ink-colored text.

### Cards & Scrolls
- All cards must use the lighter parchment color (`#faf3e6`) and include a subtle noise texture. 
- Top and bottom edges should feature a "Torn Paper" effect.
- Content inside cards should be indented with a "Margin Line" (a vertical red ink line on the left side, similar to old notebook paper).

### Input Fields
- Inputs are not boxed. They are represented as a single horizontal ink-stroke line (`#5c3d2e`) at the bottom.
- **Focus State:** The line turns to Gold (`#d4af37`) and a small "Ink Drip" animation occurs at the start of the line.

### Lists & Tables
- **The Ledger Look:** Alternate rows do not use background colors. Instead, use a very faint horizontal ink line. 
- Header cells use **JetBrains Mono** in all caps for a formal, ledger-style appearance.

### Selection Controls
- **Checkboxes:** Styled as hand-drawn "X" marks in ink.
- **Radio Buttons:** Styled as small circular wax seals that "melt" when selected.

### Motion & Interaction
- **Ink Spread:** When a new page or component loads, text should appear using a "masked ink bleed" effect rather than a standard fade-in.
- **Springs:** All transitions must use a "Heavy Spring" (high mass, low stiffness) to give the UI a sense of physical weight.