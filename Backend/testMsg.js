const axios = require('axios');
const token = 'EAA5uXCIC5fYBRyLMR0AAaobLyjzEfxBp8K20WJGPhaoolJ8r4hpiVf7gZB3jLvql86RZBo74XVEaXxjdr7COYWymiH1WAuaOI6Gyp6Oqri95gurtlWULVRlndCWlXZAsLzVfKDjYJbFZAbroprZAU6YdFhNrhiKkg6HC3lZA7ZCzHn6nuTWpzHW9iy5IZBREy2JIgLYr84T2PaV0WUABH9aSUTxbirwG3z9lMOhkZCQRGp1lG31ZBClXQyCTAnwtaeC0AGyroVv6fkkQdM5bvUQQoVzeFf';
const phone_id = '1136068499596386';
const to = '917988701226'; // the number user was trying to message

async function test() {
  try {
    const url = `https://graph.facebook.com/v20.0/${phone_id}/messages`;
    console.log('Sending to URL:', url);
    const res = await axios.post(url, {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: 'Test' }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.log('Error status:', err.response?.status);
    console.log('Error data:', JSON.stringify(err.response?.data, null, 2));
    console.log('Error msg:', err.message);
  }
}
test();
