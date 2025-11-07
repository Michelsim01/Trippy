package com.backend.repository;

import com.backend.entity.ItineraryDistanceMatrix;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItineraryDistanceMatrixRepository extends JpaRepository<ItineraryDistanceMatrix, Long> {

    /**
     * Find routing data between two specific experiences
     */
    @Query("SELECT dm FROM ItineraryDistanceMatrix dm " +
           "WHERE dm.originExperienceId = :originId AND dm.destinationExperienceId = :destId")
    Optional<ItineraryDistanceMatrix> findByOriginAndDestination(
        @Param("originId") Long originId,
        @Param("destId") Long destId
    );

    /**
     * Find all routes originating from a specific experience
     */
    @Query("SELECT dm FROM ItineraryDistanceMatrix dm " +
           "WHERE dm.originExperienceId = :experienceId " +
           "AND dm.routeFetchedAt IS NOT NULL " +
           "ORDER BY dm.straightLineKm ASC")
    List<ItineraryDistanceMatrix> findRoutesByOrigin(@Param("experienceId") Long experienceId);

    /**
     * Find routes between a list of experiences
     */
    @Query("SELECT dm FROM ItineraryDistanceMatrix dm " +
           "WHERE dm.originExperienceId IN :experienceIds " +
           "AND dm.destinationExperienceId IN :experienceIds " +
           "AND dm.routeFetchedAt IS NOT NULL " +
           "ORDER BY dm.straightLineKm ASC")
    List<ItineraryDistanceMatrix> findRoutesBetweenExperiences(@Param("experienceIds") List<Long> experienceIds);

    /**
     * Find nearby experiences within a certain distance
     */
    @Query("SELECT dm FROM ItineraryDistanceMatrix dm " +
           "WHERE dm.originExperienceId = :experienceId " +
           "AND dm.straightLineKm <= :maxDistanceKm " +
           "AND dm.routeFetchedAt IS NOT NULL " +
           "ORDER BY dm.straightLineKm ASC")
    List<ItineraryDistanceMatrix> findNearbyExperiences(
        @Param("experienceId") Long experienceId,
        @Param("maxDistanceKm") Double maxDistanceKm
    );

    /**
     * Find routes by country
     */
    @Query("SELECT dm FROM ItineraryDistanceMatrix dm " +
           "WHERE dm.country = :country " +
           "AND dm.originExperienceId IN :experienceIds " +
           "AND dm.destinationExperienceId IN :experienceIds " +
           "AND dm.routeFetchedAt IS NOT NULL")
    List<ItineraryDistanceMatrix> findRoutesByCountry(
        @Param("country") String country,
        @Param("experienceIds") List<Long> experienceIds
    );

    /**
     * Find routes with specific recommended transport mode
     */
    @Query("SELECT dm FROM ItineraryDistanceMatrix dm " +
           "WHERE dm.recommendedMode = :mode " +
           "AND dm.originExperienceId IN :experienceIds " +
           "AND dm.destinationExperienceId IN :experienceIds")
    List<ItineraryDistanceMatrix> findRoutesByTransportMode(
        @Param("mode") String mode,
        @Param("experienceIds") List<Long> experienceIds
    );
}
