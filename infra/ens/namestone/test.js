// Example usage:
const wallet = '0x2E0558b762D6803DebC6Addd976704A2Da8472Dc';
const company_name = 'namestone';

setName(wallet, company_name)
  .then(company_ens => console.log('Company ENS:', company_ens))
  .catch(error => console.error('Failed to fetch Company ENS:', error));