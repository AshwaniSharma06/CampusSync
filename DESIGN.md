---
name: Cinematic Academic
colors:
  surface: '#04132a'
  surface-dim: '#04132a'
  surface-bright: '#2c3952'
  surface-container-lowest: '#010e25'
  surface-container-low: '#0d1b33'
  surface-container: '#112037'
  surface-container-high: '#1c2a42'
  surface-container-highest: '#27354d'
  on-surface: '#d7e3ff'
  on-surface-variant: '#bdc9c6'
  inverse-surface: '#d7e3ff'
  inverse-on-surface: '#233149'
  outline: '#879390'
  outline-variant: '#3d4947'
  surface-tint: '#71d8c8'
  primary: '#71d8c8'
  on-primary: '#003731'
  primary-container: '#36a395'
  on-primary-container: '#00322d'
  inverse-primary: '#006a60'
  secondary: '#bac3ff'
  on-secondary: '#00208e'
  secondary-container: '#1738bd'
  on-secondary-container: '#a7b4ff'
  tertiary: '#e6c277'
  on-tertiary: '#402d00'
  tertiary-container: '#af8f4a'
  on-tertiary-container: '#3a2900'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#8ef4e4'
  primary-fixed-dim: '#71d8c8'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005048'
  secondary-fixed: '#dee0ff'
  secondary-fixed-dim: '#bac3ff'
  on-secondary-fixed: '#00115a'
  on-secondary-fixed-variant: '#1335bb'
  tertiary-fixed: '#ffdf9f'
  tertiary-fixed-dim: '#e6c277'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5b4301'
  background: '#04132a'
  on-background: '#d7e3ff'
  surface-variant: '#27354d'
typography:
  display-lg:
    fontFamily: Instrument Serif
    fontSize: 84px
    fontWeight: '400'
    lineHeight: 92px
    letterSpacing: -0.02em
  display-md:
    fontFamily: Instrument Serif
    fontSize: 64px
    fontWeight: '400'
    lineHeight: 72px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Instrument Serif
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 56px
  headline-lg-mobile:
    fontFamily: Instrument Serif
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 44px
  headline-md:
    fontFamily: Instrument Serif
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  body-lg:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 32px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 32px
  margin-desktop: 64px
  margin-mobile: 20px
  section-gap: 128px
---

## Brand & Style
The design system establishes a premium, editorial atmosphere for a high-end educational experience. It breaks away from generic SaaS utility in favor of a cinematic, agency-led aesthetic. The visual narrative centers on "The Modern Institution"—merging traditional academic prestige with forward-thinking digital precision.

The style utilizes **Minimalism** as a foundation, enhanced by **Glassmorphism** and **Tactile** details. Key characteristics include:
- **Cinematic Scale:** Large, high-contrast typography and expansive whitespace to create a sense of breath and importance.
- **Illuminated Depth:** Thin, high-clarity borders and subtle ambient glows that suggest light emitting from within digital surfaces.
- **Atmospheric Texture:** A very fine grain overlay applied to deep backgrounds to reduce digital flatness and add a physical, "printed" quality.

## Colors
The palette is rooted in a "Midnight Navy" foundation to provide an immersive, focused environment. 
- **Intelligent Teal** serves as the primary action color, chosen for its balance of professional calm and digital vibrancy.
- **Soft Gold** is reserved for moments of achievement, luxury, or high-tier academic signaling.
- **Warm Ivory** and **Porcelain White** are used for high-contrast "Sheet" layouts where long-form reading occurs, transitioning the user from immersive "System" views to focused "Study" views.

In dark mode, use "Midnight Navy" for the root background and "Academic Navy" for elevated surfaces. In light-themed editorial sections, use "Warm Ivory" as the canvas to reduce eye strain compared to pure white.

## Typography
The typography strategy creates a distinct hierarchy between "Content" and "Interface." 
- **Instrument Serif** is the voice of the brand, used for large editorial headlines and section titles. It should be typeset with tight letter-spacing to enhance its cinematic elegance.
- **Manrope** handles all functional UI, navigation, and body copy. Its geometric yet friendly construction ensures legibility at small sizes while maintaining the modern aesthetic.

For mobile, display sizes should scale aggressively to prevent horizontal overflow, while body sizes remain constant to ensure accessibility. Use `label-sm` for overlines and metadata to provide a structured, "catalog" feel.

## Layout & Spacing
This design system employs a **Fluid Grid** with generous padding to reinforce the premium feel. 
- **Desktop:** 12-column grid with 32px gutters. Margins are intentionally wide (64px) to center-focus the content.
- **Sectioning:** Vertical rhythm is driven by large gaps (128px) to allow each module to stand independently as a "scene."
- **Nesting:** Spacing inside cards and containers should follow a strict 8px base unit, typically using 24px or 32px padding to match the large corner radiuses.

## Elevation & Depth
Depth is articulated through **Tonal Layers** and **Illumination** rather than heavy shadows.
- **Illuminated Borders:** Use 1px solid borders. On dark surfaces, use a top-weighted gradient border (Teal or Blue) at 20% opacity to simulate a "rim light."
- **Layered Shadows:** When cards require lift, use a multi-layered, highly diffused shadow (Blur: 40px, Opacity: 15%, Y: 20px) tinted with the background color (Midnight Navy) to avoid a "dirty" gray look.
- **Glows:** Primary buttons and active states should emit a soft, 15px Gaussian blur glow of their own color to suggest energy.

## Shapes
The shape language is sophisticated and soft. The standard `rounded-xl` (24px) is the signature radius for all primary containers and cards, creating a friendly yet structured frame for the cinematic content. 
- Secondary elements like buttons and inputs use a tighter 12px radius to maintain a distinction between "containers" and "actions."
- Decorative elements may use full pill-shaping for tags and indicators.

## Components
- **Buttons:** Primary buttons use a solid "Intelligent Teal" fill with a subtle "Digital Blue" glow on hover. Text is bold Manrope.
- **Cards:** Utilize the 24px radius. On dark backgrounds, cards use "Academic Navy" with a 1px "illuminated" top border.
- **Input Fields:** Minimalist design with a background of "Academic Navy" and a 1px "Muted Text" border. On focus, the border transitions to "Intelligent Teal" with a soft inner glow.
- **Chips/Tags:** Pill-shaped with a low-opacity "Digital Blue" fill and high-contrast text.
- **Academic Progress Bar:** A custom component featuring a thin, 4px track in "Academic Navy" and a glowing "Soft Gold" fill to indicate prestige and movement.
- **Lists:** Clean, border-bottom only separation using 10% opacity "Warm Ivory" lines. Large leading icons in "Intelligent Teal."