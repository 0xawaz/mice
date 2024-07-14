// If using CommonJS modules
const fetch = require('node-fetch');

// If using ES6 modules
// import fetch from 'node-fetch';

async function setName(wallet, company_name) {
  const url = 'https://namestone.xyz/api/public_v1/set-name';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'f0070856-ed89-4f86-8be6-237ca9458c41'
  };
  const data = {
    domain: 'mice.sh',
    name: company_name,
    address: wallet
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.company_ens;  // Assuming the API returns 'company_ens' field
  } catch (error) {
    console.error('Error:', error);
    throw error;  // Re-throw the error for the caller to handle
  }
}
