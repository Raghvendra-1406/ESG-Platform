# Data Model

## Multi-tenancy
- Every company has its own tenant.
- Users and records are always scoped to one tenant.
- Data from one tenant should not appear in another tenant’s views.

## ESG Structure
- Records are grouped into Scope 1, Scope 2, and Scope 3.
- Scope 1 covers direct emissions.
- Scope 2 covers purchased energy.
- Scope 3 covers indirect value-chain activity.

## Source Tracking
- Each record keeps its source type: SAP, Utility, or Travel.
- The source file and reporting period are stored with the batch.
- This makes it clear where each normalized row came from.

## Audit Trail
- Changes are logged with who changed them, when, and what changed.
- Old value and new value are stored for review.
- This supports traceability for analyst and auditor workflows.

## Unit Normalization
- Raw source units are converted into one common unit per record.
- Example: liters, kWh, and kilometers are normalized into the model’s standard fields.
- This keeps reports consistent across all source types.