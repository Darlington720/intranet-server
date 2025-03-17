import { ApolloServer } from "@apollo/server";
// import { startStandaloneServer } from "@apollo/server/standalone";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import cors from "cors";
import { GraphQLError } from "graphql";
import express from "express";
import path from "path";
import http from "http";
import https from "https";
import bcrypt from "bcrypt";
import {
  database,
  port,
  tredumoDB,
  postgraduateDB,
  db,
  host,
  baseUrl,
} from "./config/config.js";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";

import generateRandomString from "./utilities/genrateSystemPwd.js";
// import getNextStdNumber from "./utilities/generateStdno.js";

// import { typeDefs } from "./schema/schema.js";

import { typeDefs, resolvers } from "./schema/index.js";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import bodyParser from "body-parser";
import findImageWithExtension from "./utilities/findImageWithExtension.js";
import { fileURLToPath } from "url";
import authenticateUser from "./middleware/auth.js";
import { format } from "fast-csv";
import { getStudentRegistrationReport } from "./schema/student_registration/resolvers.js";
import { makeExecutableSchema } from "@graphql-tools/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const httpServer = http.createServer(app);

app.use(express.static("public"));

let allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost:2323",
  "http://localhost:2222",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://intranet-j5rr.vercel.app",
  "http://10.211.55.2:3000",
  "http://localhost:8002",
  "http://localhost:8005",
  "http://192.168.1.189:2323",
  "http://tredumo.com:2323",
  "https://tredumo.com/graphql",
];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       console.log("origin", origin);
//       // allow requests with no origin (like mobile apps or curl requests)
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.indexOf(origin) === -1) {
//         let msg =
//           "The CORS policy for this site does not " +
//           "allow access from the specified Origin.";
//         return callback(new Error(msg), false);
//       }
//       return callback(null, true);
//     },
//   })
// );

const getActiveUniversitySession = async () => {
  let sql = "SELECT * FROM university_sessions ORDER BY us_id DESC LIMIT 1";
  const [results, fields] = await db.execute(sql);

  // console.log("the fields", results);
  return results[0];
};

// const resolvers = {
//   Query: {
//     async questions() {
//       try {
//         let sql = `SELECT * FROM questions`;

//         const [results, fields] = await db.execute(sql);
//         // console.log("results", results);
//         return results;
//       } catch (error) {
//         throw new GraphQLError("Error fetching questions");
//       }
//     },
//     async acc_yrs() {
//       const acc_yrs = await database("acc_yrs").orderBy("acc_yr_id", "DESC");
//       //   console.log("year", acc_yrs);
//       return acc_yrs;
//     },
//     async modules() {
//       try {
//         let sql = `SELECT * FROM intranent_modules ORDER BY sort ASC`;

//         const [results, fields] = await db.execute(sql);
//         // console.log("results", results);

//         let updatedModules = [];

//         for (const item of results) {
//           const logo = item.logo;
//           const newItem = { ...item }; // Create a copy of the current item

//           if (logo) {
//             newItem.logo = `${baseUrl}${logo}`; // Update the logo property with the full URL
//           }

//           updatedModules.push(newItem);
//         }

//         return updatedModules;
//       } catch (error) {
//         console.log("error", error);
//         throw new GraphQLError("Error fetching modules");
//       }
//     },
//     async roles() {
//       try {
//         let sql = `SELECT r.* FROM user_roles AS r`;

//         const [results, fields] = await db.execute(sql);
//         // console.log("results", results);
//         return results;
//       } catch (error) {
//         console.log("error", error);
//         throw new GraphQLError("Error fetching modules");
//       }
//     },
//     async schemes() {
//       return await database("scheme_categories");
//     },
//     async intakes() {
//       return await database("intakes");
//     },
//     async scheme(parent, args) {
//       const result = await database("schemes")
//         .where({
//           acc_yr: args.acc_yr,
//           intake_id: args.intake_id,
//           scheme_category_id: args.scheme_category_id,
//         })
//         .first();
//       return result;
//     },
//     async program_choices(parent, args) {
//       const scheme = await database("schemes")
//         .where({
//           acc_yr: args.acc_yr,
//           intake_id: args.intake_id,
//           scheme_category_id: args.scheme_category_id,
//         })
//         .first();

//       if (scheme) {
//         // fetching only the fully filled forms
//         const result = await database("applicant_program_choices")
//           .join(
//             "applicant_bio_data",
//             "applicant_program_choices.applicant_id",
//             "applicant_bio_data.applicant_id"
//           )
//           .where({
//             choice: 1,
//           })
//           .where("applicant_program_choices.scheme_id", "=", scheme.id)
//           .andWhere("applicant_bio_data.form_status", "=", 2)
//           .groupBy("prog_id");

//         // console.log(result);
//         return result;
//       } else {
//         return [];
//       }
//     },
//     async lecturer_course_units(parent, args) {
//       // return courseunits that were allocated to the lecturer based on the active university session
//       // temporarily, we are using the active session but its supposed to be dynamic inorder to allow the users to add previous results
//       const activeUniversitySession = await getActiveUniversitySession();
//       const session_id = activeUniversitySession.us_id;
//       const lecturer_id = args.lecturer_id;

//       let sql = `SELECT
//             s_id as active_session_id,
//             course_unit_name as courseunit_name,
//             sessions.session_name as session,
//             lecturer_id,
//             tt_id as timetable_id
//             FROM lecture_timetable
//             LEFT JOIN sessions ON lecture_timetable.session_id = sessions.session_id
//             WHERE lecturer_id = ? AND s_id = ?`;
//       let values = [lecturer_id, session_id];

//       const [results, fields] = await db.execute(sql, values);
//       // console.log("results", results);
//       return results;
//     },
//     // async applicant_bio_data(parent, args) {
//     //   const result = await database("applicant_bio_data")
//     //     .where({
//     //       applicant_id: args.applicant_id,
//     //       scheme_id: args.scheme_id,
//     //     })
//     //     .first();

//     //   //   console.log(result);
//     //   return result;
//     // },
//     // async other_qualifications(parent, args) {
//     //   const result = await database("other_applicant_qualifications").where({
//     //     applicant_id: args.applicant_id,
//     //     scheme_id: args.scheme_id,
//     //   });

//     //   //   console.log(result);
//     //   return result;
//     // },
//     async applicant_forms(parent, args) {
//       // fetch only completed forms
//       const prog_choices = await database("applicant_program_choices")
//         .join(
//           "applicant_bio_data",
//           "applicant_bio_data.applicant_id",
//           "applicant_program_choices.applicant_id"
//         )
//         .where({
//           prog_id: args.program_id,
//         })
//         .where("applicant_program_choices.scheme_id", "=", args.scheme_id)
//         .andWhere("applicant_bio_data.form_status", "=", 2);

//       if (prog_choices.length > 0) {
//         let arr = [];
//         const x = prog_choices.map(async (choice) => {
//           const result = await database("applicant_bio_data")
//             .join(
//               "admission-users",
//               "applicant_bio_data.applicant_id",
//               "admission-users.id"
//             )
//             .where({
//               scheme_id: args.scheme_id,
//               applicant_id: choice.applicant_id,
//             })

//             .first();

//           arr.push(result);
//         });

//         await Promise.all(x);
//         // console.log("result", arr);
//         return arr;
//       } else {
//         return [];
//       }
//     },
//     async staff_autocomplete(parent, args) {
//       const results = await tredumoDB("staff").where(
//         "staff_name",
//         "like",
//         `%${args.staff_name}%`
//       );

//       return results;
//     },
//     async staff_members(parent, args) {
//       const results = await tredumoDB("staff");
//       return results;
//     },
//     async user_roles(parent, args) {
//       const results = await tredumoDB("user_roles");
//       // console.log("roles", results);
//       return results;
//     },
//     async users(parent, args) {
//       const results = await tredumoDB("management_users");
//       // console.log("roles", results);
//       return results;
//     },
//     async admissible_phd_applicants(parent, args) {
//       const { acc_yr, intake_id } = args;
//       if ((!acc_yr, !intake_id)) {
//         throw new GraphQLError("An unexpected error occurred!");
//       }

//       let newArr = [];
//       // the focus is on postgraduate stds with id = 2
//       const scheme = await database("schemes")
//         .where({
//           acc_yr: acc_yr,
//           intake_id: intake_id,
//           category_id: 2,
//         })
//         .first();

//       if (scheme) {
//         // fetching only the sent postgraduate students that completed getting marks
//         const sent_stds = await database("sent_post_grad_applicants")
//           .join(
//             "postgraduate_courses",
//             "sent_post_grad_applicants.program_id",
//             "postgraduate_courses.id"
//           )
//           .where({
//             scheme_id: scheme.id,
//             completed: 1,
//           })
//           .orderBy("date_sent", "DESC");

//         if (sent_stds.length === 0) {
//           return [];
//         }

//         // now fetching the biodata of the sent applicants
//         const x = await sent_stds.map(async (std) => {
//           const std_biodata = await database("applicant_bio_data")
//             .join(
//               "admission-users",
//               "applicant_bio_data.applicant_id",
//               "admission-users.id"
//             )
//             .where({
//               applicant_id: std.applicant_id,
//               scheme_id: std.scheme_id,
//             })
//             .first();

//           newArr.push(std_biodata);
//         });

//         await Promise.all(x);

//         return newArr;
//       } else {
//         return [];
//       }
//     },
//     async programs_and_courses(parent, args) {
//       // const results = await tredumoDB("programs_and_courses").where({
//       //   parent_id: args.parent_id,
//       // });
//       try {
//         // execute will internally call prepare and query

//         let sql =
//           "SELECT p.*, (SELECT COUNT(*) FROM programs_and_courses AS c WHERE c.parent_id = p.id) AS contents FROM programs_and_courses AS p";
//         let values = [];

//         if (args.parent_id !== null) {
//           sql += " WHERE `parent_id` = ?";
//           values.push(args.parent_id);
//         } else {
//           sql += " WHERE `parent_id` IS NULL";
//         }
//         const [results, fields] = await db.execute(sql, values);

//         return results;
//       } catch (err) {
//         console.log(err);
//       }
//       // console.log("roles", results);
//     },
//   },
//   Scheme: {
//     async scheme_category(parent) {
//       return await database("scheme_categories")
//         .where({
//           scheme_category_id: parent.scheme_category_id,
//         })
//         .first();
//     },
//     async intake(parent) {
//       return await database("intakes")
//         .where({
//           id: parent.intake_id,
//         })
//         .first();
//     },
//     async admission_category(parent) {
//       return await database("admission_categories")
//         .where({
//           id: parent.id,
//         })
//         .first();
//     },
//   },
//   ProgramChoice: {
//     async program(parent) {
//       return await database("postgraduate_courses")
//         .where({
//           id: parent.prog_id,
//         })
//         .first();
//     },
//     async campus(parent) {
//       return await database("campus")
//         .where({
//           cam_id: parent.campus_id,
//         })
//         .first();
//     },
//     async study_time(parent) {
//       return await database("study_times")
//         .where({
//           id: parent.study_time_id,
//         })
//         .first();
//     },
//   },
//   Program: {
//     async studentcount(parent) {
//       // const result = await database("applicant_program_choices")
//       //   .where({
//       //     prog_id: parent.id,
//       //     choice: 1,
//       //   })

//       const result = await database("applicant_program_choices")
//         .join(
//           "applicant_bio_data",
//           "applicant_program_choices.applicant_id",
//           "applicant_bio_data.applicant_id"
//         )
//         .where({
//           choice: 1,
//           prog_id: parent.id,
//         })
//         // .where("applicant_program_choices.scheme_id", "=", scheme.id)
//         .andWhere("applicant_bio_data.form_status", "=", 2)
//         .groupBy("prog_id")
//         .first()
//         .count();

//       // console.log("count", result);
//       return result["count(*)"];
//     },
//   },
//   OlevelInfo: {
//     async olevel_results(parent) {
//       const result = await database("applicant_olevel_subjects")
//         .join(
//           "olevel_subjects",
//           "applicant_olevel_subjects.subject_code",
//           "olevel_subjects.subject_code"
//         )
//         .where({
//           applicant_olevel_info_id: parent.id,
//         });

//       // console.log("olevel", {
//       //   parent,
//       //   result,
//       // });
//       return result;
//     },
//   },
//   OlevelResult: {
//     async subject(parent) {
//       return await database("olevel_subjects")
//         .where({
//           subject_code: parent.subject_code,
//         })
//         .first();
//     },
//   },
//   AlevelInfo: {
//     async alevel_results(parent) {
//       return await database("applicant_alevel_subjects")
//         .join(
//           "alevel_subjects",
//           "applicant_alevel_subjects.subject_code",
//           "alevel_subjects.subject_code"
//         )
//         .where({
//           applicant_alevel_info_id: parent.id,
//         });
//     },
//   },
//   AlevelResult: {
//     async subject(parent) {
//       return await database("alevel_subjects")
//         .where({
//           subject_code: parent.subject_code,
//         })
//         .first();
//     },
//   },
//   ApplicantForm: {
//     async scheme(parent) {
//       return await database("schemes")
//         .where({
//           id: parent.scheme_id,
//         })
//         .first();
//     },
//     async prog_choices(parent) {
//       return await database("applicant_program_choices").where({
//         applicant_id: parent.applicant_id,
//         scheme_id: parent.scheme_id,
//       });
//     },
//     async other_qualifications(parent) {
//       return await database("other_applicant_qualifications").where({
//         applicant_id: parent.applicant_id,
//         scheme_id: parent.scheme_id,
//       });
//     },
//     async olevel_info(parent) {
//       const result = await database("applicant_olevel_info")
//         .where({
//           applicant_id: parent.applicant_id,
//           scheme_id: parent.scheme_id,
//         })
//         .first();
//       // console.log("olevel info", { parent, result });
//       return result;
//     },
//     async alevel_info(parent) {
//       return await database("applicant_alevel_info")
//         .where({
//           applicant_id: parent.applicant_id,
//           scheme_id: parent.scheme_id,
//         })
//         .first();
//     },
//     async referees(parent) {
//       return await database("applicant_referees").where({
//         applicant_id: parent.applicant_id,
//         scheme_id: parent.scheme_id,
//       });
//     },
//     async medical_history(parent) {
//       return await database("applicant_medical_history")
//         .where({
//           applicant_id: parent.applicant_id,
//           scheme_id: parent.scheme_id,
//         })
//         .first();
//     },
//     async next_of_kin(parent) {
//       return await database("applicant_next_of_kin")
//         .where({
//           applicant_id: parent.applicant_id,
//           scheme_id: parent.scheme_id,
//         })
//         .first();
//     },
//     async payments(parent) {
//       return await database("applicant_payment").where({
//         applicant_id: parent.applicant_id,
//         scheme_id: parent.scheme_id,
//       });
//     },
//     async sent_for_marks(parent) {
//       const sent = await database("sent_post_grad_applicants")
//         .where({
//           applicant_id: parent.applicant_id,
//           scheme_id: parent.scheme_id,
//         })
//         .first();

//       if (sent) {
//         return 1;
//       } else {
//         return 0;
//       }
//     },
//     async application_sent_details(parent) {
//       const sent = await database("sent_post_grad_applicants")
//         .where({
//           applicant_id: parent.applicant_id,
//           scheme_id: parent.scheme_id,
//         })
//         .first();
//       return sent;
//     },
//     async pre_admission_marks(parent) {
//       // fetching applicant marks as well
//       const marks = await database("post_grad_pre_admission_exams")
//         .where({
//           applicant_id: parent.applicant_id,
//           scheme_id: parent.scheme_id,
//         })
//         .orderBy("id");
//       return marks;
//     },
//     async admitted(parent) {
//       const record = await database("admitted_students")
//         .where({
//           applicant_id: parent.applicant_id,
//           scheme_id: parent.scheme_id,
//         })
//         .first();

//       if (!record) return false;

//       return true;
//     },
//   },
//   User: {
//     async biodata(parent) {
//       return await tredumoDB("staff")
//         .where({
//           id: parent.user_id,
//         })
//         .first();
//     },
//     async last_logged_in(parent) {
//       const lastLogin = await tredumoDB("management_user_logins")
//         .where({
//           user_id: parent.user_id,
//         })
//         .orderBy("id", "desc") // Assuming your table has an 'id' column, replace it with the appropriate column
//         .limit(1)
//         .offset(1);

//       if (!lastLogin[0]) {
//         return await tredumoDB("management_user_logins")
//           .where({
//             user_id: parent.user_id,
//           })
//           .orderBy("id", "desc") // Assuming your table has an 'id' column, replace it with the appropriate column
//           .limit(1);
//       }

//       return lastLogin;
//     },
//     async role(parent) {
//       try {
//         // i want to get actual modules from `modules`
//         let sql =
//           "SELECT ur.* FROM user_assigned_roles AS r LEFT JOIN user_roles AS ur ON ur.id = r.role_id WHERE r.user_id = ?";
//         let values = [parent.id];

//         const [results, fields] = await db.execute(sql, values);

//         let sql2 =
//           "SELECT * FROM intranent_modules WHERE FIND_IN_SET(id, ?) > 0";

//         let values2 = [results[0] ? results[0].modules : ""];
//         const [results2, fields2] = await db.execute(sql2, values2);
//         //update the url to the module logos for each module
//         let modifiedModules = results2.map((m) => ({
//           ...m,
//           logo: `${baseUrl}${m.logo}`,
//         }));
//         // update the modules
//         results[0]._modules = modifiedModules;

//         // console.log("modules", results[0]);

//         return results[0];
//       } catch (error) {
//         console.log("errror", error);
//         throw new GraphQLError(
//           "No role is assigned to user yet, Contact system admin to resolve this issue"
//         );
//       }
//     },
//   },
//   ApplicationSent: {
//     async program(parent) {
//       return await database("postgraduate_courses")
//         .where({
//           id: parent.program_id,
//         })
//         .first();
//     },
//   },
//   ScheduledCourseUnit: {
//     async lecturer(parent) {
//       const lecturer_id = parent.lecturer_id;
//       let sql = `SELECT * FROM staff WHERE staff_id = ?`;
//       let values = [lecturer_id];

//       const [results, fields] = await db.execute(sql, values);

//       // console.log("results", results);

//       return results[0];
//     },
//   },
//   Mutation: {
//     async addUser(parent, args) {
//       // try {
//       const salt = await bcrypt.genSalt();
//       const sysGenPwd = generateRandomString();

//       const hashedPwd = await bcrypt.hash(sysGenPwd, salt);

//       // console.log("hash", hashedPwd);

//       // lets first check if the account is already created
//       const existingUser = await tredumoDB("management_users")
//         .where({
//           email: args.email,
//         })
//         .first();

//       if (!existingUser) {
//         // save to the db
//         const insertedUser = await tredumoDB("management_users").insert({
//           user_id: args.user_id,
//           email: args.email,
//           pwd: hashedPwd,
//           created_by: args.created_by,
//           sys_gen_pwd: 1, //true
//         });

//         // get the user
//         const user = await tredumoDB("management_users")
//           .where({
//             id: insertedUser[0],
//           })
//           .first();

//         // Also save the role of this user
//         const insertRole = await tredumoDB("user_assigned_roles").insert({
//           user_id: insertedUser[0],
//           role_id: args.role_id,
//           created_by: args.created_by,
//         });

//         return { ...user, pwd: sysGenPwd };
//       } else {
//         throw new GraphQLError("User already has an account");
//       }
//       // } catch (error) {
//       //   console.log("error", error);
//       //   throw new GraphQLError("Something went wrong...");
//       // }
//     },
//     async login(parent, args, context) {
//       const user = await tredumoDB("management_users")
//         .where({
//           email: args.email,
//         })
//         .first();

//       if (user) {
//         const auth = await bcrypt.compare(args.pwd, user.pwd);

//         // console.log(auth);
//         if (auth) {
//           // Access the IP address from the context
//           const clientIpAddress = context.req.connection.remoteAddress;

//           // console.log(clientIpAddress);
//           // store the login data
//           await tredumoDB("management_user_logins").insert({
//             user_id: user.user_id,
//             machine_ipaddress: clientIpAddress,
//           });

//           return user;
//         } else {
//           throw new GraphQLError("Incorrect Password");
//         }
//       } else {
//         throw new GraphQLError("Invalid Email");
//       }
//     },
//     async change_password(parent, args) {
//       const salt = await bcrypt.genSalt();
//       // const sysGenPwd = generateRandomString();

//       const hashedPwd = await bcrypt.hash(args.password, salt);

//       // console.log("hash", hashedPwd);

//       // save to the db
//       const pwdUpdated = await tredumoDB("management_users")
//         .update({
//           pwd: hashedPwd,
//           sys_gen_pwd: 0, //true
//         })
//         .where({
//           id: args.id,
//         });

//       // get the user
//       const user = await tredumoDB("management_users")
//         .where({
//           id: args.id,
//         })
//         .first();

//       // console.log("user", user);

//       return user;
//     },
//     async save_user_sec_qns(parent, args) {
//       // expecting a seriliazed object as qns

//       const { id, qns } = args;

//       // save the questions and answers
//       let sql =
//         "INSERT INTO user_security_qns (user_id, questions) VALUES (?, ?)";
//       let values = [id, qns];

//       const [results, fields] = await db.execute(sql, values);

//       // save to the db
//       const has_set_sec_qns = await tredumoDB("management_users")
//         .update({
//           has_set_sec_qns: 1, //true
//         })
//         .where({
//           id: args.id,
//         });

//       // get the user
//       const user = await tredumoDB("management_users")
//         .where({
//           id: args.id,
//         })
//         .first();

//       // console.log("user", user);

//       return user;
//     },
//     async saveRolePermissions(parent, args) {
//       // expecting a seriliazed object as qns

//       const { role_id, modules } = args;

//       // save the questions and answers
//       let sql1 = "UPDATE user_roles SET modules = ? WHERE id = ?";
//       let values = [modules, role_id];

//       await db.execute(sql1, values);

//       let sql2 = `SELECT r.* FROM user_roles AS r`;

//       const [results, fields] = await db.execute(sql2);
//       // console.log("results", results);
//       return results;
//     },
//     async save_sent_phd_stds(parent, args) {
//       // insert data in db
//       const fieldsToInsert = args.stds.map((std) => ({
//         applicant_id: std.applicantId,
//         scheme_id: std.schemeId,
//         program_id: std.program_id,
//         sent_by: args.sent_by,
//       }));

//       // console.log("received data ", fieldsToInsert);
//       const insert = await database("sent_post_grad_applicants").insert(
//         fieldsToInsert
//       );

//       // supposed to return full details of the forms
//       // console.log("insert ids", insert);
//       return {
//         message: "Data saved successfully",
//       };
//     },
//     async admit_students(parent, args) {
//       let insertedIds = [];
//       let lastAdmitRecord;

//       console.log("the args", args);

//       if (args.stds.length > 0) {
//         try {
//           for (const std of args.stds) {
//             const stdExists = await database("admitted_students")
//               .where({
//                 applicant_id: std.applicantId,
//                 scheme_id: std.schemeId,
//                 program_id: std.program_id,
//               })
//               .first();

//             // Wait for the orderBy and first queries to complete
//             lastAdmitRecord = await database("admitted_students")
//               .orderBy("id", "desc")
//               .first();

//             // console.log("last stdno", lastAdmitRecord);

//             let lastStdno = "";

//             if (lastAdmitRecord !== undefined) {
//               lastStdno = lastAdmitRecord.stdno;
//             } else if (!stdExists) {
//               // If the table is empty and the student doesn't exist, generate initial stdno
//               lastStdno = "";
//             }

//             const stdno = getNextStdNumber(lastStdno);

//             // console.log("generated stdnos", stdno);

//             if (!stdExists) {
//               const insert = await database("admitted_students").insert({
//                 applicant_id: std.applicantId,
//                 scheme_id: std.schemeId,
//                 program_id: std.program_id,
//                 stdno,
//                 admitted_by: args.admitted_by,
//               });

//               insertedIds.push(insert[0]);
//             }

//             // populate the data to 3 tables in the postgraaduate db
//             // the users table

//             // first lets get the biodata from the admissions module
//             const stdBio = await database("admission-users")
//               .join(
//                 "admitted_students",
//                 "admission-users.id",
//                 "admitted_students.applicant_id"
//               )
//               .where("admission-users.id", "=", std.applicantId)
//               .andWhere("admitted_students.scheme_id", "=", std.schemeId)
//               .first();

//             // then, lets check if the student email or stdno already exists in the db
//             const postgradUsers = await postgraduateDB("_users").where(
//               (builder) =>
//                 builder
//                   .where("email", stdBio.email)
//                   .orWhere("email", stdBio.stdno)
//             );

//             // console.log("bio data", stdBio)

//             if (postgradUsers.length === 0) {
//               // no existing email or stdno
//               // now lets insert the students in the users table of the post grad db
//               const salt = await bcrypt.genSalt();
//               // const sysGenPwd = generateRandomString();

//               const hashedPwd = await bcrypt.hash(stdBio.stdno, salt);
//               const fieldsToInsert = {
//                 first_name: stdBio.surname,
//                 last_name: stdBio.other_names,
//                 user_type: "staff",
//                 is_admin: 0,
//                 role_id: 2,
//                 email: stdBio.stdno,
//                 password: hashedPwd,
//                 status: "active",
//                 job_title: "Student",
//                 language: "",
//               };

//               await postgraduateDB.transaction(async (trx) => {
//                 const insertedBio = await trx("_users").insert(fieldsToInsert);

//                 // after insert users, lets now insert into these stds table
//                 const insertedStdBio = await trx("_std_biodata").insert({
//                   user_id: insertedBio[0],
//                   name: stdBio.surname + " " + stdBio.other_names,
//                   stdno: stdBio.stdno,
//                   email: stdBio.email,
//                   phone_no: stdBio.phone_no,
//                   program_id: std.program_id,
//                 });

//                 const currentDate = new Date();
//                 const deadlineDate = new Date();
//                 deadlineDate.setFullYear(currentDate.getFullYear() + 5);

//                 // now lets also insert data in the projects table
//                 const insertedProject = await trx(" _projects").insert({
//                   title: stdBio.surname + " " + stdBio.other_names,
//                   description: stdBio.surname + " " + stdBio.other_names,
//                   project_type: "internal_project",
//                   start_date: new Date(),
//                   deadline: deadlineDate, // five years from now
//                   client_id: 1,
//                   created_date: new Date(),
//                   created_by: args.admitted_by,
//                   status: "open",
//                   std_id: insertedBio[0],
//                 });

//                 // now, lets add the student to the project_members_table
//                 await trx(" _project_members").insert({
//                   user_id: insertedBio[0],
//                   project_id: insertedProject[0],
//                   is_leader: 1,
//                 });
//               });
//             }
//           }
//           return {
//             message: "Students admitted successfully",
//           };
//         } catch (error) {
//           console.log("an error occurred", error);
//         }
//       } else {
//         return {
//           message: "No student was received",
//         };
//       }
//     },
//     async add_program_and_course(parent, args) {
//       // const { code, name, created_by, type, description, parent_id } = args;
//       // console.log("args sent", args);
//       try {
//         const insertion = await tredumoDB("programs_and_courses").insert(args);

//         // retrieve the inserted data and the rest of the data
//         const result = await tredumoDB("programs_and_courses").where({
//           type: args.type,
//         });

//         return result;
//       } catch (error) {
//         throw GraphQLError(error);
//       }
//     },
//   },
// };

app.get("/templates/appraisal_template", (req, res) => {
  // Serve your PDF or other file
  const filePath = path.resolve(
    __dirname,
    "public/templates/appraisal_template.pdf"
  );
  res.sendFile(filePath);
});

app.get("/api/student_image/:stdno", (req, res) => {
  const { stdno } = req.params;
  // console.log("stdno", stdno);
  const image = findImageWithExtension(stdno, "./public/student_photos");
  if (!image) {
    res.sendFile(path.join(__dirname, "/public/student_photos", "empty.jpeg"));
  } else {
    const imagePath = path.join(__dirname, "/public/student_photos", image);
    res.sendFile(imagePath);
  }
});

app.get("/api/test_route", (req, res) => {
  const data = {
    colleges: [
      {
        id: "c9133231-37e2-4a49-a3a5-f81694d1a515-1717754822293",
        college_code: "NKUMBA",
        college_title: "NKUMBA COLLEGE",
        schools: [
          {
            id: "81acdc02-d072-46df-bf9e-ec5a05b63a37-1717757249635",
            school_code: "SBA",
            school_title: "SCHOOL OF BUSINESS ADMINSTRATION",
            levels: [
              {
                id: "059461d7-1630-4d63-8351-c709b82f766b-1718197497254",
                level_code: "CERT",
                level_title: "CERTIFICATE",
                study_times: [
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
              {
                id: "b9fee0fe-da41-4124-bda9-50f9fc257212-1718196373087",
                level_code: "BAC",
                level_title: "BACHELOR",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
              {
                id: "d8f46fc4-04c6-4fec-9afb-74e0b078cb06-1718197523030",
                level_code: "PGD",
                level_title: "POSTGRADUATE DIPLOMA",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                ],
              },
              {
                id: "f4ab523d-cb79-4699-a5b9-d09adc723550-1718197481723",
                level_code: "MAS",
                level_title: "MASTERS",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                ],
              },
              {
                id: "fe088b4f-08f2-450d-a055-9c4dc59c27a8-1718201795943",
                level_code: "DIP",
                level_title: "DIPLOMA",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
            ],
          },
          {
            id: "677ed8d1-406b-4bf9-ae00-dc2324502581-1717757273037",
            school_code: "SCI",
            school_title: "SCHOOL OF COMPUTING AND INFORMATICS",
            levels: [
              {
                id: "059461d7-1630-4d63-8351-c709b82f766b-1718197497254",
                level_code: "CERT",
                level_title: "CERTIFICATE",
                study_times: [
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
              {
                id: "b9fee0fe-da41-4124-bda9-50f9fc257212-1718196373087",
                level_code: "BAC",
                level_title: "BACHELOR",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
              {
                id: "d8f46fc4-04c6-4fec-9afb-74e0b078cb06-1718197523030",
                level_code: "PGD",
                level_title: "POSTGRADUATE DIPLOMA",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                ],
              },
              {
                id: "f4ab523d-cb79-4699-a5b9-d09adc723550-1718197481723",
                level_code: "MAS",
                level_title: "MASTERS",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                ],
              },
              {
                id: "fe088b4f-08f2-450d-a055-9c4dc59c27a8-1718201795943",
                level_code: "DIP",
                level_title: "DIPLOMA",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
            ],
          },
          {
            id: "fa614c77-2096-4946-93be-eb4edaa1b43b-1717757303597",
            school_code: "SCIAD",
            school_title: "SCHOOL OF INDUSTRIAL ART AND DESIGN",
            levels: [
              {
                id: "059461d7-1630-4d63-8351-c709b82f766b-1718197497254",
                level_code: "CERT",
                level_title: "CERTIFICATE",
                study_times: [
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
              {
                id: "b9fee0fe-da41-4124-bda9-50f9fc257212-1718196373087",
                level_code: "BAC",
                level_title: "BACHELOR",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
              {
                id: "f4ab523d-cb79-4699-a5b9-d09adc723550-1718197481723",
                level_code: "MAS",
                level_title: "MASTERS",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                ],
              },
              {
                id: "fe088b4f-08f2-450d-a055-9c4dc59c27a8-1718201795943",
                level_code: "DIP",
                level_title: "DIPLOMA",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
            ],
          },
          {
            id: "47734389-4f44-44cb-8d06-91f998a9caef-1717767708712",
            school_code: "SCOS",
            school_title: "SCHOOL OF SCIENCES",
            levels: [
              {
                id: "059461d7-1630-4d63-8351-c709b82f766b-1718197497254",
                level_code: "CERT",
                level_title: "CERTIFICATE",
                study_times: [
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
              {
                id: "b9fee0fe-da41-4124-bda9-50f9fc257212-1718196373087",
                level_code: "BAC",
                level_title: "BACHELOR",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
              {
                id: "d8f46fc4-04c6-4fec-9afb-74e0b078cb06-1718197523030",
                level_code: "PGD",
                level_title: "POSTGRADUATE DIPLOMA",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                ],
              },
              {
                id: "f4ab523d-cb79-4699-a5b9-d09adc723550-1718197481723",
                level_code: "MAS",
                level_title: "MASTERS",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                ],
              },
              {
                id: "fe088b4f-08f2-450d-a055-9c4dc59c27a8-1718201795943",
                level_code: "DIP",
                level_title: "DIPLOMA",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
            ],
          },
          {
            id: "e1f3992f-4235-4d68-819e-37efdfd7742f-1717757348387",
            school_code: "SEDU",
            school_title: "SCHOOL OF EDUCATION",
            levels: [
              {
                id: "059461d7-1630-4d63-8351-c709b82f766b-1718197497254",
                level_code: "CERT",
                level_title: "CERTIFICATE",
                study_times: [
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
              {
                id: "b9fee0fe-da41-4124-bda9-50f9fc257212-1718196373087",
                level_code: "BAC",
                level_title: "BACHELOR",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
              {
                id: "d8f46fc4-04c6-4fec-9afb-74e0b078cb06-1718197523030",
                level_code: "PGD",
                level_title: "POSTGRADUATE DIPLOMA",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                ],
              },
              {
                id: "f4ab523d-cb79-4699-a5b9-d09adc723550-1718197481723",
                level_code: "MAS",
                level_title: "MASTERS",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                ],
              },
              {
                id: "fe088b4f-08f2-450d-a055-9c4dc59c27a8-1718201795943",
                level_code: "DIP",
                level_title: "DIPLOMA",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
            ],
          },
          {
            id: "aa211426-7ce8-4865-9835-dc8214eb3ddb-1718437296592",
            school_code: "SEHS",
            school_title: "EDUCATION",
            levels: [
              {
                id: "059461d7-1630-4d63-8351-c709b82f766b-1718197497254",
                level_code: "CERT",
                level_title: "CERTIFICATE",
                study_times: [
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
            ],
          },
          {
            id: "9aefb8af-ffcd-4b03-8e96-1a6076b97cd1-1718437326032",
            school_code: "SHES",
            school_title: "SCIENCES",
            levels: [
              {
                id: "059461d7-1630-4d63-8351-c709b82f766b-1718197497254",
                level_code: "CERT",
                level_title: "CERTIFICATE",
                study_times: [
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
            ],
          },
          {
            id: "cf6fbab1-21db-42f6-b555-ad17077a743b-1718437367764",
            school_code: "SHORT",
            school_title: "SHORT COURSES",
            levels: [
              {
                id: "059461d7-1630-4d63-8351-c709b82f766b-1718197497254",
                level_code: "CERT",
                level_title: "CERTIFICATE",
                study_times: [
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
            ],
          },
          {
            id: "1f8ce3a6-c402-4800-aa88-a3dc330063ac-1717757984063",
            school_code: "SLAW",
            school_title: "SCHOOL OF LAW",
            levels: [
              {
                id: "b9fee0fe-da41-4124-bda9-50f9fc257212-1718196373087",
                level_code: "BAC",
                level_title: "BACHELOR",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
              {
                id: "fe088b4f-08f2-450d-a055-9c4dc59c27a8-1718201795943",
                level_code: "DIP",
                level_title: "DIPLOMA",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
            ],
          },
          {
            id: "1228e1eb-fed8-4edb-ba63-8183ec75a9db-1717767672067",
            school_code: "SOSS",
            school_title: "SCHOOL OF SOCIAL SCIENCES",
            levels: [
              {
                id: "059461d7-1630-4d63-8351-c709b82f766b-1718197497254",
                level_code: "CERT",
                level_title: "CERTIFICATE",
                study_times: [
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
              {
                id: "b9fee0fe-da41-4124-bda9-50f9fc257212-1718196373087",
                level_code: "BAC",
                level_title: "BACHELOR",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
              {
                id: "d8f46fc4-04c6-4fec-9afb-74e0b078cb06-1718197523030",
                level_code: "PGD",
                level_title: "POSTGRADUATE DIPLOMA",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                ],
              },
              {
                id: "f4ab523d-cb79-4699-a5b9-d09adc723550-1718197481723",
                level_code: "MAS",
                level_title: "MASTERS",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                ],
              },
              {
                id: "fe088b4f-08f2-450d-a055-9c4dc59c27a8-1718201795943",
                level_code: "DIP",
                level_title: "DIPLOMA",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                  {
                    id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                    study_time_title: "WEEKEND",
                  },
                  {
                    id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                    study_time_title: "DAY",
                  },
                ],
              },
            ],
          },
          {
            id: "885a1b44-ee61-46d9-8306-699cc506ea55-1718437393373",
            school_code: "SPSR",
            school_title: "SCHOOL OF POSTGRADUATE STUDIES AND RESEARCH",
            levels: [
              {
                id: "5cd790d9-e310-41ac-913b-42f2595611ce-1718197547596",
                level_code: "PhD",
                level_title: "POSTGRADUATE DEGREE",
                study_times: [
                  {
                    id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                    study_time_title: "DISTANCE",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    nationality_categories: [
      {
        id: "1",
        category_title: "NATIONAL",
      },
      {
        id: "2",
        category_title: "INTERNATIONAL",
      },
    ],
  };

  const generateTreeDataWithUniqueIds = (data) => {
    return data.colleges.map((college) => ({
      title: college.college_title,
      key: `college-${college.id}`, // Use the college ID with a prefix for uniqueness
      children: college.schools.map((school) => ({
        title: school.school_title,
        key: `school-${college.id}-${school.id}`, // Combine college and school IDs
        children: school.levels.map((level) => ({
          title: level.level_title,
          key: `level-${college.id}-${school.id}-${level.id}`, // Combine college, school, and level IDs
          children: level.study_times.map((studyTime) => ({
            title: studyTime.study_time_title,
            key: `studyTime-${college.id}-${school.id}-${level.id}-${studyTime.id}`, // Unique study time key
            children: data.nationality_categories.map((nationality) => ({
              title: nationality.category_title,
              key: `nationality-${college.id}-${school.id}-${level.id}-${studyTime.id}-${nationality.id}`, // Unique nationality key
            })),
          })),
        })),
      })),
    }));
  };

  const treeData = generateTreeDataWithUniqueIds(data);

  res.send(treeData);
});

// app.get("/download-student-reg-report", async (req, res) => {
//   // await authenticateUser({ req });
//   const {
//     campus_id,
//     college_id,
//     intake_id,
//     acc_yr_id,
//     study_time_id,
//     semester,
//     school_id,
//     course_id,
//   } = req.query;

//   // console.log("query", req.query);

//   try {
//     // Fetch data from the database
//     const results = await getStudentRegistrationReport({
//       campus_id,
//       college_id,
//       intake_id,
//       acc_yr_id,
//       study_time_id,
//       semester,
//       school_id,
//       course_id,
//       details: true,
//     });

//     // Stream CSV data to the response
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="registration_report_${Date.now()}.csv"`
//     );
//     res.setHeader("Content-Type", "text/csv");

//     const csvStream = format({ headers: true });
//     csvStream.pipe(res);
//     results.forEach((row) => csvStream.write(row));
//     csvStream.end();
//   } catch (error) {
//     console.error("Error generating report:", error);
//     res.status(500).send("An error occurred while generating the report.");
//   }
// });

app.get("/download-student-reg-report", async (req, res) => {
  // Ensure user is authenticated if necessary
  // await authenticateUser({ req });

  const {
    campus_id,
    college_id,
    intake_id,
    acc_yr_id,
    study_time_id,
    semester,
    school_id,
    course_id,
  } = req.query;

  try {
    // Fetch data from the database (assuming async call)
    const results = await getStudentRegistrationReport({
      campus_id,
      college_id,
      intake_id,
      acc_yr_id,
      study_time_id,
      semester,
      school_id,
      course_id,
      details: true,
    });

    // Stream CSV data to the response
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="registration_report_${Date.now()}.csv"`
    );
    res.setHeader("Content-Type", "text/csv");

    const csvStream = format({ headers: true });
    csvStream.pipe(res); // Pipes the CSV stream directly to the response

    // Use a chunk-by-chunk streaming mechanism for larger datasets
    results.forEach((row) => {
      csvStream.write(row); // Write each row to the stream
    });

    csvStream.end(); // End the stream once all rows are written
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).send("An error occurred while generating the report.");
  }
});

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create a WebSocket server
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

// Use the WebSocket server with graphql-ws
const wsServerClean = useServer(
  {
    schema,
  },
  wsServer
);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: true,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await wsServerClean.dispose();
          },
        };
      },
    },
  ],
  introspection: true,

  // formatError: (err) => {
  //   // Only expose custom error message and status if it's set
  //   const errorDetails = {
  //     message: err.message,
  //   };

  //   if (err.extensions?.http?.status) {
  //     errorDetails.extensions = {
  //       http: {
  //         status: err.extensions.http.status,
  //       },
  //     };
  //   }

  //   // Avoid exposing stack trace or internal details to the client
  //   return errorDetails;
  // },
});

await server.start();
app.use(
  "/graphql",
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        let msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  }),
  bodyParser.json({ limit: "50mb" }),
  graphqlUploadExpress(),
  expressMiddleware(server, {
    // context: async ({ req }) => ({ token: req.headers.token }),
    context: async ({ req, res }) => {
      const operationName = req.body.operationName;

      // Define operations that do not require authentication
      const exemptOperations = new Set([
        "Login",
        "IntrospectionQuery",
        "studentPortalLogin",
        "applicantLogin",
        "registerApplicant",
        "nationalities",
      ]);

      const studentOperations = new Set([
        "My_details",
        "generatePRT",
        "getCourseUnits",
        "ChangeStdPwd",
        "SaveStdCredentials",
        "std_module_registration",
        "getStudentSelectedModules",
        "removeModule",
        "myResults",
        "studentSemesterEnrollment",
        "selfEnrollment",
        "selfRegister",
        "Graduation_sections",
        "check_graduation_elligibility",
        "verify_student_credentials",
      ]);

      const applicantOperations = new Set([
        "verifyOTP",
        "resendOTP",
        "setApplicantPassword",
        "applicantProfile",
        "changeApplicantPassword",
        "loadRunningSchemes",
        "myApplications",
        "application_details",
        "formRequirements",
        "saveApplicantBioData",
        "applicant_form_sections",
        "advertisedCourses",
        "saveProgramChoices",
        "getUnebCentres",
        "getUnebSubjects",
        "saveUnebResults",
        "saveApplicantQualifications",
        "saveApplicationAttachments",
        "saveNextOfKin",
        "submitApplication",
        "myAdmissions",
        "printAdmissionLetter",
      ]);

      // Authenticate user if the operation is not exempt
      if (!exemptOperations.has(operationName)) {
        try {
          const portalType = req.headers["x-portal-type"];

          const STUDENT_CAN_PERFORM_OPERATION =
            portalType === "student" && studentOperations.has(operationName);
          const APPLICANT_CAN_PERFORM_OPERATION =
            portalType === "applicant" &&
            applicantOperations.has(operationName);

          // console.log("applicant can", APPLICANT_CAN_PERFORM_OPERATION);

          if (
            !STUDENT_CAN_PERFORM_OPERATION &&
            !APPLICANT_CAN_PERFORM_OPERATION &&
            portalType
          ) {
            throw new GraphQLError("User is not supported for this operation");
          }

          await authenticateUser({ req });
        } catch (error) {
          throw new GraphQLError(error.message, {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }
      }

      return { req, res };
    },
  })
);

await new Promise((resolve) => httpServer.listen(port, host, resolve));

// server.applyMiddleware({ app });

// const { url } = await startStandaloneServer(server, {
//   context: ({ req }) => ({ req }),
//   listen: { port: port },
// });

// console.log(url);

console.log(`App running on port ${port}`);

app.listen("2222", () => {
  console.log(`Express server listening on port 2222`);
});
