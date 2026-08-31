import axios from 'axios';

/**
 * Sanitizes the phone number to separate the country code from the 10-digit mobile number.
 * e.g., "+919876543210" -> countryCode: "91", sendTo: "9876543210"
 *       "9876543210" -> countryCode: "91", sendTo: "9876543210"
 */
export function sanitizePhoneNumber(phone: string): { countryCode: string; sendTo: string } {
  const cleanDigits = phone.replace(/\D/g, '');
  
  let countryCode = '91';
  let sendTo = cleanDigits;
  
  if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) {
    sendTo = cleanDigits.slice(2);
  } else if (cleanDigits.length > 10) {
    sendTo = cleanDigits.slice(-10);
    countryCode = cleanDigits.slice(0, cleanDigits.length - 10);
  }
  
  return { countryCode, sendTo };
}

/**
 * Sends a WhatsApp template message using the Zaple v2 API.
 * 
 * @param {string} to - The recipient's phone number.
 * @param {string} templateId - The Zaple template ID.
 * @param {string} code - The dynamic OTP/verification code.
 * @returns {Promise<{success: boolean; data?: any; error?: any}>}
 */
export async function sendWhatsAppMessage(
  to: string,
  templateId: string,
  code: string,
): Promise<{ success: boolean; data?: any; error?: any }> {
  const url = 'https://app.zaple.ai/api/v2/send-template-message';
  
  const { countryCode, sendTo } = sanitizePhoneNumber(to);
  
  // Create URL-encoded form data using native URLSearchParams
  const payload = new URLSearchParams({
    template_id: templateId,
    country_code: countryCode,
    send_to: sendTo,
    template_argument1: code,
    button_payload1: code,
    button_text_1: code,
    quick_reply_payload1: code,
  }).toString();

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Zaple-Api-Key': process.env.ZAPLE_API_KEY,
        'Zaple-Api-Secret': process.env.ZAPLE_API_SECRET,
      },
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('WhatsApp API Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}
