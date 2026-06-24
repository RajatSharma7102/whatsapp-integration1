const mongoose = require('mongoose');
require('dotenv').config();
const WhatsAppAccount = require('./src/models/WhatsAppAccount');

async function encryptExistingTokens() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const accounts = await WhatsAppAccount.find();
    let updatedCount = 0;

    for (const account of accounts) {
      // Check if token is already encrypted (contains ':')
      if (account.accessToken && !account.accessToken.includes(':')) {
        // By modifying and calling save, the pre('save') hook will encrypt it
        account.markModified('accessToken');
        await account.save();
        updatedCount++;
        console.log(`Encrypted token for WhatsApp Account: ${account.phoneNumber}`);
      }
    }

    console.log(`Migration completed. ${updatedCount} tokens encrypted.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

encryptExistingTokens();
