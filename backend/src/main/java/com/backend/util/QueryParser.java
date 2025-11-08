package com.backend.util;

import com.backend.dto.QueryParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility class to parse structured query parameters from natural language user messages
 */
public class QueryParser {

    private static final Logger logger = LoggerFactory.getLogger(QueryParser.class);

    /**
     * Parse query parameters from user message
     * @param userMessage Natural language query from user
     * @return QueryParams object with extracted parameters
     */
    public static QueryParams parse(String userMessage) {
        QueryParams params = new QueryParams();

        if (userMessage == null || userMessage.trim().isEmpty()) {
            return params;
        }

        // Extract destination
        // Pattern: "travel to [DESTINATION]"
        Pattern destPattern = Pattern.compile(
            "travel to ([A-Za-z\\s]+?)(?:,|\\.|for|departing)",
            Pattern.CASE_INSENSITIVE
        );
        Matcher destMatcher = destPattern.matcher(userMessage);
        if (destMatcher.find()) {
            params.setDestination(destMatcher.group(1).trim());
            logger.debug("Extracted destination: {}", params.getDestination());
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
            logger.debug("Extracted departure city: {}", params.getDepartureCity());
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
            logger.debug("Extracted trip duration: {} days", params.getTripDuration());
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
            try {
                params.setMaxBudget(new BigDecimal(budgetStr));
                logger.debug("Extracted budget: ${}", params.getMaxBudget());
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse budget: {}", budgetStr);
            }
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
                    LocalDate parsedDate = LocalDate.parse(dateStr, formatter);

                    // If no year provided, assume current year or next year if date has passed
                    if (!dateStr.matches(".*\\d{4}.*")) {
                        LocalDate now = LocalDate.now();
                        if (parsedDate.isBefore(now)) {
                            parsedDate = parsedDate.plusYears(1);
                        }
                    }

                    params.setStartDate(parsedDate);
                }
                logger.debug("Extracted start date: {}", params.getStartDate());
            } catch (DateTimeParseException e) {
                logger.warn("Failed to parse date: {}", dateStr);
                // If parsing fails, leave startDate as null (will use default)
            }
        }

        logger.info("Parsed query params: {}", params);
        return params;
    }
}
