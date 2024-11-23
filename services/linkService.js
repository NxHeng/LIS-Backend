// services/linkService.js
const Link = require('../models/linkModel');
const { v4: uuidv4 } = require('uuid');

const generateLink = async (caseId) => {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 1 * 1000); // Expires in 24 hours

  // Save to database
  const link = new Link({ token, expiresAt, caseId });
  await link.save();

  return token;
};

const validateLink = async (token) => {
  const link = await Link.findOne({ token }).populate({
    path: 'caseId', // Populate the `caseId` field
    populate: [
      { path: 'solicitorInCharge', select: 'username _id' },
      { path: 'clerkInCharge', select: 'username _id' },
      { path: 'category', select: 'categoryName _id' },
    ],
  });

  if (!link) {
    console.log('Link not found');
    return null;
  }

  // Ensure expiration is checked properly
  const currentDate = new Date();
  const expirationDate = new Date(link.expiresAt);
  console.log(`Current Date: ${currentDate}, Expiration Date: ${expirationDate}`);

  if (currentDate > expirationDate) {
    console.log('Link has expired');
    return null; // Return null if the link is expired
  }

  const temporary = true;

  return { caseId: link.caseId, temporary }; // Return the associated case
};

module.exports = {
  generateLink,
  validateLink,
};
