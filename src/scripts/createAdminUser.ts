import mongoose from 'mongoose';
import { ENV } from '../config/env';
import { User } from '../models/user.model';

async function createAdmin() {
  const email = 'thicamtien2003@gmail.com';
  const password = 'Abcd@1234';
  const name = 'Thi Cẩm Tiên';

  console.log('Connecting to database...');
  await mongoose.connect(ENV.MONGODB_URI);
  console.log('Connected to MongoDB successfully!');

  let user = await User.findOne({ email });

  if (user) {
    console.log(`User ${email} already exists. Updating credentials and role to admin...`);
    user.name = name;
    user.password = password;
    user.role = 'admin';
    user.isActive = true;
    user.isEmailVerified = true;
    await user.save();
    console.log(`✅ Admin account ${email} updated successfully!`);
  } else {
    console.log(`Creating new admin account: ${email}...`);
    user = new User({
      name,
      email,
      password,
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
    });
    await user.save();
    console.log(`✅ Admin account ${email} created successfully!`);
  }

  // Verify compare password works
  const checkUser = await User.findOne({ email }).select('+password');
  if (checkUser) {
    const isMatch = await checkUser.comparePassword(password);
    console.log(`🔐 Password match check: ${isMatch ? 'PASSED (Match)' : 'FAILED'}`);
    console.log(`👑 User Role: ${checkUser.role}, Verified: ${checkUser.isEmailVerified}, Active: ${checkUser.isActive}`);
  }

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

createAdmin().catch((err) => {
  console.error('❌ Error creating admin account:', err);
  process.exit(1);
});
