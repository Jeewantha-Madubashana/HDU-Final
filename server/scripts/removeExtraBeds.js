import { sequelize, testConnection } from "../config/database.js";
import { BedMySQL } from "../config/mysqlDB.js";
import { Op } from "sequelize";

/**
 * Script to remove extra beds (HDU-11 and HDU-12) to keep only 10 beds
 */
async function removeExtraBeds() {
  try {
    console.log('🚀 Starting to remove extra beds...');
    
    // Test database connection
    console.log('🔗 Testing database connection...');
    const connectionSuccessful = await testConnection();
    if (!connectionSuccessful) {
      throw new Error('Database connection failed');
    }
    
    // Find and delete beds HDU-11 and HDU-12
    console.log('🗑️  Removing extra beds (HDU-11 and HDU-12)...');
    
    const bedsToDelete = await BedMySQL.findAll({
      where: {
        bedNumber: { [Op.in]: ['HDU-11', 'HDU-12'] }
      }
    });
    
    if (bedsToDelete.length === 0) {
      console.log('   ℹ️  No extra beds found (HDU-11 and HDU-12)');
    } else {
      for (const bed of bedsToDelete) {
        // Check if bed is occupied
        if (bed.patientId !== null) {
          console.log(`   ⚠️  Bed ${bed.bedNumber} is occupied. Unassigning patient first...`);
          await BedMySQL.update(
            { patientId: null },
            { where: { id: bed.id } }
          );
        }
        
        // Delete the bed
        await bed.destroy();
        console.log(`   ✅ Deleted bed ${bed.bedNumber}`);
      }
    }
    
    // Verify final bed count
    const totalBeds = await BedMySQL.count();
    const occupiedBeds = await BedMySQL.count({
      where: { patientId: { [Op.ne]: null } }
    });
    const availableBeds = totalBeds - occupiedBeds;
    
    console.log('');
    console.log('✅ Extra beds removal completed!');
    console.log('');
    console.log('📊 Current Bed Status:');
    console.log(`   • Total beds: ${totalBeds}`);
    console.log(`   • Occupied beds: ${occupiedBeds}`);
    console.log(`   • Available beds: ${availableBeds}`);
    
    if (totalBeds > 10) {
      console.log('');
      console.log('⚠️  Warning: Still have more than 10 beds. Please check manually.');
    } else if (totalBeds === 10) {
      console.log('');
      console.log('✅ Perfect! You now have exactly 10 beds.');
    }
    
  } catch (error) {
    console.error('❌ Error removing extra beds:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('removeExtraBeds')) {
  removeExtraBeds()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export default removeExtraBeds;

