import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import User from '../models/User.js';

export async function seedAdmin() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas for Admin creation');

    const adminEmail = 'admin@smartbudget.com';
    const plainPassword = 'AdminPassword123!';
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const admin = await User.findOneAndUpdate(
      { email: adminEmail },
      {
        name: 'System Administrator',
        email: adminEmail,
        passwordHash,
        role: 'admin',
        emailVerified: true,
        profile: {
          course: 'Administration',
          year: 4,
          monthlyAllowance: 50000,
          currency: 'INR',
          language: 'en',
        },
      },
      { upsert: true, new: true }
    );

    console.log('✅ Admin Profile Ready:');
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${plainPassword}`);
    console.log(`   Role:     ${admin.role}`);

    if (process.argv[1]?.includes('seedAdmin.js')) {
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Failed to create admin profile:', err);
    if (process.argv[1]?.includes('seedAdmin.js')) {
      process.exit(1);
    }
  }
}

if (process.argv[1]?.includes('seedAdmin.js')) {
  seedAdmin();
}
