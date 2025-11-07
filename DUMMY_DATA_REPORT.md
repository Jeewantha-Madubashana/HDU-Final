# Dashboard Dummy/Placeholder Data Report

## Frontend Dummy Data

### 1. AnalyticsDashboard.jsx

#### Mock Data (Lines 42-60):
- **`mockVitalSignsData`** - Hardcoded vital signs arrays:
  - `heartRate`: [72, 75, 68, 80, 85, 78, 82, 76, 79, 81, 77, 74]
  - `bloodPressure`: [120, 118, 125, 122, 128, 115, 130, 125, 122, 127, 120, 118]
  - `temperature`: [36.8, 37.1, 36.9, 37.2, 37.0, 36.7, 37.3, 36.8, 37.1, 36.9, 37.0, 36.8]
  - `spO2`: [98, 97, 99, 96, 98, 97, 98, 99, 97, 98, 96, 97]

- **`mockPatientDemographics`** - Hardcoded demographics:
  - Age Groups: 30-40 (3), 40-50 (2), 50-60 (2)
  - Gender: Male (4), Female (3)

#### Hardcoded Values:
- **Line 451**: `trend={2.5}` - Hardcoded trend percentage for Bed Occupancy
- **Line 461**: `trend={-1.2}` - Hardcoded trend percentage for Total Patients
- **Line 471**: `trend={0}` - Hardcoded trend percentage for Critical Patients
- **Line 481**: `trend={-0.8}` - Hardcoded trend percentage for Avg. Length of Stay
- **Lines 507-509**: Hardcoded critical alerts data:
  ```javascript
  data={[5, 3, 2, 1]} // Heart Rate, BP, SpO2, Temperature
  labels={["Heart Rate", "Blood Pressure", "SpO2", "Temperature"]}
  ```

#### Hardcoded Vital Signs Table (Lines 377-412):
- Heart Rate: 78 bpm (avg), 68-85 range
- Blood Pressure: 122/80 (avg), 115/75 - 130/85 range
- Temperature: 37.0°C (avg), 36.7-37.3 range
- SpO2: 97% (avg), 96-99 range

### 2. Dashboard Pages (NurseDashboard, ConsultantDashboard, etc.)

#### Issues:
- **Lines 107, 159** (multiple dashboards): `{user?.fullName}` - May show "Welcome, undefined" if user object doesn't have fullName property
- **Lines 145, 197** (multiple dashboards): `.slice(0, 10)` - Only shows first 10 beds, not all beds

### 3. Debug/Console Logs

#### AnalyticsDashboard.jsx:
- Line 113: `console.log("🚀 ~ fetchAnalyticsData ~ bedsResponse:", bedsResponse);`
- Line 131: `console.log("🚀 ~ fetchAnalyticsData ~ criticalResponse:", criticalResponse);`

#### CriticalAlertsSystem.jsx:
- Line 240: `console.log("Acknowledging alert:", alert);`
- Line 257: `console.log("Sending alert data:", alertData);`

#### NurseDashboard.jsx:
- Line 75: `console.log("View patient details for bed:", bed.bedNumber);`

#### BedManagementDashboard.jsx:
- Line 179: `console.log("Assign bed:", bed);`

## Backend Dummy Data

### 1. bedController.js

#### Debug Logs:
- Line 113: `console.log("Beds with patients:", JSON.stringify(bedsWithPatients, null, 2));`
- Line 426: `console.log("Using existing patient with NIC:", patientData.nicPassport);`
- Line 488: `console.log(`Found ${patientDocuments.length} documents for patient ${bed.patientId}, deleting...`);`
- Line 505: `console.log(`Deleted file: ${filePath}`);`
- Line 512: `console.log(`Deleted document record: ${doc.fileName}`);`
- Lines 568-569: `console.log("Patients:", ...)` and `console.log("Beds:", ...)`

### 2. criticalFactorController.js

#### Debug Logs:
- Lines 144-147: Multiple `console.log` statements for debugging:
  ```javascript
  console.log("[DEBUG] updateCriticalFactors called for id:", ...)
  console.log("[DEBUG] Looking for CriticalFactor with id:", ...)
  console.log("[DEBUG] factor found with transaction:", ...)
  console.log("[DEBUG] factor found without transaction:", ...)
  ```

### 3. patientController.js

#### Debug Logs:
- Line 261: `console.log(`Bed ${bedId} deassigned successfully`);`
- Line 270: `console.log("Discharge Record:", dischargeRecord);`
- Line 268-269: Comment about discharge record creation:
  ```javascript
  // Create discharge record in database (you might need to create a Discharge model)
  // For now, we'll log it and return success
  ```

### 4. auditController.js

#### Placeholder Values (Lines 67-70):
- `averageResponseTime: 0` - Not calculated
- `quickResponses: 0` - Not calculated
- `slowResponses: 0` - Not calculated
- Comment: "This would need to be calculated based on alert creation vs acknowledgment"

### 5. patientController.js - getPatientAnalytics

#### Potential Issues:
- Lines 22-26: Critical patient query uses field names that may not match the actual model:
  - `bloodPressure` (should be `bloodPressureSystolic` and `bloodPressureDiastolic`)
  - `oxygenSaturation` (should be `spO2`)

## Summary

### Frontend:
1. **Mock Vital Signs Data** - Hardcoded arrays for charts
2. **Mock Demographics** - Hardcoded age groups and gender distribution
3. **Hardcoded Trend Values** - Static percentage trends
4. **Hardcoded Critical Alerts Chart Data** - [5, 3, 2, 1] array
5. **Hardcoded Vital Signs Summary Table** - All values are static
6. **User Display Issue** - `user?.fullName` may be undefined
7. **Bed Display Limitation** - Only first 10 beds shown
8. **Debug Console Logs** - Multiple console.log statements

### Backend:
1. **Debug Console Logs** - Extensive logging in controllers
2. **Placeholder Analytics Values** - Response time analysis not implemented
3. **Incomplete Discharge Model** - Discharge record logged but not saved to database
4. **Field Name Mismatch** - Potential issue with critical patient query field names

### 6. Placeholder Values ("N/A")

#### SuperAdminDashboard.jsx:
- Line 155: `if (!dateString) return "N/A";` - Date formatting fallback
- Line 256: `{user.ward || "N/A"}` - Ward display
- Line 258: `{user.nameWithInitials || "N/A"}` - Name display
- Line 318: `{user.ward || "N/A"}` - Ward in table

#### CriticalAlertsAnalytics.jsx:
- Line 311: `{alert.patientId || 'N/A'}` - Patient ID fallback
- Line 312: `{alert.bedNumber || 'N/A'}` - Bed number fallback
- Line 318: `... : 'N/A'` - Date fallback
- Line 206: "No data available" - Empty state message

#### criticalFactorController.js:
- Line 332: `bedNumber: "N/A"` - Comment: "We'll get bed info separately if needed"
- Line 369: `bedNumber: bed ? bed.bedNumber : "N/A"` - Bed number fallback

#### BedCard.jsx:
- Line 80: `{value || "Not specified"}` - Generic fallback for missing values
- Line 503: `"Not available"` - Vital signs date fallback

### 7. Incomplete Implementations

#### patientController.js - dischargePatient (Lines 268-270):
```javascript
// Create discharge record in database (you might need to create a Discharge model)
// For now, we'll log it and return success
console.log("Discharge Record:", dischargeRecord);
```
**Issue**: Discharge records are logged but not saved to database. No Discharge model exists.

#### auditController.js - getAlertAnalytics (Lines 67-70):
```javascript
responseTimeAnalysis: {
  averageResponseTime: 0, // This would need to be calculated based on alert creation vs acknowledgment
  quickResponses: 0, // < 5 minutes
  slowResponses: 0, // > 30 minutes
}
```
**Issue**: Response time analysis is not implemented, all values are 0.

#### patientController.js - getPatientAnalytics (Lines 22-26):
**Issue**: Query uses field names that may not match actual model:
- `bloodPressure` (model uses `bloodPressureSystolic` and `bloodPressureDiastolic`)
- `oxygenSaturation` (model uses `spO2`)

## Recommendations

### High Priority:
1. **Replace Mock Vital Signs Data** - Connect to real API endpoint for vital signs trends
2. **Replace Mock Demographics** - Calculate from actual patient data
3. **Remove Hardcoded Trend Values** - Calculate trends from historical data
4. **Fix Hardcoded Vital Signs Summary Table** - Get real averages from database
5. **Fix Hardcoded Critical Alerts Chart** - Use real alert data from API
6. **Implement Response Time Analysis** - Calculate in auditController.js
7. **Create Discharge Model** - Save discharge records properly
8. **Fix Field Name Mismatches** - Update patientController.js queries

### Medium Priority:
9. **Fix User Display Issue** - Handle `user?.fullName` properly (use username or nameWithInitials)
10. **Remove Bed Display Limitation** - Show all beds or implement pagination
11. **Remove Debug Console Logs** - Clean up or use proper logging library
12. **Replace N/A Placeholders** - Use better fallback messages or empty states

### Low Priority:
13. **Improve Error Messages** - Replace generic "N/A" with context-specific messages
14. **Add Loading States** - Better UX when data is being fetched
15. **Add Empty States** - Better messages when no data is available

