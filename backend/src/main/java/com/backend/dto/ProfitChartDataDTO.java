package com.backend.dto;

import java.math.BigDecimal;

public class ProfitChartDataDTO {
    private String month;
    private BigDecimal profit;

    public ProfitChartDataDTO() {}

    public ProfitChartDataDTO(String month, BigDecimal profit) {
        this.month = month;
        this.profit = profit;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public BigDecimal getProfit() {
        return profit;
    }

    public void setProfit(BigDecimal profit) {
        this.profit = profit;
    }
}
