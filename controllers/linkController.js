// controllers/linkController.js
const linkService = require('../services/linkService');

const generateLink = async (req, res) => {
    const { caseId } = req.body;
    try {
        const token = await linkService.generateLink(caseId);
        res.status(200).json({ token: token });
    } catch (error) {
        res.status(500).json({ message: 'Error generating link', error });
    }
};

const validateLink = async (req, res) => {
    const { token } = req.params;
    try {
        const result = await linkService.validateLink(token); // Call the service
        if (!result) {
            return res.status(404).json({ message: 'Invalid or expired link' });
        }

        const { caseId, temporary } = result; // Destructure the returned object
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
