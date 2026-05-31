const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertLessThanThousand(num: number): string {
  if (num === 0) return '';
  
  let result = '';
  
  if (num >= 100) {
    result += ONES[Math.floor(num / 100)] + ' Hundred';
    num %= 100;
    if (num > 0) result += ' ';
  }
  
  if (num > 0) {
    if (num < 20) {
      result += ONES[num];
    } else {
      result += TENS[Math.floor(num / 10)];
      const rem = num % 10;
      if (rem > 0) {
        result += ' ' + ONES[rem];
      }
    }
  }
  
  return result;
}

export function convertNumberToWords(amount: number, currency: string = '₹'): string {
  if (amount === 0) {
    return currency === '₹' ? 'Rupees Zero Only' : 'Zero Only';
  }

  // Handle rounding issues for currency
  const roundedAmount = Math.round(amount * 100) / 100;
  const integerPart = Math.floor(roundedAmount);
  const decimalPart = Math.round((roundedAmount - integerPart) * 100);

  let words = '';

  if (integerPart > 0) {
    let num = integerPart;
    const crores = Math.floor(num / 10000000);
    num %= 10000000;
    
    const lakhs = Math.floor(num / 100000);
    num %= 100000;
    
    const thousands = Math.floor(num / 1000);
    num %= 1000;
    
    const remaining = num;

    const parts: string[] = [];

    if (crores > 0) {
      // Crores can exceed 99, so recurse/convert crores fully
      parts.push(
        (crores < 1000 ? convertLessThanThousand(crores) : convertNumberToWords(crores, ''))
          .replace(' Only', '') + ' Crore'
      );
    }
    
    if (lakhs > 0) {
      parts.push(convertLessThanThousand(lakhs) + ' Lakh');
    }
    
    if (thousands > 0) {
      parts.push(convertLessThanThousand(thousands) + ' Thousand');
    }
    
    if (remaining > 0) {
      parts.push(convertLessThanThousand(remaining));
    }

    words = parts.join(' ').trim();
  }

  // Prepend Currency Name
  if (currency === '₹') {
    words = 'Rupees ' + words;
  } else {
    // If not rupees, just use the symbol or word if provided, otherwise default
    words = (currency ? `${currency} ` : '') + words;
  }

  // Handle Paise/cents
  if (decimalPart > 0) {
    const decimalWords = convertLessThanThousand(decimalPart);
    if (integerPart > 0) {
      words += ' and ' + decimalWords + (currency === '₹' ? ' Paise' : ' Cents');
    } else {
      words = decimalWords + (currency === '₹' ? ' Paise' : ' Cents');
    }
  }

  return words.trim() + ' Only';
}
