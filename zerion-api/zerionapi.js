const axios = require('axios');
const base64 = require('base-64');

// Your Zerion API Key
const apiKey = 'zk_dev_db9e3707de844df987cf5caf51fee02b';

// Endpoint to fetch the wallet portfolio
const endpoint = 'https://api.zerion.io/v1/wallets/0x11096722c0368f4C4343eA544033cF519eFb9275/portfolio';

// Encoding the API key for Basic Auth
const authValue = base64.encode(`${apiKey}:`);

const headers = {
    'Accept': 'application/json',
    'Authorization': `Basic ${authValue}`
};

const fetchPortfolio = async () => {
    try {
        const response = await axios.get(endpoint, { headers });
        if (response.status === 200) {
            const data = response.data;
            console.log("Total Portfolio Value (USD):", data.data.attributes.total_value_usd);
        } else {
            console.log("Failed to fetch data:", response.status);
            console.log("Response:", response.data);
        }
    } catch (error) {
        console.error("Error fetching portfolio data:", error);
    }
};

fetchPortfolio();