package com.backend.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO for price update validation warnings
 * Returns validation results to frontend for SweetAlert confirmation
 */
public class PriceUpdateValidationDTO {
    private boolean hasWarnings;
    private List<String> warnings;
    private boolean canProceed; // Always true, warnings don't block

    public PriceUpdateValidationDTO() {
        this.warnings = new ArrayList<>();
        this.hasWarnings = false;
        this.canProceed = true;
    }

    public void addWarning(String warning) {
        this.warnings.add(warning);
        this.hasWarnings = true;
    }

    // Getters and Setters
    public boolean isHasWarnings() {
        return hasWarnings;
    }

    public void setHasWarnings(boolean hasWarnings) {
        this.hasWarnings = hasWarnings;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings;
    }

    public boolean isCanProceed() {
        return canProceed;
    }

    public void setCanProceed(boolean canProceed) {
        this.canProceed = canProceed;
    }
}
