const mongoose = require('mongoose');
require('dotenv').config();
const Company = require('./src/models/Company');
const WhatsAppAccount = require('./src/models/WhatsAppAccount');
const User = require('./src/models/User');
const Lead = require('./src/models/Lead');
const Conversation = require('./src/models/Conversation');
const Message = require('./src/models/Message');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for Migration');

    // 1. Create Default Company
    let defaultCompany = await Company.findOne({ email: 'default@company.com' });
    if (!defaultCompany) {
      defaultCompany = await Company.create({
        companyName: 'Default Company',
        email: 'default@company.com',
      });
      console.log('Created Default Company:', defaultCompany._id);
    } else {
      console.log('Default Company already exists:', defaultCompany._id);
    }

    // 2. Create Default WhatsApp Account from .env
    let defaultWAAccount = await WhatsAppAccount.findOne({ phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID });
    if (!defaultWAAccount) {
      defaultWAAccount = await WhatsAppAccount.create({
        companyId: defaultCompany._id,
        displayName: 'Main Support Number',
        phoneNumber: '0000000000', // Update this manually if needed
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || 'dummy_phone_id',
        businessAccountId: 'dummy_waba_id',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'dummy_token',
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
        isDefault: true
      });
      console.log('Created Default WhatsApp Account:', defaultWAAccount._id);
    } else {
      console.log('Default WhatsApp Account already exists:', defaultWAAccount._id);
    }

    // 3. Migrate Users
    const usersUpdate = await User.updateMany(
      { companyId: { $exists: false } },
      { 
        $set: { 
          companyId: defaultCompany._id,
          assignedNumbers: [defaultWAAccount._id]
        }
      }
    );
    console.log(`Migrated ${usersUpdate.modifiedCount} Users.`);

    // 4. Migrate Leads
    const leadsUpdate = await Lead.updateMany(
      { companyId: { $exists: false } },
      { 
        $set: { 
          companyId: defaultCompany._id,
          whatsappAccountId: defaultWAAccount._id
        }
      }
    );
    console.log(`Migrated ${leadsUpdate.modifiedCount} Leads.`);

    // 5. Migrate Conversations
    const convUpdate = await Conversation.updateMany(
      { companyId: { $exists: false } },
      { 
        $set: { 
          companyId: defaultCompany._id,
          whatsappAccountId: defaultWAAccount._id
        }
      }
    );
    console.log(`Migrated ${convUpdate.modifiedCount} Conversations.`);

    // 6. Migrate Messages
    const msgUpdate = await Message.updateMany(
      { companyId: { $exists: false } },
      { 
        $set: { 
          companyId: defaultCompany._id,
          whatsappAccountId: defaultWAAccount._id
        }
      }
    );
    console.log(`Migrated ${msgUpdate.modifiedCount} Messages.`);

    console.log('Migration Completed Successfully!');
  } catch (error) {
    console.error('Migration Error:', error);
  } finally {
    mongoose.disconnect();
  }
};

migrate();
