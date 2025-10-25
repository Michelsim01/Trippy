package com.backend.dto;

import java.math.BigDecimal;

public class ExperienceViewsDTO {
    private Integer totalViews;
    private Integer totalBookings;
    private Integer chatInquiries;
    private Integer wishlistAdds;
    private BigDecimal averagePartySize;
    private BigDecimal conversionRate;

    public ExperienceViewsDTO() {}

    public ExperienceViewsDTO(Integer totalViews, Integer totalBookings, Integer chatInquiries,
                             Integer wishlistAdds, BigDecimal averagePartySize, BigDecimal conversionRate) {
        this.totalViews = totalViews;
        this.totalBookings = totalBookings;
        this.chatInquiries = chatInquiries;
        this.wishlistAdds = wishlistAdds;
        this.averagePartySize = averagePartySize;
        this.conversionRate = conversionRate;
    }

    public Integer getTotalViews() {
        return totalViews;
    }

    public void setTotalViews(Integer totalViews) {
        this.totalViews = totalViews;
    }

    public Integer getTotalBookings() {
        return totalBookings;
    }

    public void setTotalBookings(Integer totalBookings) {
        this.totalBookings = totalBookings;
    }

    public Integer getChatInquiries() {
        return chatInquiries;
    }

    public void setChatInquiries(Integer chatInquiries) {
        this.chatInquiries = chatInquiries;
    }

    public Integer getWishlistAdds() {
        return wishlistAdds;
    }

    public void setWishlistAdds(Integer wishlistAdds) {
        this.wishlistAdds = wishlistAdds;
    }

    public BigDecimal getAveragePartySize() {
        return averagePartySize;
    }

    public void setAveragePartySize(BigDecimal averagePartySize) {
        this.averagePartySize = averagePartySize;
    }

    public BigDecimal getConversionRate() {
        return conversionRate;
    }

    public void setConversionRate(BigDecimal conversionRate) {
        this.conversionRate = conversionRate;
    }
}
