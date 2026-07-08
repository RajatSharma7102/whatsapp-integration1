/**
 * Meta WhatsApp Embedded Signup Flow
 * Docs: https://developers.facebook.com/docs/whatsapp/embedded-signup
 */

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: any;
  }
}

// Listen for messages from the Meta Embedded Signup popup
let embeddedSignupResolver: ((val: any) => void) | null = null;
let embeddedSignupRejecter: ((err: Error) => void) | null = null;

// This gets called by Meta's popup with real WABA + phone number data
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://www.facebook.com') return;
  try {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    if (data?.type === 'WA_EMBEDDED_SIGNUP') {
      const { phone_number_id, waba_id } = data.data || {};
      if (phone_number_id && waba_id && embeddedSignupResolver) {
        // Store for use after FB.login completes
        (window as any)._waEmbeddedData = { phone_number_id, waba_id };
      }
    }
  } catch (_) {}
});

export const launchWhatsAppSignup = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      return reject(new Error('Facebook SDK not loaded. Please refresh and try again.'));
    }

    embeddedSignupResolver = resolve;
    embeddedSignupRejecter = reject;
    (window as any)._waEmbeddedData = null;

    window.FB.login(async (response: any) => {
      if (!response.authResponse) {
        return reject(new Error('User cancelled login or did not fully authorize.'));
      }

      const accessToken = response.authResponse.accessToken;
      const embeddedData = (window as any)._waEmbeddedData;

      if (embeddedData?.phone_number_id && embeddedData?.waba_id) {
        // Use real data from Embedded Signup callback
        try {
          // Fetch phone number details from Graph API
          const phoneRes = await fetch(
            `https://graph.facebook.com/v20.0/${embeddedData.phone_number_id}?fields=display_phone_number,verified_name&access_token=${accessToken}`
          );
          const phoneData = await phoneRes.json();

          resolve({
            access_token: accessToken,
            waba_id: embeddedData.waba_id,
            phone_number_id: embeddedData.phone_number_id,
            display_name: phoneData?.verified_name || 'WhatsApp Number',
            phone_number: phoneData?.display_phone_number || '',
          });
        } catch {
          // Fallback if graph API fails
          resolve({
            access_token: accessToken,
            waba_id: embeddedData.waba_id,
            phone_number_id: embeddedData.phone_number_id,
            display_name: 'WhatsApp Number',
            phone_number: '',
          });
        }
      } else {
        // Embedded Signup data not received via postMessage
        // Try to fetch WABA info directly from Graph API
        try {
          const meRes = await fetch(
            `https://graph.facebook.com/v20.0/me?fields=name&access_token=${accessToken}`
          );
          const meData = await meRes.json();

          // Get user's WABA accounts
          const wabaRes = await fetch(
            `https://graph.facebook.com/v20.0/me/businesses?access_token=${accessToken}`
          );
          const wabaData = await wabaRes.json();
          const wabaId = wabaData?.data?.[0]?.id;

          if (!wabaId) {
            return reject(new Error('Could not retrieve WhatsApp Business Account. Please ensure your Meta App has whatsapp_business_management permission.'));
          }

          // Get phone numbers for this WABA
          const phonesRes = await fetch(
            `https://graph.facebook.com/v20.0/${wabaId}/phone_numbers?access_token=${accessToken}`
          );
          const phonesData = await phonesRes.json();
          const firstPhone = phonesData?.data?.[0];

          if (!firstPhone) {
            return reject(new Error('No phone numbers found in this WhatsApp Business Account.'));
          }

          resolve({
            access_token: accessToken,
            waba_id: wabaId,
            phone_number_id: firstPhone.id,
            display_name: firstPhone.verified_name || meData?.name || 'WhatsApp Number',
            phone_number: firstPhone.display_phone_number || '',
          });
        } catch (err: any) {
          reject(new Error('Failed to retrieve WhatsApp account details: ' + err.message));
        }
      }
    }, {
      config_id: '1401977855100439',
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {},
        featureType: '',
        sessionInfoVersion: '3',
      }
    });
  });
};
