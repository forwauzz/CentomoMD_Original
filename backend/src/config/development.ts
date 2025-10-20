// Development configuration for auth bypass
export const DEV_CONFIG = {
  // Development user that will be used when auth is bypassed
  MOCK_USER: {
    id: 'f139a26d-2467-40b3-ac0b-6206f4ff95c6',
    email: 'dev@centomo.com',
    user_metadata: { 
      role: 'physician',
      clinic_id: null // Will be set when user selects clinic
    },
    user_id: 'f139a26d-2467-40b3-ac0b-6206f4ff95c6',
    name: 'Dev User',
    role: 'physician'
  },
  
  // Alternative users for testing different scenarios
  TEST_USERS: {
    physician: {
      id: 'f139a26d-2467-40b3-ac0b-6206f4ff95c6',
      email: 'physician@centomo.com',
      user_metadata: { role: 'physician' },
      user_id: 'f139a26d-2467-40b3-ac0b-6206f4ff95c6',
      name: 'Physician User',
      role: 'physician'
    },
    admin: {
      id: 'ba8f1caf-67a3-41c0-8ee0-4669bdcab4ca',
      email: 'admin@centomo.com',
      user_metadata: { role: 'admin' },
      user_id: 'ba8f1caf-67a3-41c0-8ee0-4669bdcab4ca',
      name: 'Admin User',
      role: 'admin'
    }
  }
};

// Check if we're in development mode with auth disabled
export const isDevelopmentMode = () => {
  return process.env['NODE_ENV'] === 'development' && 
         process.env['AUTH_REQUIRED'] === 'false';
};

// Get the appropriate user for development
export const getDevelopmentUser = (userType: 'default' | 'physician' | 'admin' = 'default') => {
  if (userType === 'default') return DEV_CONFIG.MOCK_USER;
  return DEV_CONFIG.TEST_USERS[userType];
};
