const axios = require('axios');
require('dotenv').config();  // Ensure environment variables are loaded

// Your Zerion API Key
const apiKey = process.env.ZK_DEV_API_KEY;
const wallet = process.env.WALLET;

// Endpoint to fetch the wallet portfolio
const endpoint = `https://api.zerion.io/v1/wallets/${wallet}/portfolio`;

const headers = {
    'Accept': 'application/json',
    authorization: 'Basic emtfZGV2X2RiOWUzNzA3ZGU4NDRkZjk4N2NmNWNhZjUxZmVlMDJiOg=='};

const fetchPortfolio = async () => {
    try {
        const response = await axios.get(endpoint, {
            headers
        });
        if (response.status === 200) {
            const data = response.data;

            console.log("Total Portfolio Value (USD):", data.data.attributes.positions_distribution_by_type.wallet);

        } else {
            console.log("Failed to fetch data:", response.status);
            // console.log("Response:", response.data);
        }
    } catch (error) {
        console.error("Error fetching portfolio data:", error);
    }
};

fetchPortfolio();