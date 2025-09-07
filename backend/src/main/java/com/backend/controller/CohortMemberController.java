package com.backend.controller;

import com.backend.entity.CohortMember;
import com.backend.repository.CohortMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/cohort-members")
public class CohortMemberController {
    @Autowired
    private CohortMemberRepository cohortMemberRepository;

    @GetMapping
    public List<CohortMember> getAllCohortMembers() {
        return cohortMemberRepository.findAll();
    }

    @GetMapping("/{id}")
    public CohortMember getCohortMemberById(@PathVariable Long id) {
        return cohortMemberRepository.findById(id).orElse(null);
    }

    @PostMapping
    public CohortMember createCohortMember(@RequestBody CohortMember cohortMember) {
        return cohortMemberRepository.save(cohortMember);
    }

    @PutMapping("/{id}")
    public CohortMember updateCohortMember(@PathVariable Long id, @RequestBody CohortMember cohortMember) {
        cohortMember.setId(id);
        return cohortMemberRepository.save(cohortMember);
    }

    @DeleteMapping("/{id}")
    public void deleteCohortMember(@PathVariable Long id) {
        cohortMemberRepository.deleteById(id);
    }
}
