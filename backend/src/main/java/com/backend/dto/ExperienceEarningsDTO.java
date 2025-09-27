package com.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class ExperienceEarningsDTO {
    private Long experienceId;
    private String experienceTitle;
    private BigDecimal totalEarnings;
    private BigDecimal pendingEarnings;
    private BigDecimal paidOutEarnings;
    private List<ScheduleEarningsDTO> schedules;

    public ExperienceEarningsDTO() {}

    public ExperienceEarningsDTO(Long experienceId, String experienceTitle, BigDecimal totalEarnings,
                                BigDecimal pendingEarnings, BigDecimal paidOutEarnings, List<ScheduleEarningsDTO> schedules) {
        this.experienceId = experienceId;
        this.experienceTitle = experienceTitle;
        this.totalEarnings = totalEarnings;
        this.pendingEarnings = pendingEarnings;
        this.paidOutEarnings = paidOutEarnings;
        this.schedules = schedules;
    }

    public Long getExperienceId() { return experienceId; }
    public void setExperienceId(Long experienceId) { this.experienceId = experienceId; }

    public String getExperienceTitle() { return experienceTitle; }
    public void setExperienceTitle(String experienceTitle) { this.experienceTitle = experienceTitle; }

    public BigDecimal getTotalEarnings() { return totalEarnings; }
    public void setTotalEarnings(BigDecimal totalEarnings) { this.totalEarnings = totalEarnings; }

    public BigDecimal getPendingEarnings() { return pendingEarnings; }
    public void setPendingEarnings(BigDecimal pendingEarnings) { this.pendingEarnings = pendingEarnings; }

    public BigDecimal getPaidOutEarnings() { return paidOutEarnings; }
    public void setPaidOutEarnings(BigDecimal paidOutEarnings) { this.paidOutEarnings = paidOutEarnings; }

    public List<ScheduleEarningsDTO> getSchedules() { return schedules; }
    public void setSchedules(List<ScheduleEarningsDTO> schedules) { this.schedules = schedules; }
}