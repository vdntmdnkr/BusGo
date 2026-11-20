/**
 * src/utils/phoneValidator.js
 * Comprehensive phone number validation by country code.
 */

const COUNTRY_RULES = {
  '+91': {
    name: 'India',
    flag: '🇮🇳',
    code: '+91',
    digits: 10,
    pattern: /^[6-9]\d{9}$/,
    example: '9876543210',
    description: '10 digits starting with 6, 7, 8, or 9',
  },
  '+1': {
    name: 'United States / Canada',
    flag: '🇺🇸',
    code: '+1',
    digits: 10,
    pattern: /^[2-9]\d{2}[2-9]\d{6}$/,
    example: '4155552671',
    description: '10 digits standard North American number',
  },
  '+44': {
    name: 'United Kingdom',
    flag: '🇬🇧',
    code: '+44',
    digits: [10, 11],
    pattern: /^[1-9]\d{9,10}$/,
    example: '7911123456',
    description: '10 to 11 digits',
  },
  '+971': {
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    code: '+971',
    digits: 9,
    pattern: /^5\d{8}$/,
    example: '501234567',
    description: '9 digits starting with 5',
  },
  '+65': {
    name: 'Singapore',
    flag: '🇸🇬',
    code: '+65',
    digits: 8,
    pattern: /^[89]\d{7}$/,
    example: '81234567',
    description: '8 digits starting with 8 or 9',
  },
  '+61': {
    name: 'Australia',
    flag: '🇦🇺',
    code: '+61',
    digits: 9,
    pattern: /^4\d{8}$/,
    example: '412345678',
    description: '9 digits starting with 4',
  },
  '+49': {
    name: 'Germany',
    flag: '🇩🇪',
    code: '+49',
    digits: [10, 11],
    pattern: /^[1-9]\d{9,10}$/,
    example: '15123456789',
    description: '10 to 11 digits',
  },
  '+966': {
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    code: '+966',
    digits: 9,
    pattern: /^5\d{8}$/,
    example: '512345678',
    description: '9 digits starting with 5',
  },
  '+60': {
    name: 'Malaysia',
    flag: '🇲🇾',
    code: '+60',
    digits: [9, 10],
    pattern: /^1\d{8,9}$/,
    example: '123456789',
    description: '9 to 10 digits starting with 1',
  },
  '+974': {
    name: 'Qatar',
    flag: '🇶🇦',
    code: '+974',
    digits: 8,
    pattern: /^[3567]\d{7}$/,
    example: '55123456',
    description: '8 digits',
  },
};

/**
 * Validates a phone number against its country dialing code.
 * @param {string} countryCode e.g. "+91"
 * @param {string} phone e.g. "9876543210"
 * @returns {{ isValid: boolean, message?: string, cleanedPhone: string, formatted: string }}
 */
function validatePhoneNumber(countryCode = '+91', phone = '') {
  if (!phone) {
    return { isValid: false, message: 'Phone number is required', cleanedPhone: '', formatted: '' };
  }

  // Remove whitespace, dashes, parens
  const cleaned = String(phone).replace(/[\s\-\(\)]/g, '');

  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, message: 'Phone number must contain only numeric digits', cleanedPhone: cleaned, formatted: '' };
  }

  const rule = COUNTRY_RULES[countryCode];
  if (rule) {
    if (!rule.pattern.test(cleaned)) {
      return {
        isValid: false,
        message: `Invalid ${rule.name} phone number. Expected: ${rule.description} (e.g. ${rule.example})`,
        cleanedPhone: cleaned,
        formatted: `${countryCode} ${cleaned}`,
      };
    }
    return {
      isValid: true,
      cleanedPhone: cleaned,
      formatted: `${countryCode} ${cleaned}`,
    };
  }

  // Generic international fallback (ITU E.164: 7 to 15 digits)
  if (cleaned.length < 7 || cleaned.length > 15) {
    return {
      isValid: false,
      message: 'International phone number must be between 7 and 15 digits',
      cleanedPhone: cleaned,
      formatted: `${countryCode} ${cleaned}`,
    };
  }

  return {
    isValid: true,
    cleanedPhone: cleaned,
    formatted: `${countryCode} ${cleaned}`,
  };
}

module.exports = {
  COUNTRY_RULES,
  validatePhoneNumber,
};
