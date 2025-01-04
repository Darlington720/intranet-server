/**
 * Permission Checker
 * @param {Object} userPermissions - The user's permissions object.
 * @param {string} permissionKey - The key of the permission to check.
 * @returns {boolean} - Whether the user is eligible (true) or not (false).
 */
const hasPermission = (userPermissions, permissionKey) => {
  if (!userPermissions || typeof userPermissions !== "object") {
    // console.error("Invalid user permissions object.");
    return false;
  }

  return Boolean(userPermissions[permissionKey]);
};

export default hasPermission;
