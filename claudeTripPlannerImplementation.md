# AI Trip Planner - RAG Implementation Analysis

## Document Purpose
This document provides a comprehensive analysis of the current RAG (Retrieval-Augmented Generation) implementation for the AI Trip Planner chatbot. It examines how the system retrieves experiences, builds context, and handles user preferences.

**Investigation Date**: 2025-11-07

---

## Architecture Overview

The trip planner uses a sophisticated RAG system with the following components:

1. **Knowledge Base Creation** (`data-pipeline/airflow/dags/experience_knowledge_base.py`)
2. **Vector Similarity Search** (`ExperienceKnowledgeBaseRepository.java`)
3. **Context Building** (`ItineraryChatbotService.java`)
4. **LLM Generation** (`OpenAIService.java`)

---

## Component 1: Knowledge Base Population

**File**: `data-pipeline/airflow/dags/experience_knowledge_base.py`
**Frequency**: Every 24 hours (with full refresh on Mondays)

### What Data is Indexed

Each experience is transformed into a rich knowledge document containing:

#### Basic Information
- Title, category, location, country
- Duration, price, max participants
- Average rating and total reviews
- Short and full descriptions
- Highlights

#### Intelligence Layer
- Popularity score (0-100)
- Sentiment score with human-readable labels:
  - "very positive (customers love it!)" (0.5-1.0)
  - "positive (customers recommend it)" (0.2-0.49)
  - "mildly positive (generally good feedback)" (0.1-0.19)
  - "neutral (mixed reviews)" (-0.1-0.1)
  - "mildly negative (some disappointment)" (-0.11 to -0.19)
  - "negative (not recommended by customers)" (-0.2 to -0.49)
  - "very negative (poor customer experience)" (-0.5 to -1.0)
- Recommendation weight (0-100)
- Content completeness score

#### User Analytics
- Popular with specific user clusters (User Group 0-3)
- Average ratings from each cluster
- Cluster-specific review counts (minimum 2 reviews per cluster)

#### Social Proof
- Recent customer feedback (top 3 reviews)
- Similar experience recommendations (top 3)
- Guide information (first name, last name)

#### Tags & Categorization
- Experience tags (multiple per experience)
- Category classification (FOOD, CULTURAL, ADVENTURE, NATURE, etc.)

### Example Content Structure

```
Singapore Street Food Tour

Category: FOOD
Location: Singapore, Singapore
Duration: 3.0 hours
Price: $45.00
Rating: 4.5/5 (23 reviews)
Max Participants: 8

Description: Explore authentic hawker centers...

Full Experience: Discover the vibrant street food scene...

Highlights: Authentic local cuisine, experienced guide...

Guide: John Tan

Tags: street food, local cuisine, cultural, evening

Experience Insights:
- Popularity Score: 78.5/100
- Customer Sentiment: very positive (customers love it!)
- Recommendation Strength: 82.3/100
- Popular with: User Group 2 (avg rating: 4.7)

Recent Customer Feedback:
- "Amazing food tour! The guide was knowledgeable..."
- "Best hawker center experience ever..."
- "Loved trying all the different dishes..."

Similar Experiences You Might Like:
- Chinatown Food Walk
- Night Market Food Tour
- Asian Cuisine Cooking Class
```

### Embedding Generation

- **Model**: OpenAI's text-embedding-3-small or text-embedding-ada-002
- **Dimensions**: 1536-dimensional vectors
- **Storage**: PostgreSQL with pgvector extension (`vector(1536)` column type)
- **Purpose**: Embeddings capture semantic meaning of entire document (not just title)

---

## Component 2: Semantic Search & Retrieval

**File**: `ItineraryChatbotService.java` (lines 80-181)
**Repository**: `ExperienceKnowledgeBaseRepository.java`

### Search Process

#### Step 1: User Query Embedding (line 85)
```java
List<Double> embedding = openAIService.generateEmbedding(userMessage);
```
- User's entire message converted to 1536-dimensional vector
- Uses same OpenAI embedding model as knowledge base
- Captures semantic intent of the query

#### Step 2: Vector Similarity Search (lines 94-99)
```java
List<ExperienceKnowledgeBaseDocument> relevantExperiences =
    experienceKnowledgeBaseRepository.findSimilarDocuments(
        embeddingString,
        SIMILARITY_THRESHOLD,  // 1.5
        MAX_EXPERIENCES        // 10
    );
```

**PostgreSQL Query**:
```sql
SELECT * FROM experience_knowledge_base
WHERE embedding <=> CAST(:queryEmbedding AS vector) < :threshold
ORDER BY embedding <=> CAST(:queryEmbedding AS vector)
LIMIT :limit
```

**Parameters**:
- **Operator**: `<=>` (cosine distance in pgvector)
- **Threshold**: `1.5` (configurable)
- **Limit**: `10` experiences maximum
- **Ordering**: By similarity (closest/most relevant first)

#### Step 3: Additional Data Enrichment (lines 117-131)

##### A. Routing Data (`ItineraryDistanceMatrix`)
For each pair of experiences, the system retrieves:

**Driving**:
- Distance in kilometers
- Travel time in minutes

**Public Transit**:
- Distance in kilometers
- Travel time in minutes
- Availability (boolean)

**Walking**:
- Distance in kilometers
- Travel time in minutes
- Feasibility (boolean)

**Metadata**:
- Country
- Straight-line distance
- Recommended mode of transport

##### B. Availability Data (`ItineraryAvailabilityIndex`)
For next 30 days:
- Available schedules count per day
- Booking pressure (demand indicator, 0-100)
- Best dates (low booking pressure < 50)

---

## Component 3: Context Assembly

**File**: `ItineraryChatbotService.java` (lines 134-175)

### Context Structure

The final context passed to OpenAI contains multiple sections:

#### Section 1: System Instructions
```
=== ITINERARY PLANNING CONTEXT ===

You are Trippy's AI Trip Planner. Your role is to:
- Create personalized day-by-day itineraries
- Consider travel time and transportation between activities
- Check availability and suggest optimal dates
- Balance experience variety and proximity
- Provide practical travel tips and recommendations
```

#### Section 2: Available Experiences
```
=== AVAILABLE EXPERIENCES ===

[Full content from up to 10 most relevant experiences]
[Each contains: title, description, price, ratings, sentiment,
 tags, reviews, guide info, cluster preferences]
```

#### Section 3: Transportation & Routing
```
=== TRANSPORTATION & ROUTING ===

Route: Experience #1 → Experience #2
Location: Singapore
Distance: 5.2 km (straight-line)
🚗 Driving: 5.8 km, 15 minutes
🚇 Public Transit: 6.2 km, 22 minutes
🚶 Walking: 5.5 km, 68 minutes
Recommended: Driving

[Repeated for all experience pairs]
```

#### Section 4: Availability Information
```
=== AVAILABILITY (Next 30 Days) ===

Experience #1:
- Available on 28 days in next 30 days
- Best dates (low demand): 2025-11-10, 2025-11-12, 2025-11-15

Experience #2:
- Available on 25 days in next 30 days
- Best dates (low demand): 2025-11-11, 2025-11-14, 2025-11-16

[Repeated for all experiences]
```

### Context Limits
- **Max length**: 8000 characters
- **Truncation**: If exceeded, truncated with "...(context truncated)" notice
- **Rationale**: Balance between comprehensive context and token efficiency

---

## Preference Matching Analysis

### Question: Does it understand "vibe"?

**Answer: YES - Implicitly through semantic search**

#### How It Works:
1. **User Query**: "romantic sunset experience in Bali"
2. **Embedding**: Captures semantic meaning including "romantic" context
3. **Knowledge Base**: Contains descriptions with words like:
   - "intimate setting"
   - "perfect for couples"
   - "romantic atmosphere"
   - "sunset views"
4. **Vector Similarity**: Finds experiences with matching semantic meaning
5. **Result**: Returns experiences that match the romantic vibe

#### Additional Vibe Indicators:
- **Sentiment labels**: "very positive (customers love it!)"
- **Review feedback**: Actual customer comments about atmosphere
- **Tags**: May include mood-related tags
- **Cluster preferences**: Shows what similar users enjoyed

#### Limitations:
- No explicit "vibe" or "mood" taxonomy
- Relies on semantic similarity in descriptions
- May miss nuanced vibes not explicitly described

---

### Question: Does it understand budget?

**Answer: PARTIALLY**

#### What Works:
1. **Price in Context**: Every experience includes price
   ```
   Price: $45.00
   ```

2. **Metadata Storage**: Price stored as numeric value
   ```json
   {"price": 45.00}
   ```

3. **Semantic Matching**: Queries with budget terms work
   - "affordable food tour" → finds lower-priced options
   - "luxury experience" → finds higher-priced experiences
   - "budget-friendly activities" → semantic similarity matches

4. **LLM Interpretation**: OpenAI can filter by price in context
   - Can sort by price
   - Can exclude expensive options
   - Can suggest alternatives in budget range

#### Limitations:
1. **No Explicit Filtering**: Vector search doesn't filter by price
2. **No Hard Constraints**: May return experiences outside budget
3. **Inconsistent Results**: Depends on LLM correctly interpreting budget
4. **No Currency Conversion**: Assumes single currency

#### Example Issue:
```
User: "Show me experiences under $30"
System: Retrieves 10 most semantically similar experiences
Result: May include experiences priced at $50, $75, $100
Relies on LLM to filter these out in final response
```

---

### Question: Does it understand theme (Cultural, Adventure, Food)?

**Answer: YES - Multiple layers**

#### Layer 1: Category Field (Explicit)
- **Database Field**: `category` (enum)
- **Values**: FOOD, CULTURAL, ADVENTURE, NATURE, HISTORICAL, SPORTS, etc.
- **Stored in**: Metadata JSON
- **Usage**: Can be filtered explicitly

#### Layer 2: Tags (Explicit)
- **Multiple tags** per experience
- **Examples**: "street food", "historical", "water sports", "temples", "museums"
- **Storage**: Array of strings
- **Visible in**: Knowledge base content text

#### Layer 3: Content Descriptions (Semantic)
- **Full text** descriptions capture theme implicitly
- **Highlights** emphasize key themes
- **Examples**:
  - Cultural: "explore ancient temples", "traditional ceremonies"
  - Adventure: "thrilling zipline", "rock climbing", "white water rafting"
  - Food: "authentic local cuisine", "street food markets"

#### Layer 4: Semantic Similarity (Implicit)
- **Query**: "cultural experiences in Delhi"
  - **Finds**: temples, museums, heritage sites, traditional crafts
- **Query**: "adventure activities in Bali"
  - **Finds**: surfing, hiking, paragliding, diving
- **Query**: "food experiences in Tokyo"
  - **Finds**: sushi classes, food tours, cooking workshops

#### Effectiveness:
**High** - Theme matching works well because:
1. Category provides explicit classification
2. Tags add granularity
3. Descriptions contain theme-rich vocabulary
4. Vector embeddings capture thematic concepts
5. Multiple signals reinforce each other

---

## Strengths of Current Implementation

### 1. Rich Context
- Experiences include sentiment, popularity, reviews, cluster preferences
- Multi-dimensional understanding of each experience
- Social proof through customer feedback

### 2. Real Transportation Data
- Actual distances and times between experiences
- Multiple transport modes (driving, transit, walking)
- Recommended transport mode
- Enables realistic itinerary planning

### 3. Availability Awareness
- Knows which dates are bookable
- Identifies low-demand dates (better availability)
- 30-day lookahead window

### 4. Semantic Understanding
- Vector search finds conceptually similar experiences
- Goes beyond keyword matching
- Understands context and intent

### 5. Multi-source Intelligence
- Combines experience data, reviews, user analytics
- Intelligence scores (popularity, sentiment, recommendation)
- User cluster preferences

### 6. Social Proof
- Shows what similar users enjoyed
- Recent customer feedback
- Cluster-specific ratings

### 7. Scalability
- PostgreSQL pgvector handles large datasets efficiently
- Incremental updates (daily pipeline)
- Full refresh weekly (Mondays)

---

## Limitations & Areas for Improvement

### 1. No Explicit Filtering

**Issue**: Vector search returns top-k similar experiences without hard constraints

**Impact**:
- Budget queries may return experiences outside budget range
- Family-specific requests might include adult-only activities
- Duration constraints not strictly enforced
- Location may not be exact match

**Example**:
```
User: "3-hour experiences under $50 in Singapore"
Current: Returns 10 most similar, may include $80, 5-hour experiences
Desired: Only experiences that match ALL criteria
```

**Recommendation**: Add post-retrieval filtering or hybrid search
```sql
SELECT * FROM experience_knowledge_base
WHERE embedding <=> :query_embedding < :threshold
  AND (metadata->>'price')::numeric <= :budget
  AND (metadata->>'duration')::numeric <= :max_duration
  AND metadata->>'country' = :destination
ORDER BY embedding <=> :query_embedding
LIMIT 10
```

---

### 2. Limited Query Understanding

**Issue**: User query converted directly to embedding without preprocessing

**Example User Query**:
```
I want to travel to New Delhi, departing from Singapore.
for 3 days. Family, I'm interested in Cultural.
Please help me design a detailed travel itinerary.
```

**What Gets Embedded**: The entire query (all text)
**What's Useful for Filtering**:
- Destination: "New Delhi"
- Duration: "3 days"
- Travel style: "Family"
- Theme: "Cultural"

**Problem**: These structured parameters are lost in semantic embedding

**Recommendation**: Extract structured parameters first
```java
QueryParams params = parseQuery(userMessage);
// params.destination = "New Delhi"
// params.duration = 3
// params.travelStyle = "Family"
// params.theme = "Cultural"

// Use params for SQL filtering
// Use theme for semantic search
```

---

### 3. No User Preference Learning

**Issue**: Doesn't use user's past bookings or preferences

**Current State**:
- Each query treated independently
- No personalization based on history
- Doesn't know user's preferred price range, categories, etc.

**Impact**:
- Suggests experiences user may not like
- Misses opportunities for personalization
- Can't leverage "users like you enjoyed..." patterns

**Recommendation**:
```java
// Get user's booking history
List<Experience> pastBookings = bookingRepository.findByUserId(userId);

// Analyze preferences
Map<String, Double> categoryPrefs = analyzeCategories(pastBookings);
// {"FOOD": 0.6, "CULTURAL": 0.3, "ADVENTURE": 0.1}

// Boost similar experiences in results
// Include preferred categories in context
```

---

### 4. Vibe/Theme Matching is Implicit

**Issue**: Relies entirely on semantic similarity for "vibe" matching

**Current State**:
- "Romantic experience" → hopes vector similarity finds romantic content
- Works reasonably well but not guaranteed
- No explicit vibe/mood classification

**Example Limitation**:
```
User: "relaxing, peaceful experience"
Current: Depends on descriptions containing these words
May return: Active experiences if descriptions are similar
```

**Recommendation**: Add explicit vibe/mood taxonomy
```json
{
  "vibes": ["romantic", "relaxing", "adventurous", "educational"],
  "intensity": "low/medium/high",
  "pace": "slow/moderate/fast"
}
```

---

### 5. Transportation Data Underutilized

**Issue**: Distance matrix exists but not used for intelligent sequencing

**Current State**:
- Provides routing info in context
- LLM must figure out optimal sequence
- No pre-computation of efficient routes

**Impact**:
- May suggest geographically scattered experiences
- Inefficient travel time
- Poor day structure

**Example**:
```
Day 1 suggested:
9am: North Singapore (Experience A)
12pm: South Singapore (Experience B) - 45 min drive
3pm: North Singapore (Experience C) - 50 min drive
6pm: South Singapore (Experience D) - 40 min drive

Total travel time: 2h 15min (wasted)
```

**Recommendation**: Pre-compute optimal sequences
```java
// Cluster experiences by geography
List<ExperienceCluster> clusters = clusterByLocation(experiences);

// Use traveling salesman algorithm
List<Experience> optimizedRoute = optimizeRoute(cluster, startPoint);

// Consider:
// - Travel time minimization
// - Opening hours compatibility
// - Meal time breaks
// - Experience durations
```

---

### 6. Availability Not Strictly Enforced

**Issue**: Availability shown in context but LLM may ignore or misinterpret

**Current State**:
- Availability data included in context
- LLM expected to use it appropriately
- No guaranteed date validation

**Impact**:
- May suggest dates when experiences unavailable
- User books, then finds no availability
- Poor user experience

**Recommendation**: Filter experiences by user's date range
```java
// Parse travel dates from query
DateRange travelDates = extractDates(userMessage);

// Only retrieve experiences available in that range
List<Long> availableExperienceIds =
    availabilityRepo.findAvailableInDateRange(
        travelDates.start,
        travelDates.end
    );

// Use as filter in vector search
```

---

## Recommendations for Enhanced Preference Matching

### Short-term Improvements (1-2 weeks)

#### 1. Extract Query Parameters
```java
public class QueryParams {
    String destination;
    Integer numDays;
    String travelStyle;  // "Family", "Solo", "Couple"
    String theme;        // "Cultural", "Adventure", "Food"
    BigDecimal maxBudget;
    LocalDate startDate;
}

QueryParams params = QueryParser.parse(userMessage);
```

**Benefits**:
- Explicit filtering by destination, budget, duration
- Better matching to user intent
- Structured data for SQL queries

---

#### 2. Add Metadata Filtering (Hybrid Search)
```sql
-- Combine vector similarity with SQL filters
SELECT * FROM experience_knowledge_base
WHERE embedding <=> :query_embedding < :threshold
  AND metadata->>'country' = :destination
  AND (metadata->>'price')::numeric <= :budget
  AND :theme = ANY(string_to_array(metadata->>'tags', ','))
ORDER BY embedding <=> :query_embedding
LIMIT 10
```

**Benefits**:
- Hard constraints on price, location, theme
- Guaranteed matching experiences
- Better user satisfaction

---

#### 3. Include User's Past Bookings
```java
// Get user's booking history
List<Experience> bookedExperiences =
    bookingService.getUserBookedExperiences(userId);

// Build preference profile
UserPreferences prefs = buildPreferences(bookedExperiences);
// prefs: {favoriteCategories, avgPricePoint, typicalDuration}

// Include in context
context.append("User typically enjoys: " + prefs.toString());

// Or boost similar experiences in search
List<Long> similarToBooked =
    findSimilarExperiences(bookedExperiences);
```

**Benefits**:
- Personalized recommendations
- Learns from user behavior
- Higher booking conversion

---

### Medium-term Improvements (1-2 months)

#### 1. User Preference Profile
**Database Schema**:
```sql
CREATE TABLE user_preferences (
    user_id BIGINT PRIMARY KEY,
    preferred_categories TEXT[],
    typical_budget_min NUMERIC,
    typical_budget_max NUMERIC,
    preferred_duration_hours NUMERIC,
    travel_style VARCHAR(50),
    preferred_vibes TEXT[],
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Usage**:
```java
UserPreferences prefs = userPreferencesRepo.findByUserId(userId);

// Use in search
relevantExperiences = searchWithPreferences(query, prefs);
```

---

#### 2. Explicit Vibe/Mood Taxonomy
**Add to Knowledge Base**:
```json
{
  "vibes": {
    "romantic": 0.9,
    "adventurous": 0.2,
    "relaxing": 0.1,
    "educational": 0.7,
    "luxurious": 0.8,
    "budget_friendly": 0.3
  }
}
```

**Classification Methods**:
- Manual tagging by guides
- ML classification on descriptions
- Inferred from reviews (sentiment analysis)

**Benefits**:
- Explicit vibe matching
- Multi-vibe experiences
- Better user control

---

#### 3. Smart Itinerary Optimization
**Algorithm**:
```java
public List<DayPlan> optimizeItinerary(
    List<Experience> experiences,
    int numDays,
    Point startLocation
) {
    // 1. Cluster experiences by day (geography + theme)
    List<ExperienceCluster> clusters =
        clusterByLocationAndTheme(experiences, numDays);

    // 2. For each day, optimize sequence
    for (ExperienceCluster cluster : clusters) {
        // Traveling salesman with constraints
        List<Experience> optimized =
            optimizeRoute(cluster, startLocation);

        // Add meal breaks
        optimized = insertMealBreaks(optimized);

        // Validate timing (opening hours, durations)
        optimized = validateTiming(optimized);
    }

    return dayPlans;
}
```

**Constraints**:
- Experience opening hours
- Travel time between locations
- Meal breaks (lunch, dinner)
- Experience durations
- User energy levels (max 3-4 experiences per day)

---

### Long-term Improvements (3-6 months)

#### 1. Feedback Loop & Learning
**Track User Behavior**:
```sql
CREATE TABLE itinerary_feedback (
    feedback_id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100),
    user_id BIGINT,
    suggested_experiences JSONB,  -- What was suggested
    booked_experiences JSONB,     -- What was actually booked
    rejected_experiences JSONB,   -- What was explicitly rejected
    feedback_rating INT,          -- 1-5 stars
    created_at TIMESTAMP
);
```

**Learning**:
- Which suggestions lead to bookings?
- What do users reject (too expensive, wrong theme)?
- Adjust similarity thresholds
- Improve ranking algorithm

---

#### 2. Collaborative Filtering
**User Similarity**:
```
Users who booked experiences A, B, C also booked D, E
```

**Implementation**:
```java
// Find similar users
List<User> similarUsers = findSimilarUsers(currentUser);

// Get their bookings
List<Experience> theirExperiences =
    getBookings(similarUsers);

// Recommend popular experiences from similar users
List<Experience> recommendations =
    rankByPopularity(theirExperiences);
```

---

#### 3. Custom Domain-Specific Embedding Model
**Why**:
- OpenAI embeddings are general-purpose
- May not capture travel-specific nuances
- "Romantic" for travel vs. "romantic" for literature

**Approach**:
```
1. Collect training data:
   - User queries + clicked experiences (positive pairs)
   - User queries + rejected experiences (negative pairs)

2. Fine-tune embedding model:
   - Start with OpenAI or sentence-transformers
   - Train on trippy-specific data
   - Optimize for travel domain

3. Evaluate:
   - Precision@k: Are top results relevant?
   - User satisfaction scores
   - Booking conversion rates
```

---

## Summary: Answering Your Questions

### Q: How does it know what experiences are available?

**A**:
1. Airflow pipeline runs daily, extracting all ACTIVE experiences
2. Transforms each into rich text document with metadata
3. Generates embeddings (1536-dim vectors)
4. Stores in PostgreSQL with pgvector

---

### Q: How does it choose which to return?

**A**:
1. User query → embedding vector
2. Vector similarity search (cosine distance < 1.5)
3. Returns top 10 most similar experiences
4. Enriches with routing & availability data
5. Passes all context to LLM
6. LLM selects best fit for itinerary

---

### Q: Does it truly understand the "vibe"?

**A**: **Partially**
- ✅ Semantic similarity captures vibe implicitly
- ✅ Sentiment scores provide emotional context
- ✅ Reviews contain vibe-related feedback
- ✅ Works reasonably well for common vibes
- ❌ No explicit vibe taxonomy
- ❌ Nuanced vibes may be missed
- ❌ Relies on descriptions containing vibe words

---

### Q: Does it understand budget?

**A**: **Partially**
- ✅ Price included in every experience
- ✅ Semantic search can match budget terms
- ✅ LLM can filter by price from context
- ❌ No hard price constraints in vector search
- ❌ May return out-of-budget experiences
- ❌ Depends on LLM to enforce budget

---

### Q: Can it return experiences aligned to preferences?

**A**: **Mostly**
- ✅ **Theme**: Works well (category + tags + semantic)
- ✅ **Vibe**: Works partially (semantic + sentiment)
- ⚠️ **Budget**: Works partially (no hard constraints)
- ✅ **Location**: Works well (metadata + semantic)
- ✅ **Ratings**: Included in all results
- ❌ **User history**: Not currently used
- ❌ **Personalization**: Minimal

**Overall**: 70-80% effective, with clear paths for improvement

---

## Related Documents
- [claudeTripPlanner.md](claudeTripPlanner.md) - Requirements documentation
- [claudeTripPlannerDecisions.md](claudeTripPlannerDecisions.md) - Implementation decisions
- [OpenAIService.java](backend/src/main/java/com/backend/service/OpenAIService.java) - LLM generation
- [ItineraryChatbotService.java](backend/src/main/java/com/backend/service/ItineraryChatbotService.java) - RAG orchestration
- [experience_knowledge_base.py](data-pipeline/airflow/dags/experience_knowledge_base.py) - Knowledge base pipeline
- [ExperienceKnowledgeBaseRepository.java](backend/src/main/java/com/backend/repository/ExperienceKnowledgeBaseRepository.java) - Vector search
