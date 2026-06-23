const whatsappService = require('./whatsappService');
const Lead = require('../models/Lead');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { getIO } = require('../sockets/socketManager');
const { LEAD_STATUS, MESSAGE_DIRECTION, MESSAGE_STATUS, SOCKET_EVENTS } = require('../constants');
const logger = require('../config/logger');

const SERVICES = {
  '1': 'Website Development',
  '2': 'SEO',
  '3': 'Google Ads',
  '4': 'CRM Development',
  '5': 'Other'
};

class BotService {
  async handleIncoming(conversation, lead, incomingText) {
    if (conversation.botStatus === 'HUMAN_ASSIGNED' || conversation.botState === 'COMPLETED') {
      return;
    }

    let replyText = '';
    let nextState = conversation.botState;

    try {
      switch (conversation.botState) {
        case 'ASK_NAME':
          replyText = "Hi 👋 Thank you for contacting us.\n\nTo help you better, please share your name.";
          nextState = 'ASK_PHONE';
          break;

        case 'ASK_PHONE':
          lead.name = incomingText.trim();
          replyText = `Thanks ${lead.name}.\n\nPlease share your phone number.`;
          nextState = 'ASK_SERVICE';
          break;

        case 'ASK_SERVICE':
          // We must NOT overwrite lead.phone because it is the WhatsApp number used for messaging and lookup.
          // Save the customer's typed phone number to alternatePhone.
          lead.alternatePhone = incomingText.trim(); 
          replyText = "Great.\n\nWhat service are you interested in?\n\n1. Website Development\n2. SEO\n3. Google Ads\n4. CRM Development\n5. Other";
          nextState = 'ASK_REQUIREMENT';
          break;

        case 'ASK_REQUIREMENT':
          const option = incomingText.trim();
          lead.selectedService = SERVICES[option] || incomingText.trim();
          replyText = "Thanks.\n\nPlease briefly describe your requirement.";
          nextState = 'FINALIZE';
          break;

        case 'FINALIZE':
          lead.requirement = incomingText.trim();
          lead.status = LEAD_STATUS.QUALIFIED;
          replyText = "Perfect ✅\n\nYour request has been submitted.\n\nOur team will contact you shortly.";
          nextState = 'COMPLETED';
          break;
      }

      // Update Database
      conversation.botState = nextState;
      await Promise.all([
        lead.save(),
        conversation.save()
      ]);

      // Send WhatsApp Reply and Save to DB
      if (replyText) {
        const waResponse = await whatsappService.sendTextMessage(lead.phone, replyText);
        const waMessageId = waResponse?.messages?.[0]?.id;

        const savedMessage = await Message.create({
          conversationId: conversation._id,
          leadId: lead._id,
          direction: MESSAGE_DIRECTION.OUTGOING,
          messageType: 'text',
          message: replyText,
          messageId: waMessageId,
          status: MESSAGE_STATUS.SENT,
          sentAt: new Date(),
        });

        // Update conversation last message again
        conversation.lastMessage = replyText;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        const io = getIO();
        if (io) {
          io.emit(SOCKET_EVENTS.NEW_MESSAGE, {
            conversationId: conversation._id,
            leadId: lead._id,
            message: savedMessage,
          });
          io.emit(SOCKET_EVENTS.CONVERSATION_UPDATED, {
            conversationId: conversation._id,
            leadId: lead._id,
            lastMessage: replyText,
            lastMessageAt: new Date(),
          });
        }

        logger.info(`🤖 Bot replied to ${lead.phone} for state ${nextState}`);
      }

    } catch(err) {
      logger.error('Bot processing error:', err);
    }
  }
}

module.exports = new BotService();
