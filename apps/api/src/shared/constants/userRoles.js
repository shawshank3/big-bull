// User Role Constants
const USER_ROLES = {
  CLIENT: 'CLIENT',
  ADVISOR: 'ADVISOR',
};

const USER_ROLE_VALUES = Object.values(USER_ROLES);

// Display labels for user roles
const USER_ROLE_LABELS = {
  [USER_ROLES.CLIENT]: 'Client',
  [USER_ROLES.ADVISOR]: 'Advisor',
};

module.exports = {
  USER_ROLES,
  USER_ROLE_VALUES,
  USER_ROLE_LABELS,
};
