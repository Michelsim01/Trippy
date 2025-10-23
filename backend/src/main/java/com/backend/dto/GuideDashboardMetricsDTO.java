package com.backend.dto;

public class GuideDashboardMetricsDTO {
    private MetricChange monthlyBookings;
    private MetricChange cancellationRate;
    private Integer totalExperiences;

    public GuideDashboardMetricsDTO() {}

    public GuideDashboardMetricsDTO(MetricChange monthlyBookings, MetricChange cancellationRate, Integer totalExperiences) {
        this.monthlyBookings = monthlyBookings;
        this.cancellationRate = cancellationRate;
        this.totalExperiences = totalExperiences;
    }

    public MetricChange getMonthlyBookings() {
        return monthlyBookings;
    }

    public void setMonthlyBookings(MetricChange monthlyBookings) {
        this.monthlyBookings = monthlyBookings;
    }

    public MetricChange getCancellationRate() {
        return cancellationRate;
    }

    public void setCancellationRate(MetricChange cancellationRate) {
        this.cancellationRate = cancellationRate;
    }

    public Integer getTotalExperiences() {
        return totalExperiences;
    }

    public void setTotalExperiences(Integer totalExperiences) {
        this.totalExperiences = totalExperiences;
    }

    // Inner class for metric with change percentage
    public static class MetricChange {
        private double current;
        private double previous;
        private double changePercent;

        public MetricChange() {}

        public MetricChange(double current, double previous, double changePercent) {
            this.current = current;
            this.previous = previous;
            this.changePercent = changePercent;
        }

        public double getCurrent() {
            return current;
        }

        public void setCurrent(double current) {
            this.current = current;
        }

        public double getPrevious() {
            return previous;
        }

        public void setPrevious(double previous) {
            this.previous = previous;
        }

        public double getChangePercent() {
            return changePercent;
        }

        public void setChangePercent(double changePercent) {
            this.changePercent = changePercent;
        }
    }
}
