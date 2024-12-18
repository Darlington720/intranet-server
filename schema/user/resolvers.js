import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { _db, db, baseUrl, PRIVATE_KEY } from "../../config/config.js";
import { GraphQLError } from "graphql";

const getUser = async ({ id }) => {
  try {
    if (!id) {
      throw new GraphQLError("User ID is required");
    }

    let values = [];
    let where = "";

    if (id) {
      where += " AND management_users.id = ?";
      values.push(id);
    }

    let sql = `SELECT * FROM management_users WHERE deleted = 0 ${where}`;

    const [results, fields] = await db.execute(sql, values);

    if (!results[0]) {
      throw new GraphQLError(`User not found`);
    }

    return results[0];
  } catch (error) {
    throw new GraphQLError(error.message);
  }
};

export const getUserLastLoginDetails = async ({ user_id, lastRecord }) => {
  let lastLogin;
  if (lastRecord) {
    const fallbackLogin = await _db("management_user_logins")
      .where({
        user_id: user_id,
      })
      .orderBy("id", "desc")
      .limit(1);
    return fallbackLogin;
  } else {
    lastLogin = await _db("management_user_logins")
      .where({
        user_id: user_id,
      })
      .orderBy("id", "desc")
      .limit(1)
      .offset(1);

    if (!lastLogin[0]) {
      const fallbackLogin = await _db("management_user_logins")
        .where({
          user_id: user_id,
        })
        .orderBy("id", "desc")
        .limit(1);
      return fallbackLogin;
    }
  }

  return lastLogin;
};

const userResolvers = {
  Query: {
    my_profile: async (parent, args, context) => {
      const user_id = context.req.user.id;
      const user = await getUser({
        id: user_id,
      });

      return user;
    },
    users: async () => {
      const results = await _db("management_users");
      // console.log("roles", results);
      return results;
    },
  },
  User: {
    biodata: async (parent) => {
      return await _db("staff")
        .where({
          id: parent.user_id,
        })
        .first();
    },
    last_logged_in: async (parent) => {
      const lastLogin = await getUserLastLoginDetails({
        user_id: parent.id,
      });
      return lastLogin;
    },
    role: async (parent) => {
      try {
        // i want to get actual modules from `modules`
        let sql =
          "SELECT ur.* FROM user_assigned_roles AS r LEFT JOIN user_roles AS ur ON ur.id = r.role_id WHERE r.user_id = ?";
        let values = [parent.id];

        const [results, fields] = await db.execute(sql, values);

        let sql2 =
          "SELECT * FROM intranent_modules WHERE FIND_IN_SET(id, ?) > 0 ORDER BY sort ASC";

        let values2 = [results[0] ? results[0].modules : ""];
        const [results2, fields2] = await db.execute(sql2, values2);
        //update the url to the module logos for each module
        let modifiedModules = results2.map((m) => ({
          ...m,
          logo: `${baseUrl}${m.logo}`,
        }));
        // update the modules
        results[0]._modules = modifiedModules;

        // console.log("modules", results[0]);

        return results[0];
      } catch (error) {
        // console.log("errror", error);
        throw new GraphQLError(
          "No role is assigned to user yet, Contact system admin to resolve this issue"
        );
      }
    },
  },

  Mutation: {
    addUser: async (parent, args) => {
      const salt = await bcrypt.genSalt();
      const sysGenPwd = generateRandomString();

      const hashedPwd = await bcrypt.hash(sysGenPwd, salt);

      // console.log("hash", hashedPwd);

      // lets first check if the account is already created
      const existingUser = await _db("management_users")
        .where({
          email: args.email,
        })
        .first();

      if (!existingUser) {
        // save to the db
        const insertedUser = await _db("management_users").insert({
          user_id: args.user_id,
          email: args.email,
          pwd: hashedPwd,
          created_by: args.created_by,
          sys_gen_pwd: 1, //true
        });

        // get the user
        const user = await _db("management_users")
          .where({
            id: insertedUser[0],
          })
          .first();

        // Also save the role of this user
        const insertRole = await _db("user_assigned_roles").insert({
          user_id: insertedUser[0],
          role_id: args.role_id,
          created_by: args.created_by,
        });

        return { ...user, pwd: sysGenPwd };
      } else {
        throw new GraphQLError("User already has an account");
      }
    },
    login: async (parent, args, context) => {
      const user = await _db("management_users")
        .where({
          email: args.email,
        })
        .first();

      if (!user) throw new GraphQLError("Invalid Email or Password");

      const validPassword = await bcrypt.compare(args.pwd, user.pwd);
      if (!validPassword) throw new GraphQLError("Invalid Email or Password");

      if (!user.is_active)
        throw new GraphQLError(
          "Account suspended, Please contact the admin for rectification!!!"
        );

      // Access the IP address from the context
      const clientIpAddress = context.req.connection.remoteAddress;

      const SALT_ROUNDS = 10;
      const token = jwt.sign(
        {
          id: user.id,
        },
        PRIVATE_KEY,
        {
          expiresIn: "1d",
        }
      );

      const tokenHash = await bcrypt.hash(token, SALT_ROUNDS);

      // create session for the login
      await _db("management_user_logins").insert({
        user_id: user.id,
        token_hash: tokenHash,
        machine_ipaddress: clientIpAddress,
      });

      context.res.setHeader("x-auth-token", `Bearer ${token}`);

      return { token };

      // return user;
    },
    unlockSession: async (parent, args, context) => {
      const user_id = context.req.user.id;
      const user = await _db("management_users")
        .where({
          id: user_id,
        })
        .first();

      if (!user) throw new GraphQLError("Invalid User!!!");

      const validPassword = await bcrypt.compare(args.pwd, user.pwd);
      if (!validPassword)
        throw new GraphQLError("Invalid Password, Please try again!");

      if (!user.is_active)
        throw new GraphQLError(
          "Account suspended, Please contact the admin for rectification!!!"
        );

      // Access the IP address from the context
      const clientIpAddress = context.req.connection.remoteAddress;

      const SALT_ROUNDS = 10;
      const token = jwt.sign(
        {
          id: user.id,
        },
        PRIVATE_KEY,
        {
          expiresIn: "1d",
        }
      );

      const tokenHash = await bcrypt.hash(token, SALT_ROUNDS);

      // create session for the login
      await _db("management_user_logins").insert({
        user_id: user.id,
        token_hash: tokenHash,
        machine_ipaddress: clientIpAddress,
      });

      context.res.setHeader("x-auth-token", `Bearer ${token}`);

      return { token };

      // return user;
    },
    change_password: async (parent, args) => {
      const salt = await bcrypt.genSalt();
      // const sysGenPwd = generateRandomString();

      const hashedPwd = await bcrypt.hash(args.password, salt);

      // console.log("hash", hashedPwd);

      // save to the db
      const pwdUpdated = await _db("management_users")
        .update({
          pwd: hashedPwd,
          sys_gen_pwd: 0, //true
        })
        .where({
          id: args.id,
        });

      // get the user
      const user = await _db("management_users")
        .where({
          id: args.id,
        })
        .first();

      // console.log("user", user);

      return user;
    },
    save_user_sec_qns: async (parent, args) => {
      const { id, qns } = args;

      // save the questions and answers
      let sql =
        "INSERT INTO user_security_qns (user_id, questions) VALUES (?, ?)";
      let values = [id, qns];

      const [results, fields] = await db.execute(sql, values);

      // save to the db
      const has_set_sec_qns = await _db("management_users")
        .update({
          has_set_sec_qns: 1, //true
        })
        .where({
          id: args.id,
        });

      // get the user
      const user = await _db("management_users")
        .where({
          id: args.id,
        })
        .first();

      // console.log("user", user);

      return user;
    },
  },
};

export default userResolvers;
