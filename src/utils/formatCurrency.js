
export function formatCurrency(amount, currencyCode = 'GBP') {
    if (typeof amount !== 'number') {
      // Try to coerce to number
      amount = Number(amount);
      if (isNaN(amount)) return ''; 
    }
  

    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  