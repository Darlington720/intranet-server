import { GraphQLError } from "graphql";
import hasPermission from "./hasPermission.js";

function checkPermission(
  userPermissions,
  permissionKey,
  errorMessage = "You do not have permissions to perform this action"
) {
  if (!hasPermission(userPermissions, permissionKey)) {
    throw new GraphQLError(errorMessage);
  }
}

export default checkPermission;
