const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { skipTrace } = require('../services/batchdata');

router.post('/', async (req, res) => {
  try {
    const { name, address } = req.body;
    if (!name || !address) {
      return res.status(400).json({ error: 'name and address are required' });
    }

    const normalizedName = name.trim().toLowerCase();
    const normalizedAddress = address.trim().toLowerCase();

    // Check cache
    const cached = await Contact.findOne({
      ownerName: normalizedName,
      propertyAddress: normalizedAddress,
    });

    if (cached) {
      const daysAgo = Math.floor(
        (Date.now() - new Date(cached.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return res.json({
        phones: cached.phones,
        emails: cached.emails,
        isMock: cached.isMock,
        cached: true,
        cachedDaysAgo: daysAgo,
      });
    }

    // Fetch from API
    const result = await skipTrace(name.trim(), address.trim());

    // Save to cache
    await Contact.create({
      ownerName: normalizedName,
      propertyAddress: normalizedAddress,
      phones: result.phones,
      emails: result.emails,
      isMock: result.isMock,
    });

    res.json({
      phones: result.phones,
      emails: result.emails,
      isMock: result.isMock,
      cached: false,
    });
  } catch (err) {
    console.error('Lookup error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
