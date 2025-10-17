package com.backend.repository;

import com.backend.entity.ClusterProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClusterProfileRepository extends JpaRepository<ClusterProfile, Integer> {

    /**
     * Find cluster profile by cluster ID
     * @param clusterId The cluster ID
     * @return Optional containing the cluster profile if found
     */
    Optional<ClusterProfile> findByClusterId(Integer clusterId);
}
