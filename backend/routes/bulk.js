const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const { v4: uuidv4 } = require('uuid');
const BulkJob = require('../models/BulkJob');
const Contact = require('../models/Contact');
const { skipTrace } = require('../services/batchdata');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Upload CSV and start processing
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const rows = parse(req.file.buffer.toString('utf-8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (!rows.length) return res.status(400).json({ error: 'CSV is empty' });

    // Normalize column names
    const normalized = rows.map((r) => {
      const keys = Object.keys(r).map((k) => k.toLowerCase().trim());
      const vals = Object.values(r);
      const obj = {};
      keys.forEach((k, i) => (obj[k] = vals[i]));
      return {
        name: obj.name || obj['owner name'] || obj.owner || '',
        address: obj.address || obj['property address'] || obj['propertyaddress'] || '',
      };
    }).filter((r) => r.name && r.address);

    if (!normalized.length) {
      return res.status(400).json({ error: 'CSV must have "name" and "address" columns' });
    }

    const jobId = uuidv4();
    const job = await BulkJob.create({
      jobId,
      status: 'pending',
      totalRecords: normalized.length,
      processedRecords: 0,
    });

    // Process async in background
    processBulkJob(jobId, normalized);

    res.json({ jobId, totalRecords: normalized.length });
  } catch (err) {
    console.error('Bulk upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get job status
router.get('/status/:jobId', async (req, res) => {
  try {
    const job = await BulkJob.findOne({ jobId: req.params.jobId }).select(
      'jobId status totalRecords processedRecords error createdAt'
    );
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download completed CSV
router.get('/download/:jobId', async (req, res) => {
  try {
    const job = await BulkJob.findOne({ jobId: req.params.jobId });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Job not completed yet' });
    }

    const csvData = job.results.map((r) => ({
      Name: r.name,
      Address: r.address,
      'Phone 1': r.phone1 || '',
      'Phone 1 Confidence': r.phone1Confidence || '',
      'Phone 2': r.phone2 || '',
      'Phone 2 Confidence': r.phone2Confidence || '',
      'Email 1': r.email1 || '',
      'Email 1 Confidence': r.email1Confidence || '',
      'Email 2': r.email2 || '',
      'Email 2 Confidence': r.email2Confidence || '',
      Status: r.status || '',
    }));

    const csv = stringify(csvData, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="contacts-${job.jobId.slice(0, 8)}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function processBulkJob(jobId, records) {
  try {
    await BulkJob.updateOne({ jobId }, { status: 'processing' });

    const BATCH_SIZE = 10;
    const results = [];

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (record) => {
          try {
            const normalizedName = record.name.trim().toLowerCase();
            const normalizedAddress = record.address.trim().toLowerCase();

            let data;
            const cached = await Contact.findOne({
              ownerName: normalizedName,
              propertyAddress: normalizedAddress,
            });

            if (cached) {
              data = { phones: cached.phones, emails: cached.emails, isMock: cached.isMock };
            } else {
              data = await skipTrace(record.name.trim(), record.address.trim());
              await Contact.create({
                ownerName: normalizedName,
                propertyAddress: normalizedAddress,
                phones: data.phones,
                emails: data.emails,
                isMock: data.isMock,
              });
            }

            return {
              name: record.name,
              address: record.address,
              phone1: data.phones?.[0]?.number || '',
              phone1Confidence: data.phones?.[0]?.confidence || '',
              phone2: data.phones?.[1]?.number || '',
              phone2Confidence: data.phones?.[1]?.confidence || '',
              email1: data.emails?.[0]?.address || '',
              email1Confidence: data.emails?.[0]?.confidence || '',
              email2: data.emails?.[1]?.address || '',
              email2Confidence: data.emails?.[1]?.confidence || '',
              status: 'found',
            };
          } catch (err) {
            return {
              name: record.name,
              address: record.address,
              phone1: '', phone1Confidence: '',
              phone2: '', phone2Confidence: '',
              email1: '', email1Confidence: '',
              email2: '', email2Confidence: '',
              status: 'error',
            };
          }
        })
      );

      results.push(...batchResults);

      await BulkJob.updateOne(
        { jobId },
        { processedRecords: Math.min(i + BATCH_SIZE, records.length) }
      );

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < records.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    await BulkJob.updateOne(
      { jobId },
      { status: 'completed', processedRecords: records.length, results }
    );
  } catch (err) {
    console.error('Bulk job error:', err);
    await BulkJob.updateOne({ jobId }, { status: 'failed', error: err.message });
  }
}

module.exports = router;
