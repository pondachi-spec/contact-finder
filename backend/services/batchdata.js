const axios = require('axios');

const API_URL = 'https://api.batchdata.com/api/v1/property/skip-trace';
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function calculateConfidence(sources, lastSeen) {
  if ((sources || []).length >= 2) return 'HIGH';
  const age = Date.now() - new Date(lastSeen || Date.now()).getTime();
  return age < ONE_YEAR_MS ? 'MEDIUM' : 'LOW';
}

function generateMockData(name, address) {
  const rand4 = () => String(Math.floor(Math.random() * 9000) + 1000);
  const rand3 = () => String(Math.floor(Math.random() * 900) + 100);
  const areaCode = rand3();

  const parts = name.trim().split(/\s+/);
  const first = (parts[0] || 'owner').toLowerCase().replace(/[^a-z]/g, '');
  const last = (parts[1] || 'smith').toLowerCase().replace(/[^a-z]/g, '');

  const recentDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
  const oldDate = new Date(Date.now() - 500 * 24 * 60 * 60 * 1000);

  return {
    phones: [
      {
        number: `(${areaCode}) ${rand3()}-${rand4()}`,
        sources: ['Whitepages', 'BeenVerified'],
        lastSeen: recentDate,
        confidence: 'HIGH',
      },
      {
        number: `(${areaCode}) ${rand3()}-${rand4()}`,
        sources: ['Spokeo'],
        lastSeen: recentDate,
        confidence: 'MEDIUM',
      },
      {
        number: `(${rand3()}) ${rand3()}-${rand4()}`,
        sources: ['Intelius'],
        lastSeen: oldDate,
        confidence: 'LOW',
      },
    ],
    emails: [
      {
        address: `${first}.${last}@gmail.com`,
        sources: ['Whitepages', 'PublicRecords'],
        lastSeen: recentDate,
        confidence: 'HIGH',
      },
      {
        address: `${first}${last}@yahoo.com`,
        sources: ['Spokeo'],
        lastSeen: oldDate,
        confidence: 'LOW',
      },
    ],
    isMock: true,
  };
}

async function skipTrace(name, address) {
  const apiKey = process.env.BATCHDATA_API_KEY;

  if (!apiKey) {
    return generateMockData(name, address);
  }

  try {
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const response = await axios.post(
      API_URL,
      {
        requests: [
          {
            propertyAddress: { address },
            firstName,
            lastName,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const property = response.data?.results?.properties?.[0];
    const person = property?.persons?.[0] || {};

    const phones = (person.phones || []).map((p) => {
      const sources = p.sources || ['BatchData'];
      const lastSeen = p.lastReportedDate ? new Date(p.lastReportedDate) : new Date();
      return {
        number: p.phoneNumber || p.number || '',
        sources,
        lastSeen,
        confidence: calculateConfidence(sources, lastSeen),
      };
    });

    const emails = (person.emails || []).map((e) => {
      const sources = e.sources || ['BatchData'];
      const lastSeen = e.lastReportedDate ? new Date(e.lastReportedDate) : new Date();
      return {
        address: e.email || e.address || '',
        sources,
        lastSeen,
        confidence: calculateConfidence(sources, lastSeen),
      };
    });

    return { phones, emails, isMock: false };
  } catch (err) {
    console.error('BatchData API error:', err.message);
    const mock = generateMockData(name, address);
    return { ...mock, apiError: err.message };
  }
}

module.exports = { skipTrace };
