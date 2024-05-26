const express = require('express');

const router = express.Router();


//Case Routes
router.post('/case', (req, res) => {
    res.json({ mssg: "Create a new case" });
});


//Category Routes
router.get('/category', (req, res) => {
    res.json({ mssg: "GET category list" });
});

router.get('/category/:id', (req, res) => {
    res.json({ mssg: "GET a single category" });
});

router.post('/category', (req, res) => {
    res.json({ mssg: "Create a new category" });
});

router.patch('/category/:id', (req, res) => {
    res.json({ mssg: "Update a category" });
});

router.delete('/category/:id', (req, res) => {
    res.json({ mssg: "Delete a category" });
});


//Template Routes
router.get('/template', (req, res) => {
    res.json({ mssg: "GET template list" });
});

router.get('/template/:id', (req, res) => {
    res.json({ mssg: "GET a single template" });
});

router.post('/template', (req, res) => {
    res.json({ mssg: "Create a new template" });
});

router.patch('/template/:id', (req, res) => {
    res.json({ mssg: "Update a template" });
});

router.delete('/template/:id', (req, res) => {
    res.json({ mssg: "Delete a template" });
});


module.exports = router;