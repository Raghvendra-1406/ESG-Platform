# Sources

## SAP
- Format: usually CSV or Excel export.
- Represents: operational or procurement-style activity.
- Simple structure: invoice id, vendor, plant, material type, quantity, unit, date.
- Possible issues: mixed column names, missing units, and inconsistent date formats.

## Utility
- Format: usually CSV or spreadsheet export.
- Represents: energy consumption and billing data.
- Simple structure: meter id, facility name, electricity usage, billing month, billing year, provider.
- Possible issues: month/year splits, missing unit fields, and duplicate bills.

## Travel
- Format: usually CSV export or uploaded report file.
- Represents: business travel activity and expenses.
- Simple structure: employee id, employee name, travel mode, from city, to city, distance, travel date, expense amount.
- Possible issues: missing travel dates, mixed city names, and inconsistent distance units.