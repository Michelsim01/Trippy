## Project Overview

Full-stack travel experience platform similar to airbnb and getyourguide where you can purchase experiences/tours. users can also list tour experiences as a guide to sell to tourists. i am a newbie coder with a team of 5 people, so i would like to create my parts and integrate my parts smoothly with them without much issues.

## Current focus

## Key work flows

### Create Experience Flow

side bar -> click create an experience -> create experience basic info ->
create experience details (including itinerary builder which has an experience itinerary entity per location) -> create experience pricing -> create experience availability (recurring schedules and specific date overrides which will create experienceschedule entities in the backend) -> create experience success (creates an experience entity) -> view experience details

### Experience Details Flow

create experience success -> view experience button -> experience details
OR
click into experience card component in home page / search page -> goes into a specific experience entity -> ExperienceDetailsPage -> tourist views details of experience which matches what the tour guide has created -> book now button -> check out flow

## Features Details

Itinerary Builder

- Visual timeline itinerary with Start/Stop/End indicators and drag-like functionality
- Mobile responsive following desktop-first approach
- Integrated with FormDataContext and proper validation

Itinerary Builder: Visual timeline with draggable stops, duration tracking, add/remove functionality
Availability System:

- Recurring weekly schedules
- Specific date overrides (available/blocked)
- Auto-generates 3 months of schedule records

## Schedule Generation System

The application now has a complete schedule generation system that converts
availability rules into concrete schedule records.

### Key Files

- `src/utils/scheduleGenerator.js` - Core schedule generation logic
- `src/pages/CreateExperienceAvailabilityPage.jsx` - Generates schedules on form
  submission
- `src/pages/ExperienceDetailsPage.jsx` - Displays generated schedules to tourists

## Usage

```javascript
import { generateScheduleRecords } from '../utils/scheduleGenerator';

const schedules = generateScheduleRecords(availabilityData, experienceDuration,
monthsAhead);


## Database architecture (partial, ones relevant to experience)

EXPERIENCE → EXPERIENCE_SCHEDULE → BOOKING
↓ ↓ ↓
EXPERIENCE_MEDIA TRIP_COHORT (links to users)
EXPERIENCE_ITINERARY

### EXPERIENCE

- experience_id: Long (PK)
- guide_id: Long (FK)
- title: String
- short_description: String
- full_description: String
- highlights: String
- category: ExperienceCategory (enum) (ENUM: 'guided_tour', 'daytrip', 'adventure', 'workshop', 'water_activity', 'others')
- tags: List
- cover_photo_url: String
- what_included: String
- important_info: String
- price: BigDecimal
- participants_allowed: Integer
- duration: BigDecimal
- location: String
- cancellation_policy: CancellationPolicy (enum) (ENUM: 'free_24h', 'free_48h', 'no_refund', 'custom')
- status: ExperienceStatus (enum) (ENUM: 'active', 'inactive', 'suspended')
- average_rating: BigDecimal
- total_reviews: Integer
- created_at: LocalDateTime
- updated_at: LocalDateTime

## Tech Stack

- **Frontend:** React, Vite, Tailwind, React Router, map library (Mapbox or Leaflet).
- **Backend (managed):** Springboot + PostgreSQL
- **Payments:** Stripe Checkout + Stripe Connect for host payouts.
- **Notifications & Analytics:** Resend (email), PostHog (product analytics), Sentry (errors).
- **Optional AI/ML:** lightweight content-based recommendations (optional), plus LLM-generated summaries/copy helper if desired.

## Folder Structure

├── backend/ # Java Spring Boot backend
│ ├── docker-compose.yml # Local service orchestration
│ ├── mvnw\* # Maven wrapper scripts
│ ├── pom.xml # Maven project file
│ ├── src/ # Java source code
│ └── target/ # Build artifacts (ignore)
│
├── frontend/ # React + Vite + Tailwind frontend
│ ├── eslint.config.js # Linting rules
│ ├── index.html # Entry HTML
│ ├── package.json # NPM dependencies
│ ├── public/ # Static assets
│ ├── src/ # React components, pages, hooks
│ ├── tailwind.config.js # Tailwind setup
│ └── vite.config.js # Vite bundler config
│
├── docs/ # Documentation
│ ├── changelog.md # Project change log
│ └── claude.md # AI assistant guide
│
└── README.md # Project overview

## Important Rules

1. Website that is mobile responsive. do not do it mobile first. We will always have a desktop layout and a mobile layout that should match each other
2. don't create components without asking me.
3. make sure we use footer/navbar/sidebar components created.
4. for colours, use the ones in index.css and don't change index.css without asking me. ideally we don't change it unless necessary.
5. figma designs should be followed as much as possible while maintaining mobile responsiveness and not mobile first approach.
6. validate required fields before progressing
7. .jsx instead of .tsx
8. use index.css as much as possible if necessary.
9. always check against the relevant database schema and backend files to see if it aligns with backend entities etc. make sure frontend -> backend and db integration works whenever u change the frontend.

## Good to know

1. authentication mock status rn

<!-- ==================== STYLING RULES SECTION - DELETE FROM HERE ==================== -->

## CreateExperience Flow Styling Rules

### Form Field Consistency Rules

1. **Universal Padding**: All form inputs (textareas, input fields, dropdowns) should have `style={{padding: '6px'}}` for consistent internal spacing

2. **Container Margins**: Use consistent `marginBottom` values:

 - Desktop: `style={{marginBottom: '15px'}}` for form sections
 - Mobile: `style={{marginBottom: '10px'}}` for form sections (except itinerary builder mobile which uses 15px)

3. **Tag/List Alignment**: For "What is included" lists:
 - Desktop ul: `style={{padding: '6px'}}`
 - Mobile ul: `style={{padding: '5px'}}`

### Itinerary Builder Specific Rules

4. **Container Padding**: Both desktop and mobile inner containers use `style={{padding: '10px'}}`

5. **Desktop Itinerary Styling**:

 - Input fonts: `text-lg font-semibold text-neutrals-1` for location, `text-sm text-neutrals-3` for time
 - Icons: `w-5 h-5` for MapPin, `w-4 h-4` for Clock
 - Add form inputs: `fontSize: '18px'` in inline styles

6. **Mobile Itinerary Styling**:
 - Match desktop font classes exactly: `text-lg font-semibold text-neutrals-1` for location
 - Icons: `w-4 h-4` for both MapPin and Clock
 - Add form: `margin: '16px 12px'` and `fontSize: '16px'` in inline styles
 - X button: `style={{marginRight: '8px'}}`

### Layout Consistency


8. **Inline Styles for Complex Components**: Use inline styles (not Tailwind) for itinerary builder add forms to ensure exact control and avoid conflicts

9. **Font Consistency**: Desktop and mobile versions of same components should use identical Tailwind font classes whenever possible

### Color Usage

10. **Stick to index.css Colors**: Use existing Tailwind classes (`text-neutrals-1`, `bg-primary-1`, etc.) that map to CSS variables defined in index.css. For inline styles, use standard colors like `#10b981` (green) and `#6b7280` (gray)
<!-- ==================== DELETE TO HERE TO REMOVE STYLING RULES ==================== -->
```

## API Design Patterns:

1. Use separate endpoints for related data instead of including everything in one
   response
2. Apply @JsonIgnore on entity relationships to prevent circular reference issues
3. Always validate and null-check form data before database operations
4. Use consistent field naming across frontend, API, and database layers

Error Handling:

1. Add proper error boundaries in React components
2. Include loading states for all async operations
3. Provide meaningful error messages to users
4. Log detailed errors for debugging
