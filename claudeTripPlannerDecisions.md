# AI Trip Planner - Implementation Decisions Log

## Document Purpose
This document tracks major implementation decisions made during the AI Trip Planner chatbot development. It serves as a reference for understanding why certain approaches were chosen and provides context for future modifications.

---

## Decision #1: System Prompt Structure Redesign
**Date**: 2025-11-07
**File**: `backend/src/main/java/com/backend/service/OpenAIService.java`
**Method**: `buildSystemPrompt(String context)`
**Lines**: 112-195

### Decision
Completely restructured the system prompt to provide explicit formatting instructions that match the expected output structure.

### Rationale
- **Previous approach**: Generic instructions with loose formatting guidelines
- **New approach**: Detailed, section-by-section formatting instructions with examples
- **Why**: OpenAI models perform better with explicit, structured prompts that show exactly what format is expected

### Key Components Added
1. **Title Format**: `[X] Days [Travel Style] [Theme] Exploration in [Destination]`
2. **Day Structure**: Clear Morning/Afternoon/Evening divisions
3. **Trippy Experience Marking**: Explicit `[TRIPPY EXPERIENCE]` tag to distinguish marketplace items
4. **Transportation Details**: Mandatory routing information between all activities
5. **Sections**: Transportation Options and Suggested Alternatives at the end

### Expected Behavior
- AI should prioritize Trippy experiences from the context
- Should fill gaps with general activities using OpenAI's knowledge
- Should provide realistic transportation details between activities
- Should structure output consistently across all generations

---

## Decision #2: Token Limit Increases
**Date**: 2025-11-07
**File**: `backend/src/main/java/com/backend/service/OpenAIService.java`

### Changes
- `generateChatResponse`: 500 → **3000 tokens** (line 64)
- `generateExperienceChatResponse`: 500 → **2000 tokens** (line 93)

### Rationale
- Multi-day itineraries require significantly more output space
- Detailed transportation information adds substantial content
- Transportation Options and Suggested Alternatives sections add more content
- Previous 500-token limit was insufficient for even a single day with proper detail

### Considerations
- **Cost**: Higher token limits increase API costs per request
- **Trade-off**: Accepted higher cost for complete, useful itineraries
- **Future optimization**: May need to implement streaming or pagination for very long trips (5+ days)

---

## Decision #3: Trippy-First Prioritization Strategy
**Date**: 2025-11-07
**File**: `backend/src/main/java/com/backend/service/OpenAIService.java`

### Approach
Prompt instructs AI to:
1. Use Trippy experiences as the **foundation** of the itinerary
2. Mark Trippy experiences explicitly with `[TRIPPY EXPERIENCE]` tag
3. Fill time gaps with general activities only when necessary
4. Always provide full details for both Trippy and general activities

### Rationale
- Aligns with SCENARIO 2 requirement: "Trippy-first prioritization"
- Makes it clear to users which experiences are bookable through Trippy
- Maintains useful itinerary even when limited Trippy experiences are available
- Provides consistent formatting regardless of experience source

---

## Decision #4: Transportation Detail Requirements
**Date**: 2025-11-07

### Approach
Prompt mandates detailed transportation between every activity:
- Full route information (e.g., "Take bus 520 from Red Fort to India Gate")
- Specific travel time (e.g., "15 minutes")
- Approximate price when available
- Mode of transport (bus/metro/taxi/walking)

### Rationale
- Real itineraries need practical logistics, not just activity lists
- Transportation time affects day scheduling and feasibility
- Costs are important for budget planning
- Aligns with the example output format provided

### Implementation Note
Relies on OpenAI's training data for transportation knowledge. For production, may want to integrate with:
- Google Maps API for real-time routing
- Local transportation APIs for schedules and pricing
- Distance matrix data (already available in system based on git history)

---

## Decision #5: Structured Output Sections
**Date**: 2025-11-07

### Sections Implemented
1. **Title & Introduction**: Set expectations and theme
2. **Day-by-Day Itinerary**: Core content with time-based structure
3. **Transportation Options**: Outbound journey information
4. **Suggested Alternatives**: 4-6 additional attractions

### Rationale
- Matches the example output format provided
- Provides complete travel planning information in one response
- Transportation Options helps users plan arrival timing
- Suggested Alternatives offers flexibility and backup options
- Structured format is easier to parse programmatically (future consideration for JSON extraction)

---

## Decision #6: Experience Format Standardization
**Date**: 2025-11-07

### Format for All Activities
```
[Experience Title] [TRIPPY EXPERIENCE] (if applicable)
[Start time] to [End time]
$[Price] per pax
[Detailed description]
```

### Rationale
- Consistent format makes output easier to parse and read
- Price visibility is critical for booking decisions
- Time ranges help users understand schedule feasibility
- Descriptions provide context for decision-making

---

## Decision #7: Context Handling Strategy
**Date**: 2025-11-07

### Approach
- When context provided: Prioritize Trippy experiences, fill gaps with general knowledge
- When no context: Provide general assistance and ask clarifying questions

### Rationale
- Flexible approach handles both scenarios (with/without Trippy experiences)
- Prevents hallucination of Trippy experiences when none are available
- Maintains conversational capability even without marketplace data
- Aligns with SCENARIO 2: fallback to general attractions when needed

---

## Future Considerations

### Not Yet Implemented (from requirements)
1. **Chat History/Threading** (SCENARIO 3)
   - Requires database schema for storing conversation threads
   - Need session management and thread retrieval logic

2. **Bulk Purchase/Book All** (SCENARIO 5)
   - Requires frontend UI components
   - Backend needs bulk checkout endpoint

3. **Resume/Regenerate Past Itineraries** (SCENARIO 6)
   - Depends on chat history implementation
   - Need context injection from previous sessions

4. **Mobile Responsiveness** (SCENARIO 4)
   - Frontend implementation
   - Card-style layout with expand/collapse

5. **Booked Experience Integration** (SCENARIO 1)
   - Need to pass user's booked experiences in context
   - Requires database query joining user bookings with experiences

### Technical Debt
- No input validation on token limits (max ~4096 for most models)
- No caching strategy for repeated destination queries
- No structured output parsing (currently plain text)
- No integration with real-time transportation APIs

### Performance Optimizations to Consider
- Implement response streaming for long itineraries
- Cache frequently requested destination information
- Consider using structured output (JSON mode) for easier parsing
- Batch context preparation to reduce processing time

---

## Related Documents
- [claudeTripPlanner.md](claudeTripPlanner.md) - Requirements documentation
- [OpenAIService.java](backend/src/main/java/com/backend/service/OpenAIService.java) - Implementation file
