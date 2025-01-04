import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";
import { PORTAL_PRIVATE_KEY, PRIVATE_KEY } from "../config/config.js";
import { getUserLastLoginDetails } from "../schema/user/resolvers.js";
import bcrypt from "bcrypt";

const authenticateUser = async ({ req }) => {
  const authHeader = req.headers["authorization"];
  const portalType = req.headers["x-portal-type"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    throw new GraphQLError("Access denied. No token provided.", {
      extensions: { code: "UNAUTHORIZED" },
    });
  }

  let secretKey;
  if (portalType === "student") {
    secretKey = PORTAL_PRIVATE_KEY;
  } else {
    secretKey = PRIVATE_KEY;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    throw new GraphQLError("Invalid or expired token.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  if (!decoded) {
    throw new GraphQLError("Invalid Token.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  if (portalType == "student") {
    req.user = decoded;
    return;
  }

  // Continue with further checks if the token is verified
  const lastLogin = await getUserLastLoginDetails({
    user_id: decoded.id,
    lastRecord: true,
  });

  if (!lastLogin[0])
    throw new GraphQLError("Invalid token...", {
      extensions: { code: "UNAUTHENTICATED" },
    });

  // Check if the token matches the stored token hash
  const tokenInDb = lastLogin[0].token_hash;
  const validToken = await bcrypt.compare(token, tokenInDb);

  if (!validToken)
    throw new GraphQLError("Invalid or expired token....", {
      extensions: { code: "UNAUTHENTICATED" },
    });

  // Set the user on the request if authentication is successful
  req.user = decoded;
};
export default authenticateUser;
