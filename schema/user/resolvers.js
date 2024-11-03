import { _db, db, baseUrl } from "../../config/config.js";
import bcrypt from "bcrypt";
import { GraphQLError } from "graphql";

const userResolvers = {
  User: {
    biodata: async (parent) => {
      return await _db("staff")
        .where({
          id: parent.user_id,
        })
        .first();
    },
    last_logged_in: async (parent) => {
      const lastLogin = await _db("management_user_logins")
        .where({
          user_id: parent.user_id,
        })
        .orderBy("id", "desc") // Assuming your table has an 'id' column, replace it with the appropriate column
        .limit(1)
        .offset(1);

      if (!lastLogin[0]) {
        return await _db("management_user_logins")
          .where({
            user_id: parent.user_id,
          })
          .orderBy("id", "desc") // Assuming your table has an 'id' column, replace it with the appropriate column
          .limit(1);
      }

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
        console.log("errror", error);
        throw new GraphQLError(
          "No role is assigned to user yet, Contact system admin to resolve this issue"
        );
      }
    },
  },
  Query: {
    users: async () => {
      const results = await _db("management_users");
      // console.log("roles", results);
      return results;
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

      if (user) {
        const auth = await bcrypt.compare(args.pwd, user.pwd);

        // console.log(auth);
        if (auth) {
          // Access the IP address from the context
          const clientIpAddress = context.req.connection.remoteAddress;

          // console.log(clientIpAddress);
          // store the login data
          await _db("management_user_logins").insert({
            user_id: user.user_id,
            machine_ipaddress: clientIpAddress,
          });

          return user;
        } else {
          throw new GraphQLError("Incorrect Password");
        }
      } else {
        throw new GraphQLError("Invalid Email");
      }
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
