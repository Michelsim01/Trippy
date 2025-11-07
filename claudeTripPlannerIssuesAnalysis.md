# AI Trip Planner - Issues Analysis & Solutions

**Date**: 2025-11-08
**Test Query**: "I want to travel to New Delhi, departing from Singapore for 3 days. Please help me design a detailed travel itinerary."

---

## Issue #1: Wrong Location - Singapore Experiences for New Delhi Query

### Problem
The chatbot returned Singapore experiences (Chinatown Food and Culture Walk) when the user explicitly requested experiences in New Delhi, India.

### Root Cause Analysis

#### 1. **No Location Filtering in Vector Search**

**Current Implementation** (`ItineraryChatbotService.java` lines 94-99):
```java
List<ExperienceKnowledgeBaseDocument> relevantExperiences =
    experienceKnowledgeBaseRepository.findSimilarDocuments(
        embeddingString,
        SIMILARITY_THRESHOLD,  // 1.5
        MAX_EXPERIENCES        // 10
    );
```

**SQL Query** (`ExperienceKnowledgeBaseRepository.java` lines 16-26):
```sql
SELECT * FROM experience_knowledge_base
WHERE embedding <=> CAST(:queryEmbedding AS vector) < :threshold
ORDER BY embedding <=> CAST(:queryEmbedding AS vector)
LIMIT :limit
```

**The Problem**:
- Query searches **globally** across ALL experiences in the database
- No WHERE clause filtering by location/country
- Relies 100% on semantic similarity
- If experiences in Singapore have higher semantic similarity scores than experiences in Delhi, they get returned

#### 2. **Semantic Similarity Alone is Insufficient**

**User Query**: "I want to travel to New Delhi, departing from Singapore for 3 days."

**What Gets Embedded**: The entire query text
- "travel to New Delhi" - contains destination
- "departing from Singapore" - contains origin (NOT destination!)

**Why Singapore Experiences Match**:
- The word "Singapore" appears in the query (as departure city)
- Without explicit location filtering, semantic similarity can match origin instead of destination
- Singapore experiences might be:
  - More popular (higher intelligence scores)
  - Better documented (richer content text)
  - More frequently searched (better embedding alignment)

#### 3. **Similarity Threshold Too Permissive**

**Constants** (`ItineraryChatbotService.java` line 45):
```java
private static final double SIMILARITY_THRESHOLD = 1.5;
```

**Pgvector Cosine Distance**:
- Range: 0 (identical) to 2 (opposite)
- Threshold of 1.5 is very permissive
- Allows experiences with only ~25% similarity

**Compare to Config** (`application.properties` line 51):
```properties
chatbot.similarity.threshold=0.7  # Much stricter!
```

**Note**: The config value (0.7) is NOT being used by ItineraryChatbotService!
- ExperienceChatbotService uses config values
- ItineraryChatbotService uses hardcoded values

---

## Issue #2: Dates Not Rendering - Shows "[Insert Date]"

### Problem
Instead of actual dates like "January 15, 2025", the output shows placeholder text: "[Insert Date]"

### Root Cause Analysis

#### 1. **Availability Data Not Linked to Experiences**

**Current Context Format** (`ItineraryChatbotService.java` lines 227-256):
```
=== AVAILABILITY (Next 30 Days) ===

Experience #1:
- Available on 28 days in next 30 days
- Best dates (low demand): 2025-11-10, 2025-11-12, 2025-11-15

Experience #2:
- Available on 25 days in next 30 days
- Best dates (low demand): 2025-11-11, 2025-11-14, 2025-11-16
```

**The Problem**:
- Availability is organized by Experience ID number (e.g., "Experience #1")
- Experience content has name and details but no ID cross-reference
- LLM cannot map "Chinatown Food Walk" → "Experience #1"
- Cannot determine which dates correspond to which experience

#### 2. **No User Travel Date Extraction**

**User Query**: "...for 3 days..."

**Current Processing**:
- Entire query embedded as-is
- No parsing of "3 days" duration
- No extraction of start date (not provided by user)
- No calculation of trip date range

**LLM's Challenge**:
- Told to "assign specific dates"
- Given availability like "2025-11-10, 2025-11-12"
- Given trip duration "3 days"
- No information about when user wants to travel!
- Falls back to placeholder: "[Insert Date]"

#### 3. **Insufficient Date Instructions in Prompt**

**Current Prompt** (`OpenAIService.java` lines 127, 149, 176):
```java
prompt.append("Date: [Specific date, e.g., January 15, 2025]\\n");
prompt.append("- Include specific date for the experience...\\n");
prompt.append("- Assign specific dates to each day and experience...\\n");
```

**The Problem**:
- Instructions tell AI to assign dates
- But no information provided about:
  - When user's trip starts
  - Which dates correspond to which experiences
  - How to map experience IDs to availability data

#### 4. **Context Doesn't Include Date Cross-Reference**

**What's Missing**:
```
=== AVAILABLE EXPERIENCES ===

Chinatown Food and Culture Walk (Experience ID: 1)
Category: FOOD
Location: Singapore, Singapore
...

[Later in context]

=== AVAILABILITY (Next 30 Days) ===

Experience #1 (Chinatown Food and Culture Walk):
- Available on 28 days in next 30 days
- Best dates: 2025-11-10, 2025-11-12, 2025-11-15
```

Currently there's NO linkage between experience name and availability data!

---

## Solutions

### Solution #1: Add Location-Based Filtering (HIGH PRIORITY)

#### Approach A: Hybrid Search with Metadata Filtering (Recommended)

**Step 1**: Extract destination from user query

Create `QueryParser.java`:
```java
public class QueryParams {
    private String destination;
    private String departureCity;
    private Integer tripDuration;
    private BigDecimal maxBudget;
    private LocalDate startDate;

    // Getters and setters
}

public class QueryParser {
    public static QueryParams parse(String userMessage) {
        QueryParams params = new QueryParams();

        // Extract destination
        // Pattern: "travel to [DESTINATION]"
        Pattern destPattern = Pattern.compile(
            "travel to ([A-Za-z\\s]+?)(?:,|\\.|for|departing)",
            Pattern.CASE_INSENSITIVE
        );
        Matcher destMatcher = destPattern.matcher(userMessage);
        if (destMatcher.find()) {
            params.setDestination(destMatcher.group(1).trim());
        }

        // Extract departure city
        // Pattern: "departing from [CITY]"
        Pattern departurePattern = Pattern.compile(
            "departing from ([A-Za-z\\s]+?)(?:\\.|for|,)",
            Pattern.CASE_INSENSITIVE
        );
        Matcher departureMatcher = departurePattern.matcher(userMessage);
        if (departureMatcher.find()) {
            params.setDepartureCity(departureMatcher.group(1).trim());
        }

        // Extract duration
        // Pattern: "for [X] days"
        Pattern durationPattern = Pattern.compile(
            "for (\\d+) days?",
            Pattern.CASE_INSENSITIVE
        );
        Matcher durationMatcher = durationPattern.matcher(userMessage);
        if (durationMatcher.find()) {
            params.setTripDuration(Integer.parseInt(durationMatcher.group(1)));
        }

        // Extract budget (optional)
        // Pattern: "budget $[X]" or "under $[X]"
        Pattern budgetPattern = Pattern.compile(
            "(?:budget|under)\\s*\\$?([\\d,]+)",
            Pattern.CASE_INSENSITIVE
        );
        Matcher budgetMatcher = budgetPattern.matcher(userMessage);
        if (budgetMatcher.find()) {
            String budgetStr = budgetMatcher.group(1).replaceAll(",", "");
            params.setMaxBudget(new BigDecimal(budgetStr));
        }

        // Extract start date (optional)
        // Pattern: "starting [date]" or "from [date]"
        // Examples: "starting January 15", "from Dec 20", "on 2025-01-15"
        Pattern datePattern = Pattern.compile(
            "(?:starting|from|on)\\s+([A-Za-z]+\\s+\\d{1,2}(?:,?\\s+\\d{4})?|\\d{4}-\\d{2}-\\d{2})",
            Pattern.CASE_INSENSITIVE
        );
        Matcher dateMatcher = datePattern.matcher(userMessage);
        if (dateMatcher.find()) {
            String dateStr = dateMatcher.group(1).trim();
            try {
                // Try parsing common date formats
                if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
                    params.setStartDate(LocalDate.parse(dateStr));
                } else {
                    // Handle formats like "January 15, 2025" or "Jan 15"
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMMM d[, yyyy]");
                    params.setStartDate(LocalDate.parse(dateStr, formatter));
                }
            } catch (Exception e) {
                // If parsing fails, leave startDate as null (will use default)
            }
        }

        return params;
    }
}
```

**Step 2**: Add location-based query to repository

Update `ExperienceKnowledgeBaseRepository.java`:
```java
@Query(value = """
    SELECT * FROM experience_knowledge_base
    WHERE embedding <=> CAST(:queryEmbedding AS vector) < :threshold
    AND (
        metadata->>'country' ILIKE :location
        OR metadata->>'location' ILIKE :location
    )
    ORDER BY embedding <=> CAST(:queryEmbedding AS vector)
    LIMIT :limit
    """, nativeQuery = true)
List<ExperienceKnowledgeBaseDocument> findSimilarDocumentsByLocation(
    @Param("queryEmbedding") String queryEmbedding,
    @Param("location") String location,
    @Param("threshold") Double threshold,
    @Param("limit") Integer limit
);
```

**Step 3**: Update ItineraryChatbotService

```java
private String buildItineraryContext(String userMessage) {
    // Parse query to extract structured parameters
    QueryParams params = QueryParser.parse(userMessage);

    // Generate embedding
    List<Double> embedding = openAIService.generateEmbedding(userMessage);
    String embeddingString = convertEmbeddingToString(embedding);

    // Search with location filter if destination is found
    List<ExperienceKnowledgeBaseDocument> relevantExperiences;
    if (params.getDestination() != null && !params.getDestination().isEmpty()) {
        String location = "%" + params.getDestination() + "%";
        relevantExperiences = experienceKnowledgeBaseRepository
            .findSimilarDocumentsByLocation(
                embeddingString,
                location,
                SIMILARITY_THRESHOLD,
                MAX_EXPERIENCES
            );

        logger.info("Filtered by location: {}", params.getDestination());
    } else {
        // Fallback to global search
        relevantExperiences = experienceKnowledgeBaseRepository
            .findSimilarDocuments(
                embeddingString,
                SIMILARITY_THRESHOLD,
                MAX_EXPERIENCES
            );
    }

    // Continue with rest of context building...
}
```

#### Approach B: Post-Retrieval Filtering (Quick Fix)

```java
// After getting relevantExperiences
QueryParams params = QueryParser.parse(userMessage);

if (params.getDestination() != null) {
    String destination = params.getDestination().toLowerCase();

    // Filter experiences by location
    relevantExperiences = relevantExperiences.stream()
        .filter(exp -> {
            try {
                JSONObject metadata = new JSONObject(exp.getMetadata());
                String country = metadata.optString("country", "").toLowerCase();
                String location = metadata.optString("location", "").toLowerCase();

                return country.contains(destination) || location.contains(destination);
            } catch (Exception e) {
                return false;
            }
        })
        .collect(Collectors.toList());

    logger.info("Filtered to {} experiences in {}",
        relevantExperiences.size(), params.getDestination());
}
```

---

### Solution #2: Fix Date Rendering (HIGH PRIORITY)

#### Part A: Link Experience Names to IDs in Context

Update `buildItineraryContext` in `ItineraryChatbotService.java`:

```java
// Add available experiences with ID cross-reference
context.append("=== AVAILABLE EXPERIENCES ===\n\n");

// Create a map of experience IDs to names for later reference
Map<Long, String> experienceIdToName = new HashMap<>();

for (ExperienceKnowledgeBaseDocument exp : relevantExperiences) {
    Long expId = exp.getSourceExperienceId();
    String expName = exp.getTitle();

    if (expId != null && expName != null) {
        experienceIdToName.put(expId, expName);
    }

    // Include Experience ID in the content
    context.append(String.format("[Experience ID: %d]\n", expId));
    context.append(exp.getContentText()).append("\n\n");
}

// ... routing section ...

// Add availability with name cross-reference
if (!availabilities.isEmpty()) {
    context.append("=== AVAILABILITY (Next 30 Days) ===\n\n");
    Map<Long, List<ItineraryAvailabilityIndex>> availByExperience =
        availabilities.stream()
            .collect(Collectors.groupingBy(
                ItineraryAvailabilityIndex::getExperienceId
            ));

    for (Map.Entry<Long, List<ItineraryAvailabilityIndex>> entry : availByExperience.entrySet()) {
        Long expId = entry.getKey();
        String expName = experienceIdToName.getOrDefault(expId, "Unknown");

        // Format with both ID and name
        context.append(String.format("%s (Experience ID: %d):\n", expName, expId));

        // List best dates more explicitly
        List<LocalDate> bestDates = entry.getValue().stream()
            .filter(a -> a.getAvailableSchedulesCount() > 0)
            .filter(a -> a.getBookingPressure() != null &&
                        a.getBookingPressure().doubleValue() < 50.0)
            .sorted(Comparator.comparing(ItineraryAvailabilityIndex::getBookingPressure))
            .limit(5)
            .map(ItineraryAvailabilityIndex::getScheduleDate)
            .collect(Collectors.toList());

        if (!bestDates.isEmpty()) {
            context.append("Available dates: ");
            context.append(bestDates.stream()
                .map(date -> date.format(DateTimeFormatter.ofPattern("MMMM d, yyyy")))
                .collect(Collectors.joining(", ")));
            context.append("\n\n");
        } else {
            context.append("Limited availability - check specific schedules\n\n");
        }
    }
}
```

#### Part B: Calculate Default Trip Dates

```java
private String buildItineraryContext(String userMessage) {
    // Parse query
    QueryParams params = QueryParser.parse(userMessage);

    // ... existing embedding and search logic ...

    // Calculate trip date range from user-provided start date
    LocalDate tripStartDate;
    if (params.getStartDate() != null) {
        tripStartDate = params.getStartDate();
    } else {
        // Default: start 7 days from now (reasonable booking lead time)
        tripStartDate = LocalDate.now().plusDays(7);
    }

    LocalDate tripEndDate;
    if (params.getTripDuration() != null) {
        tripEndDate = tripStartDate.plusDays(params.getTripDuration());
    } else {
        // Default: 3 days
        tripEndDate = tripStartDate.plusDays(3);
    }

    // ... build context ...

    // Add trip dates to context
    context.append("=== USER TRIP DETAILS ===\n");
    context.append(String.format("Trip Start Date: %s\n",
        tripStartDate.format(DateTimeFormatter.ofPattern("MMMM d, yyyy"))));
    context.append(String.format("Trip End Date: %s\n",
        tripEndDate.format(DateTimeFormatter.ofPattern("MMMM d, yyyy"))));
    context.append(String.format("Duration: %d days\n",
        params.getTripDuration() != null ? params.getTripDuration() : 3));
    if (params.getDestination() != null) {
        context.append(String.format("Destination: %s\n", params.getDestination()));
    }
    context.append("\n");
}
```

#### Part C: Enhance Prompt Instructions

Update `OpenAIService.buildSystemPrompt`:

```java
prompt.append("DATE ASSIGNMENT INSTRUCTIONS:\\n");
prompt.append("- The USER TRIP DETAILS section specifies the trip start date and duration\\n");
prompt.append("- Assign Day 1 to the trip start date, Day 2 to start date + 1, etc.\\n");
prompt.append("- For each Trippy experience, use the available dates listed in the AVAILABILITY section\\n");
prompt.append("- Match experience names to their availability data using Experience IDs\\n");
prompt.append("- If an experience is not available on the required day, either:\\n");
prompt.append("  1. Rearrange days to match availability, OR\\n");
prompt.append("  2. Select a different experience that is available\\n");
prompt.append("- NEVER use placeholder dates like '[Insert Date]' - always use specific dates\\n\\n");
```

---

### Solution #3: Use Configuration Values (MEDIUM PRIORITY)

**Current Issue**: Hardcoded thresholds in `ItineraryChatbotService` ignore configuration.

**Fix**:
```java
@Service
@Transactional
public class ItineraryChatbotService {

    @Value("${chatbot.max.results}")
    private Integer maxExperiences;  // Use from config: 5

    @Value("${chatbot.similarity.threshold}")
    private Double similarityThreshold;  // Use from config: 0.7

    @Value("${chatbot.max.context.length}")
    private Integer maxContextLength;  // Use from config: 10 (seems low - should be 8000?)

    // Remove hardcoded constants
    // private static final int MAX_EXPERIENCES = 10;  // DELETE
    // private static final double SIMILARITY_THRESHOLD = 1.5;  // DELETE
```

**Update application.properties**:
```properties
# Chatbot Configuration
chatbot.max.context.length=8000  # Character limit, not results count
chatbot.similarity.threshold=0.7  # Cosine distance threshold
chatbot.max.results=10  # Max experiences to retrieve
```

---

### Solution #4: Improve Semantic Search Quality (LONG-TERM)

#### Option A: Query Rewriting

Before embedding, rewrite query to emphasize destination:
```java
String enhancedQuery = rewriteQueryForDestination(userMessage, params);
// "Experiences in New Delhi, India"

List<Double> embedding = openAIService.generateEmbedding(enhancedQuery);
```

#### Option B: Multi-Query Approach

Search with both full query and destination-only:
```java
// Query 1: Full semantic search
List<Double> fullEmbedding = openAIService.generateEmbedding(userMessage);

// Query 2: Destination-focused only
String focusedQuery = "experiences in " + params.getDestination();
List<Double> focusedEmbedding = openAIService.generateEmbedding(focusedQuery);

// Merge results, prioritizing destination-focused matches
```

#### Option C: Weighted Metadata Boost

Modify scoring to boost experiences where metadata matches:
```sql
SELECT *,
    CASE
        WHEN metadata->>'country' ILIKE :destination THEN 0.5
        ELSE 0.0
    END AS location_boost,
    (embedding <=> CAST(:queryEmbedding AS vector)) AS similarity_score
FROM experience_knowledge_base
WHERE embedding <=> CAST(:queryEmbedding AS vector) < :threshold
ORDER BY (similarity_score - location_boost)  -- Boost reduces effective distance
LIMIT :limit
```

---

## Implementation Priority

### CRITICAL (Fix Immediately)
1. ✅ **Add location filtering** (Solution #1, Approach B - Quick Fix)
2. ✅ **Link experience names to availability** (Solution #2, Part A)
3. ✅ **Calculate default trip dates** (Solution #2, Part B)

### HIGH (Fix This Week)
4. ⚠️ **Enhance date instructions in prompt** (Solution #2, Part C)
5. ⚠️ **Use configuration values** (Solution #3)
6. ⚠️ **Implement query parser** (Solution #1, Approach A - Step 1)

### MEDIUM (Fix Next Sprint)
7. ⏳ **Hybrid search with SQL filtering** (Solution #1, Approach A - Steps 2-3)
8. ⏳ **Query rewriting for better semantic search** (Solution #4, Option A)

### LOW (Future Enhancement)
9. 🔮 **Multi-query approach** (Solution #4, Option B)
10. 🔮 **Weighted metadata boost** (Solution #4, Option C)

---

## Testing Checklist

After implementing fixes, test with:

### Test Case 1: Clear Destination
```
Query: "I want to travel to New Delhi, departing from Singapore for 3 days."
Expected: Only New Delhi experiences
Expected: Dates like "January 15, 2025" (not placeholders)
```

### Test Case 2: Ambiguous Destination
```
Query: "Plan a trip for 5 days"
Expected: Ask for destination clarification
```

### Test Case 3: Multiple Destinations
```
Query: "I want to visit Tokyo and Kyoto for 7 days"
Expected: Experiences from both cities
Expected: Logical day-by-day sequencing
```

### Test Case 4: Budget Filtering
```
Query: "Budget-friendly experiences in Bangkok for 3 days"
Expected: Lower-priced experiences prioritized
```

### Test Case 5: Date Availability
```
Query: "Trip to Singapore next week, 2 days"
Expected: Only experiences available next week
Expected: Actual dates from next week
```

---

## Summary

### Root Causes Identified

1. **Location Issue**: No geographic filtering in vector search; Singapore in departure city confused the semantic matching
2. **Date Issue**: No linkage between experience names and availability data; no trip start date extraction; insufficient LLM guidance

### Impact

- **User Experience**: Poor - shows wrong location, unusable dates
- **Booking Conversion**: Zero - users cannot book with wrong location/dates
- **Trust**: Damaged - appears broken and unreliable

### Solutions Proposed

- Short-term: Post-retrieval location filtering, availability name linkage, default date calculation
- Medium-term: Query parsing, hybrid SQL+vector search, config usage
- Long-term: Query rewriting, multi-query approach, metadata boosting

### Estimated Effort

- Critical fixes: 4-6 hours
- High priority fixes: 8-12 hours
- Medium priority: 16-20 hours
- Low priority: 24-32 hours

**Total**: 52-70 hours (1.5-2 weeks for one developer)

---

## Related Documents
- [claudeTripPlanner.md](claudeTripPlanner.md) - Requirements
- [claudeTripPlannerImplementation.md](claudeTripPlannerImplementation.md) - RAG analysis
- [claudeTripPlannerDecisions.md](claudeTripPlannerDecisions.md) - Implementation decisions
