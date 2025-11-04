# Database Initialization Script

This script (`initializeDatabase.js`) provides a comprehensive database setup for the HDU (High Dependency Unit) management system.

## What it does

The initialization script performs the following operations:

1. **Database Connection**: Tests and establishes connection to MySQL database
2. **Table Creation**: Creates all required tables with proper relationships
3. **Sample Users**: Creates 3 sample users (Nurse, Consultant, Medical Officer)
4. **ICU Beds**: Creates 12 ICU beds (ICU-01 to ICU-12)
5. **Realistic Patients**: Creates 5 patients with complete medical profiles
6. **Vital Signs**: Generates time-series vital sign data for each patient
7. **ICU Simulation**: Sets up realistic scenarios for monitoring and alerts

## How to run

### Method 1: Using npm script (Recommended)
```bash
cd server
npm run init-db
```

### Method 2: Direct node execution
```bash
cd server
node scripts/initializeDatabase.js
```

## Patient Scenarios Created

The script creates 5 realistic ICU patients:

1. **Amara Wickramasinghe** (Bed ICU-01)
   - Condition: Respiratory failure
   - Diagnosis: Severe pneumonia with respiratory failure
   - Critical vitals: Low SpO2, high respiratory rate

2. **Kamal Fernando** (Bed ICU-02)
   - Condition: Post-operative complications
   - Diagnosis: Post-operative complications following emergency appendectomy
   - Critical vitals: High blood glucose (diabetic), elevated temperature

3. **Priya Rajapakse** (Bed ICU-03)
   - Condition: Asthma exacerbation
   - Diagnosis: Severe asthma exacerbation with acute respiratory distress
   - Critical vitals: Very high respiratory rate, low SpO2

4. **Ravi Gunasekara** (Bed ICU-04)
   - Condition: Kidney failure
   - Diagnosis: Acute kidney injury with fluid overload
   - Critical vitals: Very low urine output, high blood pressure

5. **Sanduni Perera** (Bed ICU-05)
   - Condition: Head trauma
   - Diagnosis: Severe head trauma following motor vehicle accident
   - Critical vitals: Low Glasgow Coma Scale, irregular vitals

## Sample Users Created

- **nurse_mary** (Role: Nurse, Ward: ICU)
- **dr_perera** (Role: Consultant, Specialty: Pulmonology)
- **mo_fernando** (Role: Medical Officer, Specialty: General Surgery)

## Database Configuration

Make sure your database configuration in `config/database.js` is correct:
- Database: `hdu_kegalle`
- Host: `localhost`
- Port: `3306`
- User: `root`

## Important Notes

⚠️ **WARNING**: This script uses `sequelize.sync({ force: true })` which will **DROP ALL EXISTING TABLES** and recreate them. Only run this on a development/test database.

✅ **Features**:
- Realistic medical data with proper relationships
- Time-series vital signs data for trend analysis
- Critical alerts scenarios for testing monitoring systems
- Complete patient profiles with emergency contacts and medical history

## Troubleshooting

If you encounter connection issues:
1. Ensure MySQL server is running
2. Verify database credentials in `config/database.js`
3. Make sure the `hdu_kegalle` database exists
4. Check that all required dependencies are installed (`npm install`)

## Next Steps

After running the initialization:
1. Start the server: `npm run dev`
2. The system will be ready with realistic ICU data
3. Test the monitoring dashboard and alert systems
4. Verify patient data through the API endpoints 