module.exports = async function(req, res) {
    // CORS headers for local testing (Vercel handles it in prod usually, but good practice)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const KV_REST_API_URL = process.env.KV_REST_API_URL;
    const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
        return res.status(500).json({ error: 'KV database not configured. Please create a KV database in Vercel Storage.' });
    }

    // Attempt to get country from client query, or Vercel edge headers
    let countryCode = req.query.country || req.headers['x-vercel-ip-country'] || 'TR';
    countryCode = countryCode.toUpperCase().substring(0, 2);

    const headers = {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json',
    };

    try {
        const shouldIncrement = req.query.increment === 'true';

        // Increment the count for the given country
        if (shouldIncrement) {
            await fetch(KV_REST_API_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify(['HINCRBY', 'visitor_countries', countryCode, '1'])
            });
        }

        // Fetch all country counts
        const allReq = await fetch(KV_REST_API_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(['HGETALL', 'visitor_countries'])
        });
        
        const allRes = await allReq.json();
        
        // HGETALL returns a flat array: ["TR", "5", "US", "2"]
        const countsArray = allRes.result || [];
        const countriesData = {};
        
        for (let i = 0; i < countsArray.length; i += 2) {
            countriesData[countsArray[i]] = parseInt(countsArray[i+1], 10);
        }

        // Make sure the current country is in the list even if it was just created
        if (!countriesData[countryCode]) {
            countriesData[countryCode] = shouldIncrement ? 1 : 0;
        }

        return res.status(200).json({
            currentCountry: countryCode,
            countries: countriesData
        });

    } catch (error) {
        console.error('Error interacting with Vercel KV:', error);
        return res.status(500).json({ error: 'Database error' });
    }
};
