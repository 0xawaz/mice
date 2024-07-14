async function setName(wallet, company_name) {
    const fetch = (await import('node-fetch')).default; // Dynamic import
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
  
  // Example usage:
  const wallet = '0x2E0558b762D6803DebC6Addd976704A2Da8472Dc';
  const company_name = '0xawaz';
  
  setName(wallet, company_name)
    .then(company_ens => console.log('Company ENS:', company_ens))
    .catch(error => console.error('Failed to fetch Company ENS:', error));

  
  