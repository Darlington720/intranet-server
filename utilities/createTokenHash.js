import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { PRIVATE_KEY } from "../config/config";

const SALT_ROUNDS = 10;

const createToken = async (userId) => {
  const token = jwt.sign(
    {
      id: userId,
    },
    PRIVATE_KEY,
    {
      expiresIn: "1d",
    }
  );
  const tokenHash = await bcrypt.hash(token, SALT_ROUNDS);
  return tokenHash;
};

export default createToken;
