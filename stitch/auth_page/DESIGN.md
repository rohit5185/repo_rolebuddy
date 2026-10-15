# Design System Specification: Editorial Precision for Habit Formation

## 1. Overview & Creative North Star

### The Creative North Star: "The Digital Ateliers"
This design system rejects the "SaaS-in-a-box" aesthetic. Instead, it adopts the philosophy of a **Digital Atelier**—a space that is meticulously organized, premium, and calm. We are moving away from rigid grids and heavy borders toward a layout that feels curated and breathable.

To achieve this, we utilize **Intentional Asymmetry** and **Tonal Depth**. By leveraging wide margins (generous whitespace) and overlapping glass elements, we create a sense of focus. The goal is to make the user feel like they are stepping into a high-end productivity studio where the interface recedes, and their progress—the "habits"—takes center stage.

---

## 2. Colors & Surface Philosophy

Our palette is anchored by the deep, authoritative `primary` (#3b2ae1) and energized by the high-vis `tertiary` (#3c5900 / #B3F240).

### The "No-Line" Rule
Standard UI relies on lines to separate content. **We do not.** In this design system, 1px solid borders for sectioning are strictly prohibited. Boundaries must be defined through:
- **Background Color Shifts:** Moving from `surface` to `surface-container-low`.
- **Generous Gaps:** Using white space to signal the end of a content block.
- **Tonal Transitions:** Subtle shifts in container saturation to denote hierarchy.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, physical layers of fine paper and frosted glass.
- **Base Layer:** `surface` (#fcf8ff)
- **Content Blocks:** `surface-container-low` (#f5f2ff)
- **Interactive Elements:** `surface-container-highest` (#e4e1ef)
- **Floating Context:** Use `surface-container-lowest` (#ffffff) for cards to create a "lifted" feel against a darker container.

### The "Glass & Gradient" Rule
To inject "soul" into the professional layout:
- **Glassmorphism:** For floating navbars or modals, use `primary_container` (#554bf9) at 60% opacity with a `20px` backdrop blur.
- **Signature Textures:** Main CTAs should never be flat. Apply a subtle linear gradient: `primary` (#3b2ae1) to `primary_container` (#554bf9) at a 135-degree angle.

---

## 3. Typography: The Editorial Voice

We utilize a dual-font strategy to balance professional authority with modern approachability.

*   **Headlines (Inter):** High-contrast sizing. The jump from `body-md` to `headline-lg` should feel dramatic and intentional. Use `headline-lg` (2rem) for page titles to ground the user.
*   **Labels (Manrope):** All functional UI (labels, chips, buttons) uses **Manrope**. Its slightly more geometric structure provides a "tech-forward" feel that contrasts the classic readability of Inter.

### Hierarchy for Habit Formation
- **Display-MD (2.75rem):** Reserved for "Moment of Triumph" screens (e.g., habit streaks).
- **Title-SM (1rem):** Bold weight for card headers to ensure clarity without clutter.
- **Label-SM (0.6875rem):** Uppercase with +5% letter spacing for secondary metadata.

---

## 4. Elevation & Depth: Tonal Layering

We avoid traditional "box shadows" in favor of environmental lighting.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container` background. The difference in hex value provides all the "elevation" needed for standard layouts.
*   **Ambient Shadows:** For high-priority floating elements, use a "Tinted Ambient Shadow":
    - `box-shadow: 0 20px 40px rgba(59, 42, 225, 0.06);` (A subtle tint of our primary color).
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use `outline-variant` (#c7c4d9) at **15% opacity**. It should be felt, not seen.
*   **Glass Depth:** When using glass cards, apply a 1px inner stroke using `on_surface_variant` at 10% opacity to mimic the edge of a glass pane.

---

## 5. Components

### Buttons: The Tactile Interaction
- **Primary:** Gradient (`primary` to `primary_container`), `roundness-md`, with a subtle `primary_fixed` inner glow on hover.
- **Tertiary (The "Accent"):** Use `tertiary_fixed` (#b7f644) for habit-completion actions. It should feel like a "reward" color.

### Input Fields: Minimalist Focus
- **State:** No background fill. Only a bottom-border using `outline-variant` (#c7c4d9) that transitions to `primary` (#3b2ae1) and grows to 2px on focus.
- **Feedback:** Error states use `error` (#ba1a1a) text but maintain the minimalist underline.

### Cards: The Content Vessel
- **Strict Rule:** **No Dividers.**
- Use `surface-container-low` and separate "Header," "Body," and "Footer" through vertical padding (e.g., 24px/32px/24px). 
- Card corners must always be `xl` (0.75rem) to maintain a soft, encouraging feel.

### Progress Trackers (Custom Component)
- For habit formation, use **Non-Linear Progress**. Instead of a bar, use a series of "pills" that use `surface-variant` for inactive and `tertiary_fixed` for active.

---

## 6. Do's and Don'ts

### Do:
- **Do** use asymmetrical margins. If a container is centered, give it more top-padding than bottom-padding to create an "editorial" lift.
- **Do** use `surface-tint` for subtle icons to keep them within the brand family.
- **Do** emphasize "Success States" with the `tertiary` (#B3F240) palette to reinforce habit loops.

### Don't:
- **Don't** use pure black (#000000) for text. Use `on_surface` (#1b1b24) for a premium, softer contrast.
- **Don't** use 100% opaque borders. They break the "Glass & Paper" metaphor.
- **Don't** cram content. If you think a section needs more space, double the current padding.
- **Don't** use standard "drop shadows." Always tint your shadows with the primary hue to maintain tonal depth.