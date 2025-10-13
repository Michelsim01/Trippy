package com.backend.service;

import com.backend.entity.*;
import com.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TripChatService {

    @Autowired
    private PersonalChatRepository personalChatRepository;

    @Autowired
    private TripCohortRepository tripCohortRepository;

    @Autowired
    private ChatMemberRepository chatMemberRepository;

    @Autowired
    private CohortMemberRepository cohortMemberRepository;

    @Autowired
    private ExperienceScheduleRepository experienceScheduleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ChatUnreadCountRepository chatUnreadCountRepository;

    /**
     * Get or create trip chat channel for a given experience schedule.
     * This method ensures that each schedule has exactly one trip cohort and one trip chat (PersonalChat with isTripChat=true).
     *
     * @param scheduleId the experience schedule ID
     * @return the PersonalChat entity (either existing or newly created)
     */
    @Transactional
    public PersonalChat getOrCreateTripChat(Long scheduleId) {
        ExperienceSchedule schedule = experienceScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Experience schedule not found"));

        // Check if trip cohort already exists for this schedule
        TripCohort cohort = schedule.getTripCohort();

        if (cohort != null && cohort.getPersonalChat() != null) {
            // Trip chat already exists
            return cohort.getPersonalChat();
        }

        // Create new trip cohort and chat
        if (cohort == null) {
            cohort = createTripCohort(schedule);
        }

        // Create trip chat for the cohort
        PersonalChat tripChat = createTripChat(cohort, schedule);

        return tripChat;
    }

    /**
     * Add a user to a trip chat channel when they book the experience.
     * Creates cohort member and chat member records.
     *
     * @param scheduleId the experience schedule ID
     * @param userId the user ID to add
     * @param bookingId the booking ID associated with this membership
     * @return the PersonalChat entity
     */
    @Transactional
    public PersonalChat addUserToTripChat(Long scheduleId, Long userId, Long bookingId) {
        PersonalChat tripChat = getOrCreateTripChat(scheduleId);
        TripCohort cohort = tripChat.getTripCohort();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        // Check if user is already a member
        Optional<ChatMember> existingChatMember = chatMemberRepository
                .findByPersonalChatAndUser(tripChat, user);

        if (existingChatMember.isPresent()) {
            // User already in chat
            return tripChat;
        }

        // Add user to cohort
        CohortMember cohortMember = new CohortMember();
        cohortMember.setTripCohort(cohort);
        cohortMember.setUser(user);
        cohortMember.setBooking(booking);
        cohortMember.setJoinedAt(LocalDateTime.now());
        cohortMember.setIsActive(true);
        cohortMemberRepository.save(cohortMember);

        // Add user to chat
        ChatMember chatMember = new ChatMember();
        chatMember.setPersonalChat(tripChat);
        chatMember.setUser(user);
        chatMember.setRole(ChatRoleEnum.MEMBER);
        chatMember.setCreatedAt(LocalDateTime.now());
        chatMemberRepository.save(chatMember);

        return tripChat;
    }

    /**
     * Add the guide (host) to the trip chat channel.
     * Guides have ADMIN role in the chat.
     *
     * @param scheduleId the experience schedule ID
     * @param guideId the guide user ID
     * @return the PersonalChat entity
     */
    @Transactional
    public PersonalChat addGuideToTripChat(Long scheduleId, Long guideId) {
        PersonalChat tripChat = getOrCreateTripChat(scheduleId);

        User guide = userRepository.findById(guideId)
                .orElseThrow(() -> new IllegalArgumentException("Guide not found"));

        // Check if guide is already a member
        Optional<ChatMember> existingChatMember = chatMemberRepository
                .findByPersonalChatAndUser(tripChat, guide);

        if (existingChatMember.isPresent()) {
            // Guide already in chat
            return tripChat;
        }

        // Add guide to chat with ADMIN role
        ChatMember chatMember = new ChatMember();
        chatMember.setPersonalChat(tripChat);
        chatMember.setUser(guide);
        chatMember.setRole(ChatRoleEnum.ADMIN);
        chatMember.setCreatedAt(LocalDateTime.now());
        chatMemberRepository.save(chatMember);

        return tripChat;
    }

    /**
     * Remove a user from a trip chat channel when their booking is cancelled.
     * Removes both cohort member and chat member records.
     *
     * @param bookingId the booking ID associated with the membership to remove
     */
    @Transactional
    public void removeUserFromTripChat(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        // Find cohort member by booking
        List<CohortMember> cohortMembers = cohortMemberRepository.findByBooking(booking);
        
        for (CohortMember cohortMember : cohortMembers) {
            TripCohort cohort = cohortMember.getTripCohort();
            PersonalChat tripChat = cohort.getPersonalChat();
            User user = cohortMember.getUser();

            if (tripChat != null) {
                // Remove chat member
                Optional<ChatMember> chatMember = chatMemberRepository
                        .findByPersonalChatAndUser(tripChat, user);
                
                if (chatMember.isPresent()) {
                    chatMemberRepository.delete(chatMember.get());
                }

                // Remove unread count record if it exists
                Optional<ChatUnreadCount> unreadCount = chatUnreadCountRepository
                        .findByChatIdAndUserId(tripChat.getPersonalChatId(), user.getId());
                
                if (unreadCount.isPresent()) {
                    chatUnreadCountRepository.delete(unreadCount.get());
                }
            }

            // Remove cohort member
            cohortMemberRepository.delete(cohortMember);
        }
    }

    /**
     * Get all trip chats for a specific user (as participant or guide).
     *
     * @param userId the user ID
     * @return list of PersonalChat entities where isTripChat=true and the user is a member
     */
    public List<PersonalChat> getUserTripChats(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // First, get the trip chats for the user
        List<PersonalChat> tripChats = personalChatRepository.findTripChatsByUserId(userId);

        if (tripChats.isEmpty()) {
            return tripChats;
        }

        // Then, fetch all chat members for these chats
        List<Long> chatIds = tripChats.stream()
                .map(PersonalChat::getPersonalChatId)
                .toList();

        List<PersonalChat> chatsWithMembers = personalChatRepository.findByIdsWithMembers(chatIds);

        // Populate last message and unread count for each chat
        if (!chatsWithMembers.isEmpty()) {
            // Get last messages for all chats in one query
            List<Message> lastMessages = personalChatRepository.findLastMessagesForChats(chatIds);

            // Create a map for quick lookup
            var lastMessageMap = lastMessages.stream()
                .collect(Collectors.toMap(
                    m -> m.getPersonalChat().getPersonalChatId(),
                    m -> m
                ));

            // Get unread counts for all chats
            List<ChatUnreadCount> unreadCounts = chatUnreadCountRepository.findByUserId(userId);
            var unreadCountMap = unreadCounts.stream()
                .collect(Collectors.toMap(
                    uc -> uc.getPersonalChat().getPersonalChatId(),
                    ChatUnreadCount::getUnreadCount
                ));

            // Populate last message and unread count for each chat
            for (PersonalChat chat : chatsWithMembers) {
                Message lastMessage = lastMessageMap.get(chat.getPersonalChatId());
                if (lastMessage != null) {
                    chat.setLastMessage(lastMessage.getContent());
                    chat.setLastMessageTime(lastMessage.getCreatedAt());
                }

                // Set unread count
                Integer unreadCount = unreadCountMap.getOrDefault(chat.getPersonalChatId(), 0);
                chat.setUnreadCount(unreadCount);
            }
        }

        return chatsWithMembers;
    }

    // Private helper methods

    /**
     * Create a new trip cohort for a schedule.
     */
    private TripCohort createTripCohort(ExperienceSchedule schedule) {
        TripCohort cohort = new TripCohort();
        cohort.setExperienceSchedule(schedule);
        cohort.setName(generateCohortName(schedule));
        cohort.setDescription("Trip cohort for " + schedule.getExperience().getTitle());
        cohort.setIsActive(true);
        cohort.setCreatedAt(LocalDateTime.now());
        cohort.setUpdatedAt(LocalDateTime.now());

        cohort = tripCohortRepository.save(cohort);

        // Update schedule reference
        schedule.setTripCohort(cohort);
        experienceScheduleRepository.save(schedule);

        return cohort;
    }

    /**
     * Create a new trip chat (PersonalChat with isTripChat=true) for a cohort.
     */
    private PersonalChat createTripChat(TripCohort cohort, ExperienceSchedule schedule) {
        PersonalChat tripChat = new PersonalChat();
        tripChat.setTripCohort(cohort);
        tripChat.setName(generateChatName(schedule));
        tripChat.setIsTripChat(true);
        tripChat.setExperience(schedule.getExperience());
        tripChat.setCreatedAt(LocalDateTime.now());

        tripChat = personalChatRepository.save(tripChat);

        // Update cohort reference
        cohort.setPersonalChat(tripChat);
        tripCohortRepository.save(cohort);

        return tripChat;
    }

    /**
     * Generate a descriptive name for the cohort.
     */
    private String generateCohortName(ExperienceSchedule schedule) {
        String experienceTitle = schedule.getExperience().getTitle();
        String date = schedule.getStartDateTime().format(DateTimeFormatter.ofPattern("MMM dd, yyyy"));
        return experienceTitle + " - " + date;
    }

    /**
     * Generate a descriptive name for the trip chat.
     */
    private String generateChatName(ExperienceSchedule schedule) {
        String experienceTitle = schedule.getExperience().getTitle();
        String date = schedule.getStartDateTime().format(DateTimeFormatter.ofPattern("MMM dd, yyyy"));
        String time = schedule.getStartDateTime().format(DateTimeFormatter.ofPattern("h:mm a"));
        return experienceTitle + " - " + date + " at " + time;
    }
}
