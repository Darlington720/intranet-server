import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { GraphQLError } from "graphql";
import express from "express";
import bcrypt from "bcrypt";
import {
  database,
  port,
  tredumoDB,
  postgraduateDB,
  db,
  baseUrl,
} from "./config/config.js";
import generateRandomString from "./utilities/genrateSystemPwd.js";
import getNextStdNumber from "./utilities/generateStdno.js";

import { typeDefs } from "./schema/_schema.js";

const app = express();

app.use(express.static("public"));

const getActiveUniversitySession = async () => {
  let sql = "SELECT * FROM university_sessions ORDER BY us_id DESC LIMIT 1";
  const [results, fields] = await db.execute(sql);

  // console.log("the fields", results);
  return results[0];
};

const resolvers = {
  Query: {},
  School: {
    async departments(parent) {
      try {
        let school_id = parent.id;
        let sql = `SELECT * FROM departments where school_id = ?`;

        let values = [school_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results; // expectiong one or more schools
      } catch (error) {
        throw new GraphQLError("Error fetching school");
      }
    },
  },
  Department: {
    async school(parent) {
      try {
        let school_id = parent.school_id;
        let sql = `SELECT * FROM schools where id = ?`;

        let values = [school_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0];
      } catch (error) {
        throw new GraphQLError("Error fetching school");
      }
    },
    async programmes(parent) {
      try {
        let department_id = parent.id;
        let sql = `SELECT * FROM programmes where dpt_id = ?`;

        let values = [department_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results; // expecting one or more programmes
      } catch (error) {
        throw new GraphQLError("Error fetching school");
      }
    },
  },
  Programme: {
    async department(parent) {
      try {
        let department_id = parent.dpt_id;
        let sql = `SELECT * FROM departments where id = ?`;

        let values = [department_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting one department
      } catch (error) {
        throw new GraphQLError("Error fetching school");
      }
    },
    async prog_versions(parent) {
      try {
        let prog_id = parent.id;
        let sql = `SELECT * FROM programme_versions where prog_id = ?`;

        let values = [prog_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results; // expecting one or programme versions
      } catch (error) {
        throw new GraphQLError("Error fetching school");
      }
    },
  },
  ProgrammeVersion: {
    async programme(parent) {
      try {
        let programme_id = parent.prog_id;
        let sql = `SELECT * FROM programmes where id = ?`;

        let values = [programme_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting one programme
      } catch (error) {
        throw new GraphQLError("Error fetching school");
      }
    },
    async modules(parent) {
      try {
        let prog_version_id = parent.id;
        let sql = `SELECT * FROM modules where prog_version_id = ?`;

        let values = [prog_version_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results; // expecting one or more modules
      } catch (error) {
        throw new GraphQLError("Error fetching school");
      }
    },
  },
  Module: {
    async grading_system(parent) {
      try {
        let grading_id = parent.grading_id;
        let sql = `SELECT * FROM grading_systems where id = ?`;

        let values = [grading_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting one grading system for the module
      } catch (error) {
        throw new GraphQLError("Error fetching school");
      }
    },
  },
  GradingSystem: {
    async grading(parent) {
      try {
        let grading_system_id = parent.id;
        let sql = `SELECT * FROM grading_system_details where grading_system_id = ?`;

        let values = [grading_system_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results; // expecting one or more grading details
      } catch (error) {
        throw new GraphQLError("Error fetching school");
      }
    },
  },
  Scheme: {
    async admission_fees(parent) {
      try {
        let sql = `SELECT * FROM admission_fees`;

        const [results, fields] = await db.execute(sql);
        // console.log("results", results);
        return results; // expecting one or more admission fees
      } catch (error) {
        throw new GraphQLError("Error fetching fees");
      }
    },
    async admission_letters(parent) {
      try {
        let scheme_id = parent.id;
        let sql = `SELECT * FROM admission_letters where scheme_id = ?`;

        let values = [scheme_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results; // expecting one or more admission letters
      } catch (error) {
        throw new GraphQLError("Error fetching school");
      }
    },
  },
  Applicant: {
    async applications(parent) {
      try {
        let applicant_id = parent.applicant_id;
        let sql = `SELECT * FROM applications where id = ?`;

        let values = [applicant_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results; // expecting one or more application forms
      } catch (error) {
        throw new GraphQLError("Error fetching application payments");
      }
    },
  },
  Application: {
    async applicant(parent) {
      try {
        let applicant_id = parent.applicant_id;
        let sql = `SELECT * FROM applicants where applicant_id = ?`;

        let values = [applicant_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting one applicant
      } catch (error) {
        throw new GraphQLError("Error fetching applicant");
      }
    },
    async application_payments(parent) {
      try {
        let application_id = parent.id;
        let sql = `SELECT * FROM application_payments where application_id = ?`;

        let values = [application_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results; // expecting one or more application payments
      } catch (error) {
        throw new GraphQLError("Error fetching application payments");
      }
    },
    async programme_choices(parent) {
      try {
        let application_id = parent.id;
        let sql = `SELECT * FROM applicant_program_choices where applicant_id = ?`;

        let values = [application_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results; // expecting one or more program_choices
      } catch (error) {
        throw new GraphQLError("Error fetching application payments");
      }
    },
  },
  ApplicantProgrammeChoice: {
    async applications(parent) {
      try {
        let application_id = parent.application_id;
        let sql = `SELECT * FROM applications where id = ?`;

        let values = [application_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results; // expecting one or more application forms
      } catch (error) {
        throw new GraphQLError("Error fetching application payments");
      }
    },
  },
  Student: {
    // async department(parent) {
    //   try {
    //     let department_id = parent.dpt_id;
    //     let sql = `SELECT * FROM departments where id = ?`;

    //     let values = [department_id];
    //     const [results, fields] = await db.execute(sql, values);
    //     // console.log("results", results);
    //     return results[0]; // expecting one department
    //   } catch (error) {
    //     throw new GraphQLError("Error fetching department");
    //   }
    // },
    async programme_version(parent) {
      try {
        let prog_version_id = parent.prog_version_id;
        let sql = `SELECT * FROM programme_versions where id = ?`;

        let values = [prog_version_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the program version assigned to the student at the time of admission
      } catch (error) {
        throw new GraphQLError("Error fetching department");
      }
    },
    async fees_structure_version(parent) {
      try {
        let fees_structure_version_id = parent.fees_structure_version_id;
        let sql = `SELECT * FROM fees_structure_versions where id = ?`;

        let values = [fees_structure_version_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the fees structure version assigned to the student at the time of admission
      } catch (error) {
        throw new GraphQLError("Error fetching department");
      }
    },
    async enrollment_and_reg_details(parent) {
      try {
        // get the active semester details including the id -> use the utitity_function please
        // use the parent details to get last enrollment record from the `student enrollment` table
        // compare the `sem_initiation_id` with the id of the active sem to see if the student is enrolled
        // then return the neccessary records ie current_yr, current_sem,
      } catch (error) {
        throw new GraphQLError("Error fetching department");
      }
    },
    async enrollment_track(parent) {
      try {
        let stdno = parent.stdno;
        let sql = `SELECT * FROM students_enrollment where stdno = ?`;

        let values = [stdno];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results; // expecting one or enrollment details
      } catch (error) {
        throw new GraphQLError("Error fetching enrollment details");
      }
    },
  },
  Nationality: {
    async student_category(parent) {
      try {
        let std_category_id = parent.std_category_id;
        let sql = `SELECT * FROM student_categories where id = ?`;

        let values = [std_category_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting one student category
      } catch (error) {
        throw new GraphQLError("Error fetching student category");
      }
    },
  },
  FeesItem: {
    async category(parent) {
      try {
        let category_id = parent.category_id;
        let sql = `SELECT * FROM fees_categories where id = ?`;

        let values = [category_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting one fees category
      } catch (error) {
        throw new GraphQLError("Error fetching fees category");
      }
    },
  },
  Fee: {
    async item(parent) {
      try {
        let fee_item_id = parent.fee_item_id;
        let sql = `SELECT * FROM fees_items where id = ?`;

        let values = [fee_item_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting one fees item
      } catch (error) {
        throw new GraphQLError("Error fetching fees item");
      }
    },
  },
  StudentInvoice: {
    async transactions(parent) {
      try {
        let invoice_no = parent.invoice_no;
        let sql = `SELECT * FROM student_transactions where invoice_no = ?`;

        let values = [invoice_no];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results; // expecting one or more transactions
      } catch (error) {
        throw new GraphQLError("Error fetching module");
      }
    },
    async items(parent) {
      try {
        let category_id = parent.category_id;

        // for mandatory fees like tuition, functional fees
        if (parent.is_mandatory) {
          // Here, we need the fees_structure of the particular student
          // then use the enrollment details to get the enrolled study_yr and semester of the student
          // then match that with the fees structure to get all the madatory fees that the student is supposed to pay
          // finally, filter them out based on the category -> category_id ie functional, tuition
        } else {
          // for non mandatory fees, like retakes, annual reports etc
          // based on category id, we check in the `fees_items` table and get the fees details along with `fees` to get the amount
        }

        let sql = `SELECT * FROM fees_items where id = ?`;

        let values = [category_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting one fees item
      } catch (error) {
        throw new GraphQLError("Error fetching fees item");
      }
    },
  },
  StudentRegistration: {
    async registered_modules(parent) {
      try {
        let registration_id = parent.registration_id;
        let sql = `SELECT * FROM student_registered_modules where registration_id = ?`;

        let values = [registration_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results; // expecting one or more registered modules
      } catch (error) {
        throw new GraphQLError("Error fetching registered modules");
      }
    },
  },
  StudentRegisteredModule: {
    async module(parent) {
      try {
        let module_id = parent.module_id;
        let sql = `SELECT * FROM modules where id = ?`;

        let values = [module_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting module
      } catch (error) {
        throw new GraphQLError("Error fetching module");
      }
    },
  },
  StudentResult: {
    async module(parent) {
      try {
        let module_id = parent.module_id;
        let sql = `SELECT * FROM modules where id = ?`;

        let values = [module_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting module
      } catch (error) {
        throw new GraphQLError("Error fetching module");
      }
    },
  },

  //   Mutation: {},
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  context: ({ req }) => ({ req }),
  listen: { port: port },
});

console.log(`App running on port ${port}`);

app.listen("2222", () => {
  console.log(`Express server listening on port 2222`);
});
