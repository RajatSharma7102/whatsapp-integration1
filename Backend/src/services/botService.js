const whatsappMessageService = require('./whatsapp/whatsappMessage.service');
const Lead = require('../models/Lead');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { getIO } = require('../sockets/socketManager');
const { LEAD_STATUS, MESSAGE_DIRECTION, MESSAGE_STATUS, SOCKET_EVENTS } = require('../constants');
const logger = require('../config/logger');

// ─── Service Menu ─────────────────────────────────────────────────────────────
const SERVICES_MAP = {
  '1': 'Website Development',
  '2': 'SEO Services',
  '3': 'Google Ads',
  '4': 'CRM Development',
  '5': 'AI Automation',
  '6': 'Mobile App Development',
  '7': 'Social Media Marketing',
  '8': 'Other',
};

const SERVICES_MENU = `Please select the services you are interested in:\n\n1. Website Development\n2. SEO Services\n3. Google Ads\n4. CRM Development\n5. AI Automation\n6. Mobile App Development\n7. Social Media Marketing\n8. Other\n\n_Reply with numbers separated by commas. Example: 1,3,4_`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isValidPhone = (text) => {
  const cleaned = text.replace(/[\s\-\(\)\+]/g, '');
  return /^\d{10,15}$/.test(cleaned);
};

const formatPhoneDisplay = (phone) => {
  if (phone.startsWith('91') && phone.length === 12) {
    return `+91 ${phone.slice(2, 7)} ${phone.slice(7)}`;
  }
  return `+${phone}`;
};

const parseServices = (text) => {
  const parts = text.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
  const selected = [];
  for (const part of parts) {
    if (SERVICES_MAP[part] && !selected.includes(SERVICES_MAP[part])) {
      selected.push(SERVICES_MAP[part]);
    }
  }
  return selected;
};

// ─── Save bot reply to DB + emit socket ──────────────────────────────────────
const saveBotReply = async (whatsappAccount, conversation, lead, replyText, waResponse) => {
  const waMessageId = waResponse?.messages?.[0]?.id;

  const savedMessage = await Message.create({
    companyId: whatsappAccount.companyId,
    whatsappAccountId: whatsappAccount._id,
    conversationId: conversation._id,
    leadId: lead._id,
    direction: MESSAGE_DIRECTION.OUTGOING,
    messageType: 'text',
    message: replyText,
    messageId: waMessageId,
    status: MESSAGE_STATUS.SENT,
    sentAt: new Date(),
  });

  await Conversation.findByIdAndUpdate(conversation._id, {
    lastMessage: replyText,
    lastMessageAt: new Date(),
  });

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

  logger.info(`🤖 Bot replied [${conversation.botState}] → ${lead.phone}`);
  return savedMessage;
};

// ─── Main Handler ─────────────────────────────────────────────────────────────
class BotService {
  async handleIncoming(whatsappAccount, conversation, lead, incomingText, msgType, interactivePayload) {
    // ── GATE: Only stop for HUMAN_ASSIGNED ──────────────────────────────────
    // Bot is active for all states including COMPLETED (keeps listening)
    if (conversation.botStatus === 'HUMAN_ASSIGNED') {
      logger.info(`🤚 Bot skipped — HUMAN_ASSIGNED for ${lead.phone}`);
      return;
    }

    // ── Always reload fresh from DB to avoid stale state ────────────────────
    const freshConv = await Conversation.findById(conversation._id);
    const freshLead = await Lead.findById(lead._id);
    if (!freshConv || !freshLead) return;

    // ── Skip if HUMAN_ASSIGNED in DB ────────────────────────────────────────
    if (freshConv.botStatus === 'HUMAN_ASSIGNED') return;

    let waResponse;

    try {
      logger.info(`🤖 Bot processing state: ${freshConv.botState} for ${freshLead.phone}`);

      switch (freshConv.botState) {

        // ── STEP 1: ANY first message → greet + ask name ──────────────────
        case 'ASK_NAME': {
          const replyText = `👋 Thank you for contacting us.\n\nTo help us assist you better, please provide your full name.`;
          waResponse = await whatsappMessageService.sendTextMessage(whatsappAccount, freshLead.phone, replyText);
          freshConv.botState = 'CONFIRM_NUMBER';
          await freshConv.save();
          await saveBotReply(whatsappAccount, freshConv, freshLead, replyText, waResponse);
          break;
        }

        // ── STEP 2: Got name → confirm WhatsApp number ────────────────────
        case 'CONFIRM_NUMBER': {
          const trimmedName = incomingText.trim();
          if (!trimmedName || trimmedName.length < 2) {
            waResponse = await whatsappMessageService.sendTextMessage(whatsappAccount, freshLead.phone, `Please enter your full name.`);
            await saveBotReply(whatsappAccount, freshConv, freshLead, `Please enter your full name.`, waResponse);
            break;
          }

          freshLead.name = trimmedName;
          await freshLead.save();

          const displayPhone = formatPhoneDisplay(freshLead.phone);
          const bodyText = `Thank you *${freshLead.name}*.\n\nIs this your WhatsApp number?\n\n📱 ${displayPhone}\n\nReply *Yes* or *No*`;

          // Try interactive buttons first, fall back to text
          try {
            waResponse = await whatsappMessageService.sendButtonMessage(whatsappAccount, freshLead.phone, bodyText, [
              { id: 'confirm_yes', title: 'Yes ✅' },
              { id: 'confirm_no', title: 'No ❌' },
            ]);
          } catch (e) {
            // Buttons may fail in sandbox — fall back to text
            logger.warn(`Interactive buttons failed, falling back to text: ${e.message}`);
            waResponse = await whatsappMessageService.sendTextMessage(whatsappAccount, freshLead.phone, bodyText);
          }

          freshConv.botState = 'ASK_PHONE';
          await freshConv.save();
          await saveBotReply(whatsappAccount, freshConv, freshLead, bodyText, waResponse);
          break;
        }

        // ── STEP 3: Confirm or collect phone ──────────────────────────────
        case 'ASK_PHONE': {
          const buttonId = interactivePayload?.button_reply?.id;
          const textLower = incomingText.trim().toLowerCase();

          const isYes = buttonId === 'confirm_yes' || textLower === 'yes' || textLower === 'y' || textLower === 'yes ✅' || textLower === 'haan' || textLower === 'ha';
          const isNo  = buttonId === 'confirm_no'  || textLower === 'no'  || textLower === 'n' || textLower === 'no ❌'  || textLower === 'nahi' || textLower === 'nhi';

          if (isYes) {
            freshLead.contactNumber = freshLead.phone;
            await freshLead.save();

            waResponse = await whatsappMessageService.sendTextMessage(whatsappAccount, freshLead.phone, SERVICES_MENU);
            freshConv.botState = 'ASK_SERVICES';
            freshConv.botMeta = '';
            await freshConv.save();
            await saveBotReply(whatsappAccount, freshConv, freshLead, SERVICES_MENU, waResponse);

          } else if (isNo) {
            const replyText = `Please enter your contact number:\n\nExample: +91 9876543210`;
            waResponse = await whatsappMessageService.sendTextMessage(whatsappAccount, freshLead.phone, replyText);
            freshConv.botMeta = 'WAITING_PHONE_INPUT';
            await freshConv.save();
            await saveBotReply(whatsappAccount, freshConv, freshLead, replyText, waResponse);

          } else if (freshConv.botMeta === 'WAITING_PHONE_INPUT') {
            // User is entering their alternate phone number
            if (!isValidPhone(incomingText)) {
              const replyText = `⚠️ Invalid number format. Please enter a valid phone number.\n\nExample: +91 9876543210`;
              waResponse = await whatsappMessageService.sendTextMessage(whatsappAccount, freshLead.phone, replyText);
              await saveBotReply(whatsappAccount, freshConv, freshLead, replyText, waResponse);
            } else {
              freshLead.contactNumber = incomingText.trim();
              await freshLead.save();

              waResponse = await whatsappMessageService.sendTextMessage(whatsappAccount, freshLead.phone, SERVICES_MENU);
              freshConv.botState = 'ASK_SERVICES';
              freshConv.botMeta = '';
              await freshConv.save();
              await saveBotReply(whatsappAccount, freshConv, freshLead, SERVICES_MENU, waResponse);
            }
          } else {
            // No matching response — re-prompt
            const displayPhone = formatPhoneDisplay(freshLead.phone);
            const replyText = `Please reply *Yes* to confirm ${displayPhone} or *No* to enter a different number.`;
            waResponse = await whatsappMessageService.sendTextMessage(whatsappAccount, freshLead.phone, replyText);
            await saveBotReply(whatsappAccount, freshConv, freshLead, replyText, waResponse);
          }
          break;
        }

        // ── STEP 4: Service selection ─────────────────────────────────────
        case 'ASK_SERVICES': {
          const selected = parseServices(incomingText);

          if (selected.length === 0) {
            const replyText = `⚠️ Please select at least one option by replying with numbers.\n\nExample: *1,3,4*\n\n${SERVICES_MENU}`;
            waResponse = await whatsappMessageService.sendTextMessage(whatsappAccount, freshLead.phone, replyText);
            await saveBotReply(whatsappAccount, freshConv, freshLead, replyText, waResponse);
          } else {
            freshLead.selectedServices = selected;
            await freshLead.save();

            const serviceList = selected.map(s => `• ${s}`).join('\n');
            const replyText = `✅ Got it! You selected:\n${serviceList}\n\nPlease briefly describe your requirement.`;
            waResponse = await whatsappMessageService.sendTextMessage(whatsappAccount, freshLead.phone, replyText);
            freshConv.botState = 'ASK_REQUIREMENT';
            await freshConv.save();
            await saveBotReply(whatsappAccount, freshConv, freshLead, replyText, waResponse);
          }
          break;
        }

        // ── STEP 5: Requirement → Complete ───────────────────────────────
        case 'ASK_REQUIREMENT': {
          if (incomingText.trim().length < 5) {
            const replyText = `Please describe your requirement in a few words.`;
            waResponse = await whatsappMessageService.sendTextMessage(whatsappAccount, freshLead.phone, replyText);
            await saveBotReply(whatsappAccount, freshConv, freshLead, replyText, waResponse);
            break;
          }

          freshLead.requirement = incomingText.trim();
          freshLead.status = LEAD_STATUS.QUALIFIED;
          await freshLead.save();

          const replyText = `✅ Thank you for your enquiry.\n\nOur team has received your request and will contact you shortly.\n\nHave a great day! 🙏`;
          waResponse = await whatsappMessageService.sendTextMessage(whatsappAccount, freshLead.phone, replyText);

          freshConv.botState = 'COMPLETED';
          await freshConv.save();
          await saveBotReply(whatsappAccount, freshConv, freshLead, replyText, waResponse);

          // Emit lead qualified event to CRM
          const io = getIO();
          if (io) io.emit('lead_updated', { lead: freshLead });

          logger.info(`🎯 Lead QUALIFIED: ${freshLead.name} (${freshLead.phone})`);
          break;
        }

        // ── COMPLETED: User sent another message → restart flow ──────────
        case 'COMPLETED': {
          // Reset state and restart onboarding for this user
          freshConv.botState = 'ASK_NAME';
          freshConv.botMeta = '';
          await freshConv.save();

          // Immediately send the greeting
          const replyText = `👋 Thank you for contacting us again.\n\nTo help us assist you better, please provide your full name.`;
          waResponse = await whatsappMessageService.sendTextMessage(whatsappAccount, freshLead.phone, replyText);
          freshConv.botState = 'CONFIRM_NUMBER';
          await freshConv.save();
          await saveBotReply(whatsappAccount, freshConv, freshLead, replyText, waResponse);

          logger.info(`🔄 Bot flow RESTARTED for ${freshLead.phone}`);
          break;
        }

        default:
          logger.warn(`⚠️ Unknown botState: ${freshConv.botState}`);
      }

    } catch (err) {
      logger.error(`Bot error at state [${freshConv.botState}] for ${freshLead.phone}: ${err.message}`);
    }
  }
}

module.exports = new BotService();
