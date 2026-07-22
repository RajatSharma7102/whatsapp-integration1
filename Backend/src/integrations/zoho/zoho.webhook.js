const handleWebhook = async (req, res) => {
    const payload = req.body;
    // Logic to process incoming webhooks from Zoho
    console.log('Received Zoho Webhook:', payload);
    res.status(200).send('OK');
};

module.exports = {
    handleWebhook
};
