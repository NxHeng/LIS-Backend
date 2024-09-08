const mongoose = require('mongoose');
const CaseTemplate = require('../models/caseModel');

// Get all case templates
const getCaseTemplates = async (req, res) => {
    try {
        const caseTemplates = await CaseTemplate.find({}).sort({ createdAt: -1 });
        res.status(200).json(caseTemplates);
    } catch(error) {
        res.status(400).json({ error: error.message });
    }
};

// Get a single case template
const getCaseTemplate = async (req, res) => {
    const { id } = req.params;
    //Check id format
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Case template not found' });
    }
    //Find case template by id
    const caseTemplate = await CaseTemplate.findById(id);
    if(!caseTemplate) {
        res.status(404).json({ error: 'Case template not found' });
    }
    res.status(200).json(caseTemplate);
};

// Create a new case template
const createCaseTemplate = async (req, res) => {
    const { templateName, phases } = req.body;
    // Add doc to db
    try{
        const caseTemplate = await CaseTemplate.create({ templateName, phases });
        res.status(200).json(caseTemplate);
    } catch(error) {
        res.status(400).json({ error: error.message });
    }
};

// Update a case template
const updateCaseTemplate = async (req, res) => {
    const { id } = req.params;
    const { templateName, phases } = req.body;
    //Check id format
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Case template not found' });
    }
    //Find case template by id and update
    const caseTemplate = await CaseTemplate.findOneAndUpdate({_id: id}, { 
        ...req.body 
    });
    if(!caseTemplate) {
        res.status(400).json({ error: 'Case template not found' });
    }
    res.status(200).json(caseTemplate);
};

// Delete a case template
const deleteCaseTemplate = async (req, res) => {
    const { id } = req.params;
    //Check id format
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Case template not found' });
    }
    //Find case template by id and delete
    const caseTemplate = await CaseTemplate.findByIdAndDelete(id);
    if(!caseTemplate) {
        res.status(400).json({ error: 'Case template not found' });
    }
    res.status(200).json({ mssg: 'Case template deleted successfully' });
};

module.exports = {
    getCaseTemplates,
    getCaseTemplate,
    createCaseTemplate,
    updateCaseTemplate,
    deleteCaseTemplate
};