import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { _db, db, baseUrl, PRIVATE_KEY } from "../../config/config.js";
import { GraphQLError } from "graphql";
import { getEmployees } from "../employee/resolvers.js";
import saveData from "../../utilities/db/saveData.js";
import generatePassword from "../../utilities/generatePassword.js";
import sendEmail from "../../utilities/emails/admission-mail.js";
import saveDataWithOutDuplicates from "../../utilities/db/saveDataWithOutDuplicates.js";
import { getUserRoles } from "../user_role/resolvers.js";
import { getRoles } from "../role/resolvers.js";

const getUsers = async () => {
  try {
    let sql = "SELECT * FROM management_users WHERE deleted = 0";
    const [results] = await db.execute(sql);

    return results;
  } catch (error) {
    throw new GraphQLError(error.message);
  }
};

const getUser = async ({ id, user_id }) => {
  try {
    if (!id && !user_id) {
      throw new GraphQLError("User ID is required");
    }

    let values = [];
    let where = "";

    if (id) {
      where += " AND management_users.id = ?";
      values.push(id);
    }

    if (user_id) {
      where += " AND management_users.user_id = ?";
      values.push(user_id);
    }

    let sql = `SELECT * FROM management_users WHERE deleted = 0 ${where}`;

    const [results] = await db.execute(sql, values);

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
      // console.log("user id", user_id);
      const user = await getUser({
        user_id: user_id,
      });

      return user;
    },
    users: async () => {
      const users = getUsers();

      return users;
    },
  },
  User: {
    biodata: async (parent) => {
      const results = await getEmployees({
        id: parent.user_id,
      });
      // console.log("employee", results);
      return results[0];
    },
    last_logged_in: async (parent) => {
      const lastLogin = await getUserLastLoginDetails({
        user_id: parent.user_id,
      });
      return lastLogin;
    },
    role: async (parent) => {
      try {
        // i want to get actual modules from `modules`

        const results = await getRoles({
          id: parent.role_id,
        });

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

      // using the role_id, to get the role of the user
      const [role] = await getRoles({
        id: user.role_id,
      });

      if (!role) throw new GraphQLError("User has no role in the system!");

      const firstExtract = JSON.parse(role.permissions);

      const permissionsObj = JSON.parse(firstExtract);

      const SALT_ROUNDS = 10;
      const token = jwt.sign(
        {
          id: user.user_id,
          permissions: permissionsObj,
        },
        PRIVATE_KEY,
        {
          expiresIn: "1d",
        }
      );

      const tokenHash = await bcrypt.hash(token, SALT_ROUNDS);

      // create session for the login
      await _db("management_user_logins").insert({
        user_id: user.user_id,
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
          user_id: user_id,
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
          id: user.user_id,
        },
        PRIVATE_KEY,
        {
          expiresIn: "1d",
        }
      );

      const tokenHash = await bcrypt.hash(token, SALT_ROUNDS);

      // create session for the login
      await _db("management_user_logins").insert({
        user_id: user.user_id,
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
    addNewUser: async (parent, args, context) => {
      const active_user_id = context.req.user.id;
      const { user_id, role_id, employee_id } = args.payload;
      let connection = await db.getConnection();

      try {
        await connection.beginTransaction();
        // first, we need to check and see if we have the employee email in our records
        const employees = await getEmployees({
          id: employee_id,
        });

        if (!employees[0] || !employees[0].email)
          throw new GraphQLError(
            "No email found for the employee, Please contact the Human Resource Department to assign the employee email"
          );

        // generate unique password for employee
        const salt = await bcrypt.genSalt();
        const password = await generatePassword();
        const hashedPwd = await bcrypt.hash(password, salt);

        const data = {
          user_id: employee_id,
          email: user_id,
          role_id,
          pwd: hashedPwd,
          created_on: new Date(),
          created_by: active_user_id,
          sys_gen_pwd: 1,
        };

        // lets first check if the account was already created

        // then save in the db
        await saveDataWithOutDuplicates({
          table: "management_users",
          data: data,
          uniqueField: "user_id",
          connection: connection,
        });

        // after successful creation, send an email to the employee along with his credentials
        await sendEmail({
          to: employees[0].email,
          subject: "Nkumba University Account Creation",
          message: `Dear ${employees[0].salutation} ${employees[0].surname} ${employees[0].other_names},\n\nYour account has been created \n\n This are your credentails: \n user_id: ${user_id} \n password: ${password} \n\n Please note that you are strongly enouraged to change your password after the first login.`,
        });

        await connection.commit();

        return {
          success: "true",
          message:
            "User created successfully, An email has been sent to the staff's registered email containg the login credentials.",
        };
      } catch (error) {
        await connection.rollback();
        throw new GraphQLError(error.message);
      } finally {
        connection.release(); // Always release the connection back to the pool
      }
    },
  },
};

export default userResolvers;
