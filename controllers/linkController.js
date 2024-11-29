// controllers/linkController.js
const linkService = require('../services/linkService');

const generateLink = async (req, res) => {
    const { caseId } = req.body;
    try {
        const { token, qrCode, url } = await linkService.generateLink(caseId);
        res.status(200).json({ token, qrCode, url });
    } catch (error) {
        res.status(500).json({ message: 'Error generating link and QR code', error });
    }
};

const validateLink = async (req, res) => {
    const { token } = req.params;
    try {
        const result = await linkService.validateLink(token);
        if (!result) {
            return res.status(404).json({ message: 'Invalid or expired link' });
        }

        const { caseId, temporary } = result;
        res.status(200).json({ caseData: caseId, temporary });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ message: 'Error validating link', error });
    }
};

module.exports = {
    generateLink,
    validateLink,
};
