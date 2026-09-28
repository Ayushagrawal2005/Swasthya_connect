# SWASTHYA CONNECT
# MASTER UI/UX DESIGN SYSTEM
# AND PERSISTENT KIRO DESIGN RULES

============================================================

## PURPOSE

============================================================

This document is the permanent UI/UX and visual-design authority for the Swasthya Connect web project.

**Kiro MUST follow these rules whenever it:**
- Creates UI
- Modifies UI
- Redesigns UI
- Adds a feature
- Changes a component
- Changes navigation
- Creates a new page
- Refactors a page
- Improves responsiveness
- Improves accessibility
- Changes forms, dashboards, tables, cards, alerts
- Changes typography, colours, spacing, or interaction patterns

**These are GLOBAL PROJECT RULES.**

They are not suggestions. Do not override these rules for a local page-level design decision unless the project owner explicitly requests a change to the design system.

============================================================

## 1. DESIGN SYSTEM AUTHORITY

============================================================

Swasthya Connect uses **ONE unified design system**.

The same visual language must be capable of being used across the broader Swasthya Connect ecosystem:
- Web
- Mobile application
- Frontline Worker application
- Health kiosk

The layouts and workflows of those platforms may differ. **The visual language must remain consistent.**

**Shared design language includes:**
- Colour
- Typography
- Iconography
- Buttons
- Inputs
- Cards
- Borders
- Status indicators
- Spacing
- Accessibility
- Terminology
- Interaction patterns

The system should feel like **ONE product** implemented across different interfaces.

**Do not create independent visual identities for individual modules or features.**

============================================================

## 2. GIGW 3.0 ALIGNMENT

============================================================

Use **Guidelines for Indian Government Websites and Apps (GIGW 3.0)** as the benchmark for:
- Public-service UI/UX
- Usability
- User-centric information architecture
- Accessibility
- Consistency
- Content presentation

**Important distinction:**

GIGW is the DESIGN AND USABILITY BENCHMARK.

Swasthya Connect is a **prototype**.

Do NOT claim GIGW certification or official government ownership unless separately verified and authorized.

**GIGW principles inform:**
- Information architecture
- Navigation
- Accessibility
- Usability
- Page hierarchy
- Content organization
- Responsive behaviour
- Search, help, contact, feedback
- Page titles and metadata
- Ownership presentation
- Content freshness
- Document presentation

**Reference:** https://guidelines.india.gov.in/introduction/

============================================================

## 3. CORE DESIGN PHILOSOPHY

============================================================

Swasthya Connect should feel:
- Trustworthy
- Public-service oriented
- Healthcare focused
- Professional
- Accessible
- Human
- Structured
- Modern
- Restrained
- Information-first
- Suitable for rural India

**The visual style combines:**

**PUBLIC-SERVICE CLARITY** + **HEALTHCARE USABILITY** + **MODERN DIGITAL DESIGN** + **SWASTHYA CONNECT BRAND IDENTITY**

**It must NOT feel like:**
- A commercial SaaS dashboard
- A fintech product
- A consumer wellness startup
- A futuristic AI product
- A gaming interface
- A social media application
- A flashy startup landing page
- An old-fashioned copy of a government website

**The goal:** MODERN PUBLIC-HEALTH DIGITAL PLATFORM

============================================================

## 4. GOVERNMENT-INSPIRED, NOT GOVERNMENT-IMITATION

============================================================

**Use government/public-service design principles:**
- Clear institutional hierarchy
- Structured navigation
- Formal information architecture
- Accessibility
- Service discovery
- Clear page titles
- Help and contact
- Feedback
- Policies and resources
- Consistent navigation

**Do NOT:**
- Copy a specific government website pixel-for-pixel
- Imitate another organisation's exact branding
- Use official government emblems falsely suggesting official status
- Invent government ownership

**The project is:** "Prototype • Smart India Hackathon 2026"

**Where necessary use:** "Not an official Government of India website"

============================================================

## 5. MASTER COLOUR SYSTEM (CURRENT IMPLEMENTATION)

============================================================

### PRIMARY BRAND COLOUR

**Government Navy:** `#123B6D`

**Use for:**
- Major structure
- Navigation
- Header
- Headings
- Primary text
- Standard icons
- Active structural elements
- Important UI boundaries

### BRAND ACCENT

**Swasthya Orange:** `#E85D04`

**Use for:**
- Primary CTA
- Active navigation
- Selected states
- Key actions
- Brand highlights
- Important links

### BACKGROUND & SURFACES

**Background:** `#EEF2F6` / `#F5F7FA`  
**Surface:** `#FFFFFF`  
**Border:** `#D9E1EA` / `#DFE6EF`

### TEXT COLOURS

**Primary Text:** `#123B6D`  
**Secondary Text:** `#5D6F88` / `#52657A`  
**Light Text:** `#7B8AA0` / `#8A97AB`

### SEMANTIC COLOURS

**SUCCESS:** `#198754` / `#1E9B6B`  
**WARNING:** `#D98C00` / `#D79B00`  
**CRITICAL:** `#D92D20`  
**INFORMATION:** `#1677C8` / `#1E7FE4`

============================================================

## 6. COLOUR DISCIPLINE

============================================================

**This rule is NON-NEGOTIABLE.**

**Do NOT use different colours to create separate visual themes for different healthcare features.**

**DO NOT create:**
- Purple AI theme
- Pink menstrual theme
- Orange pregnancy theme
- Green vaccination theme
- Blue records theme
- Purple medicine theme

**All features belong to ONE Swasthya Connect visual system.**

Use semantic colours only when they communicate actual meaning:

**RED:** Emergency, Critical, Danger  
**GREEN:** Success, Completed, Synced, Available  
**AMBER/ORANGE:** Pending, Attention, Important action  
**BLUE:** Information, Informational status

**Target visual balance:** Approximately:
- 80% Navy / White / Neutral
- 15% Swasthya Orange
- 5% Semantic Colours

**Do not introduce additional colours merely for decoration.**

============================================================

## 7. TYPOGRAPHY (CURRENT IMPLEMENTATION)

============================================================

**Primary font:** Noto Sans (system default via Tailwind)  
**Hindi font:** Noto Sans Devanagari

**The typography system MUST support:**
- English
- Hindi
- Marathi
- Tamil
- Telugu
- Bengali

### Typography Hierarchy

**H1 (Page Titles):**
- Size: `text-[28px] sm:text-[38px] md:text-[48px] lg:text-[56px] xl:text-[64px]`
- Weight: `font-bold`
- Leading: `leading-[1.15] sm:leading-[1.1] md:leading-[1.05] lg:leading-[1.0]`

**H2 (Section Titles):**
- Size: `text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px]`
- Weight: `font-bold`
- Color: `text-[#123B6D]`

**H3 (Card/Component Titles):**
- Size: `text-[16px] sm:text-[17px] md:text-[18px]`
- Weight: `font-bold`

**Body Text:**
- Size: `text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px]`
- Leading: `leading-relaxed`

**Supporting Text:**
- Size: `text-[12px] sm:text-[13px] md:text-[14px]`

**Small Text/Labels:**
- Size: `text-[10px] sm:text-[11px]`
- Leading: `leading-tight`

**Metadata/Micro Text:**
- Size: `text-[7px] sm:text-[8px] md:text-[9px]`
- Leading: `leading-tight`

Use typography to create hierarchy instead of excessive colour, shadows or decoration.

**Do NOT use:**
- Decorative fonts
- Playful rounded fonts
- Futuristic fonts
- Overly thin text
- Low-contrast text

============================================================

## 8. ICONOGRAPHY (CURRENT IMPLEMENTATION)

============================================================

**Icon Library:** Lucide React (outline style)

**Consistent icon family with simple outline icons.**

**Icon Colours:**
- **Default:** Navy `#123B6D`
- **Primary action:** Orange `#E85D04`
- **Critical:** Red
- **Success:** Green
- **Information:** Blue

**Icon Sizes:**
- Small: `size={12}` to `size={16}`
- Medium: `size={18}` to `size={22}`
- Large: `size={24}` and above

Icons must support comprehension.

**Do NOT introduce:**
- 3D icons
- Emoji-style icons
- Cartoon icons
- Mixed icon families
- Multicoloured decorative icons

**Use an icon only when it improves comprehension or scanning.**

============================================================

## 9. SPACING SYSTEM (CURRENT IMPLEMENTATION)

============================================================

**Base unit:** 4px (Tailwind default)

**Preferred values:**
- `gap-1` to `gap-6` (4px to 24px)
- `px-2` to `px-8` (8px to 32px)
- `py-2` to `py-12` (8px to 48px)
- `mb-2` to `mb-10` (8px to 40px)

**Section Spacing:**
- `py-6 sm:py-8 md:py-10 lg:py-12`

**Card Padding:**
- `p-4 sm:p-5 md:p-6`

**Component Gaps:**
- `gap-1.5 sm:gap-2 md:gap-3 lg:gap-4`

**Do not use random spacing values throughout the interface.**

============================================================

## 10. BORDER RADIUS (CURRENT IMPLEMENTATION)

============================================================

**Use moderate rounding:**

**Cards:** `rounded-lg` to `rounded-xl` (8-12px)  
**Inputs:** `rounded-lg` (8px)  
**Buttons:** `rounded-lg` (8px)  
**Badges:** `rounded-full` or `rounded-md`

**Use pill shapes only when appropriate for:**
- Status badges
- Compact filters
- Tags

**Do not use:**
- Excessive pill-shaped containers
- Extremely rounded cards

============================================================

## 11. SHADOWS AND ELEVATION (CURRENT IMPLEMENTATION)

============================================================

**Use subtle elevation only:**

**Default Shadow:** `shadow-sm` to `shadow-lg`  
**Hover State:** `hover:shadow-xl`  
**Sticky Header:** `shadow-lg`

**Prefer:**
- Borders
- Spacing
- Typography
- Colour hierarchy

**Avoid:**
- Heavy shadows
- Glowing effects
- Glassmorphism
- Neon effects
- Excessive depth

**The interface should remain visually calm and structured.**

============================================================

## 12. LAYOUT SYSTEM (CURRENT IMPLEMENTATION)

============================================================

**Maximum Width:** `max-w-[1800px]`

**Responsive Grid System:**
- Mobile: `grid-cols-1`
- Tablet: `sm:grid-cols-2` or `md:grid-cols-2`
- Desktop: `lg:grid-cols-3` or `xl:grid-cols-4`

**Padding:**
- Mobile: `px-2` to `px-4`
- Tablet: `sm:px-4` to `md:px-6`
- Desktop: `lg:px-4` to `xl:px-6`

**Prioritize:**
- Alignment
- Readable widths
- Consistent columns
- Clear hierarchy
- Predictable spacing
- Balanced density

**Every visual element must have a purpose.**

============================================================

## 13. INFORMATION HIERARCHY

============================================================

Every page should communicate:
1. Where am I?
2. What is this page?
3. What is important?
4. What needs attention?
5. What can I do next?

**Use:**
- Page title
- Contextual navigation
- Headings
- Section titles
- Primary actions
- Supporting information

**Do not make every element equally prominent.**

============================================================

## 14. HEADER STRUCTURE (CURRENT IMPLEMENTATION)

============================================================

### Utility Bar
- Height: `h-[24px]`
- Background: `bg-[#171717]`
- Text: `text-[11px] text-white`
- Contains: Government branding, team ID, language selector, accessibility controls

### Main Header
- Background: `bg-white`
- Border: `border-b border-gray-200`
- Padding: `py-2 sm:py-2 md:py-2.5`
- Sticky: `sticky top-0 z-50`
- Shadow: `shadow-lg`

### Logo Sizes (Responsive)
- Mobile: `h-[42px] w-[42px]`
- Tablet: `sm:h-[45px] sm:w-[45px]`
- Desktop: `md:h-[50px] md:w-[50px]` to `lg:h-[55px] lg:w-[55px]`

### Title Sizes (Responsive)
- Mobile: `text-[13px]`
- Tablet: `sm:text-[15px]` to `md:text-[18px]`
- Desktop: `lg:text-[22px]` to `xl:text-[26px]`

### Navigation Bar
- Background: `bg-[#123B6D]`
- Border: `border-t border-blue-700`
- Height: `h-[48px]`
- Mobile: Hamburger menu with `lg:hidden`
- Desktop: Full navigation with `hidden lg:flex`

**Components:**
- Government logos (Indian Government, Ministry of Health)
- Swasthya Connect logo + text
- Prototype badge (desktop only)
- Gandhi logo, NHM logo (large screens)
- Digital India logo + text
- Login / Register button

============================================================

## 15. NAVIGATION (CURRENT IMPLEMENTATION)

============================================================

**Primary Navigation Items:**
- Home, About, Services
- For Patients, For Frontline Workers, For Doctors, For Facilities
- Schemes & Policies, Resources, Help, Contact

**Navigation Styling:**
- Inactive: `text-white hover:bg-[#1a5a8f] hover:text-[#E85D04]`
- Active: `border-b-3 border-[#E85D04] bg-[#1a5a8f] text-white`

**Mobile Navigation:**
- Toggle with hamburger icon
- Full-width menu items
- Border-left indicator for active state

**Dropdown indicators:** `<ChevronDown size={12}` />` for sections with submenus

============================================================

## 16. BUTTONS (CURRENT IMPLEMENTATION)

============================================================

### Primary Button (CTA)
```css
className="rounded-lg bg-[#E85D04] px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:px-2.5 md:py-3 
text-[11px] sm:text-[12px] md:text-[13px] lg:text-[15px] font-bold text-white 
shadow-lg transition hover:bg-[#d34b03] hover:shadow-xl hover:scale-105"
```

### Secondary Button
```css
className="rounded-lg border-2 border-white bg-transparent px-6 sm:px-7 md:px-8 
py-3 sm:py-3.5 text-[14px] sm:text-[15px] md:text-[16px] font-semibold text-white 
transition hover:bg-white/10"
```

**Button States:**
- Default: Base styling
- Hover: Scale, shadow, colour change
- Focus: Visible focus ring
- Disabled: Reduced opacity

**Button Labels:**
- Clear action-oriented text
- Include icons where appropriate
- Responsive text (hide/show based on screen size)

============================================================

## 17. CARDS (CURRENT IMPLEMENTATION)

============================================================

### Standard Card
```css
className="overflow-hidden rounded-lg border border-[#dfe6ef] bg-white 
shadow-sm hover:shadow-lg transition-shadow"
```

### Feature Card
```css
className="feature-card bg-white rounded-xl border border-[#d8e1ea] p-5 sm:p-6"
```

**Card Components:**
- Header: Coloured background (`bg-[#123B6D]` or `bg-[#E85D04]`)
- Content area: White background
- Icon: Rounded background with brand colour
- Hover effect: Elevated shadow

**Animation:**
```css
.feature-card {
  transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
}
.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 32px rgba(18, 59, 109, 0.15);
}
```

============================================================

## 18. FORMS & INPUTS

============================================================

**Search Input:**
```css
className="h-[36px] w-[120px] md:w-[150px] lg:w-[180px] bg-transparent px-2 
text-[12px] text-[#123B6D] outline-none"
```

**Language Selector Dropdown:**
```css
className="absolute right-0 top-full mt-1 bg-white border-2 border-gray-300 
rounded-md shadow-2xl py-1 min-w-[120px] sm:min-w-[140px] z-[200]"
```

**Dropdown Items:**
- Selected: `bg-[#E85D04] text-white shadow-sm`
- Unselected: `text-gray-800 hover:bg-[#123B6D] hover:text-white`

============================================================

## 19. TICKER/BANNER (CURRENT IMPLEMENTATION)

============================================================

**Government Updates Ticker:**
```css
className="bg-[#123B6D] py-2 sm:py-3 border-b border-white/10 overflow-hidden"
```

**Badge:**
```css
className="bg-[#E85D04] text-white px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-md 
text-[10px] sm:text-[11px] md:text-[12px] font-bold uppercase"
```

**Animation:**
```css
@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-scroll {
  animation: scroll 60s linear infinite;
}
.animate-scroll:hover {
  animation-play-state: paused;
}
```

============================================================

## 20. HERO SECTION (CURRENT IMPLEMENTATION)

============================================================

**Background:**
- Image overlay with gradient
- Opacity: `opacity-70 sm:opacity-80 md:opacity-85 lg:opacity-95`
- Gradient: `from-[#123B6D]/85 via-[#123B6D]/65 to-[#123B6D]/40`

**Content Width:**
- Maximum: `max-w-full sm:max-w-[95%] md:max-w-[700px]`

**Typography:**
- Badge: `text-[10px] sm:text-[11px] md:text-[12px]`
- Heading: `text-[28px]` to `xl:text-[64px]`
- Body: `text-[13px]` to `lg:text-[16px]`

**Testimonial Card:**
```css
className="testimonial-card w-full max-w-full sm:max-w-[95%] md:max-w-[90%] 
lg:max-w-[540px] rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-4 sm:p-5"
```

============================================================

## 21. STATUS INDICATORS (CURRENT IMPLEMENTATION)

============================================================

**Status Badges:**
```css
className="inline-block rounded px-2 py-0.5 text-[10px] font-semibold"
```

**Colour Coding:**
- Announcement: `bg-[#123B6D] text-white`
- Update: `bg-[#1E7FE4] text-white`
- Advisory: `bg-[#D79B00] text-white`
- Event: `bg-[#1E9B6B] text-white`

**Prototype Badge:**
```css
className="rounded-lg bg-[#E85D04] px-2.5 py-1.5 text-white shadow-md"
```

============================================================

## 22. RESPONSIVE BREAKPOINTS (CURRENT IMPLEMENTATION)

============================================================

**Tailwind Default Breakpoints:**
- Mobile: `< 640px` (default)
- Small: `sm: >= 640px`
- Medium: `md: >= 768px`
- Large: `lg: >= 1024px`
- Extra Large: `xl: >= 1280px`

**Mobile-First Approach:**
- Design for mobile first
- Progressive enhancement for larger screens
- Hide non-essential elements on mobile
- Expand content on larger screens

**Responsive Patterns:**
- Grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-4`
- Text: `text-[11px] sm:text-[12px] md:text-[13px]`
- Spacing: `gap-2 sm:gap-3 md:gap-4`
- Padding: `px-3 sm:px-4 md:px-6`

============================================================

## 23. ANIMATIONS (CURRENT IMPLEMENTATION)

============================================================

**Float Animation:**
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
.float-card {
  animation: float 3s ease-in-out infinite;
}
```

**Fade In Up:**
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Transitions:**
- Standard: `transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1)`
- Hover: `hover:scale-105`
- Shadow: `hover:shadow-xl`

============================================================

## 24. ACCESSIBILITY (CURRENT IMPLEMENTATION)

============================================================

**Aria Labels:**
- Language selector: `aria-label="Select Language"`
- Mobile menu: `aria-label="Toggle menu"`
- Expanded state: `aria-expanded={showLanguageMenu}`

**Keyboard Navigation:**
- All interactive elements accessible via keyboard
- Visible focus states
- Logical tab order

**Semantic HTML:**
- `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- Proper heading hierarchy
- Button elements for actions

**Contrast:**
- Navy on white: High contrast
- Orange on white: High contrast
- White on navy: High contrast

**Screen Reader Support:**
- Alt text for images
- ARIA labels for icon-only buttons
- Meaningful link text

============================================================

## 25. BILINGUAL SUPPORT (CURRENT IMPLEMENTATION)

============================================================

**Supported Languages:**
- English
- Hindi (हिंदी)
- Marathi (मराठी)
- Tamil (தமிழ்)
- Telugu (తెలుగు)
- Bengali (বাংলা)

**Language Selector:**
- Utility bar placement
- Dropdown menu with flags/names
- Persistent across sessions
- Smooth transitions

**Translation Pattern:**
```typescript
const t = useT()
{t('login')} / {t('register')}
```

============================================================

## 26. FOOTER (CURRENT IMPLEMENTATION)

============================================================

**Structure:**
```css
className="bg-[#123B6D] text-white"
```

**Grid Layout:**
- Mobile: `grid-cols-1`
- Tablet: `sm:grid-cols-2`
- Desktop: `lg:grid-cols-5`

**Sections:**
- Branding (logo + text + prototype badge)
- About links
- Services links
- Resources links
- Help & Support links

**Bottom Bar:**
```css
className="border-t border-blue-700"
```

**Content:**
- Team ownership
- Government disclaimer
- Prototype disclosure

============================================================

## 27. MOBILE OPTIMIZATION (CURRENT IMPLEMENTATION)

============================================================

**Mobile Header:**
- Compact logo sizes (42px)
- Truncated text with `truncate`
- Hamburger menu
- Responsive spacing

**Mobile Content:**
- Single column layouts
- Stacked buttons
- Full-width cards
- Touch-friendly targets (min 44px)

**Mobile Navigation:**
- Full-screen menu overlay
- Large tap targets
- Clear active states
- Easy dismiss

============================================================

## 28. PERFORMANCE CONSIDERATIONS

============================================================

**Image Optimization:**
- Use appropriate formats
- Lazy loading where appropriate
- Responsive images

**Animation Performance:**
- CSS transforms (not layout properties)
- Will-change hints where needed
- Respect `prefers-reduced-motion`

**Loading States:**
- Skeleton screens
- Progressive disclosure
- Meaningful loading indicators

============================================================

## 29. Z-INDEX HIERARCHY (CURRENT IMPLEMENTATION)

============================================================

- Utility bar: `z-[100]`
- Dropdown overlay: `z-[150]`
- Dropdown menu: `z-[200]`
- Header (sticky): `z-50`
- Mobile menu overlay: `z-40`

**Maintain consistent z-index scale to avoid conflicts.**

============================================================

## 30. FINAL DESIGN PRINCIPLE

============================================================

Swasthya Connect should look like:

**A trusted, modern, accessible public-health technology platform designed for rural India.**

It should NOT look like:
- A colourful collection of healthcare cards
- A generic SaaS startup
- A copy of another government website

It should feel:
- Structured
- Human
- Professional
- Clear
- Accessible
- Trustworthy
- Modern
- Restrained

============================================================

## 31. CHANGE MANAGEMENT RULE

============================================================

When modifying UI:

**STEP 1:** Inspect the existing design system  
**STEP 2:** Identify the smallest change required  
**STEP 3:** Reuse existing components and tokens  
**STEP 4:** Modify only the necessary UI  
**STEP 5:** Do not redesign unrelated areas  
**STEP 6:** Verify responsive behaviour  
**STEP 7:** Verify accessibility  
**STEP 8:** Verify colour and typography consistency  
**STEP 9:** Verify no unnecessary new visual pattern was introduced

============================================================

## 32. FINAL NON-NEGOTIABLE RULE

============================================================

Before creating or modifying any UI:

**INSPECT. REUSE. MODIFY. VERIFY.**

Do not:

**INVENT. DUPLICATE. OVERRIDE. OVER-DESIGN.**

The design system must become **MORE consistent over time, not less consistent.**

============================================================

## 33. FINAL STATEMENT

============================================================

**ONE BRAND. ONE DESIGN SYSTEM. DIFFERENT EXPERIENCES.**

Swasthya Connect must be recognizable immediately through:
- Navy (#123B6D)
- Orange (#E85D04)
- White
- Neutral surfaces
- Clear typography
- Consistent components
- Structured information
- Accessible interaction

**Kiro must preserve this design language across every future UI/UX change unless the project owner explicitly approves a design-system change.**

---

**Document Version:** 1.0  
**Last Updated:** Based on Landing Page implementation as of current session  
**Authority:** This is the master design document for all Swasthya Connect UI/UX decisions
