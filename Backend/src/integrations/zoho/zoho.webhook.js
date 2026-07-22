const handleWebhook = async (req, res) => {
    console.log("========== ZOHO WEBHOOK ==========");
    console.log(req.body);
    console.log("=================================");

    res.status(200).json({
        success: true
    });
};

module.exports = {
    handleWebhook
};
