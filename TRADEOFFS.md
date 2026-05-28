- Did not build automatic master-data matching.
  - Skipped to keep the first version simple.
  - Impact: some source names may stay inconsistent.

- Did not build a full data lineage graph.
  - Skipped because the audit log already covers the main traceability need.
  - Impact: technical tracing is less detailed.

- Did not build advanced source-specific validation rules.
  - Skipped to avoid slowing down the upload workflow.
  - Impact: some bad rows may only be caught later in review.