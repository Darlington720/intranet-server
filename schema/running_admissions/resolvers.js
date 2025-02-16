import { GraphQLError } from "graphql";
import { tredumoDB, db, database } from "../../config/config.js";
import generateUniqueID from "../../utilities/generateUniqueID.js";

export const getAllRunningAdmissions = async ({
  id,
  intake_id,
  scheme_id,
  acc_yr_id,
  admission_level_id,
} = {}) => {
  try {
    if (intake_id == "" || scheme_id == "" || acc_yr_id == "") return [];

    let where = "";
    let values = [];
    let extra_select = "";
    let extra_join = "";

    if (id) {
      where += " AND running_admissions.id = ?";
      values.push(id);
    }

    if (intake_id) {
      where += " AND running_admissions.intake_id = ?";
      values.push(intake_id);
    }

    if (scheme_id) {
      where += " AND running_admissions.scheme_id = ?";
      values.push(scheme_id);
    }

    if (acc_yr_id) {
      where += " AND running_admissions.acc_yr_id = ?";
      values.push(acc_yr_id);
    }

    if (admission_level_id) {
      where += " AND running_admissions.admission_level_id = ?";
      values.push(admission_level_id);
    }

    let sql = `SELECT 
      running_admissions.*, 
      intakes.intake_title
      ${extra_select}
      FROM 
      running_admissions
      LEFT JOIN intakes ON running_admissions.intake_id = intakes.id
      ${extra_join}
      WHERE running_admissions.deleted = 0 ${where} 
      ORDER BY running_admissions.id DESC`;

    const [results, fields] = await db.execute(sql, values);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching running admissions", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 501 },
      },
    });
  }
};

const runningAdmissionsResolvers = {
  Query: {
    running_admissions: async (parent, args, context) => {
      try {
        const result = await getAllRunningAdmissions();

        // const runningAdmissions = getRunningAdmissions(result);
        return result;
      } catch (error) {
        // console.log("errr", error.message);
      }
    },
  },
  RunningAdmission: {
    intake: async (parent, args) => {
      try {
        const intake_id = parent.intake_id;
        let sql = `SELECT * FROM intakes WHERE id = ?`;

        let values = [intake_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the intake
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching intake", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    scheme: async (parent, args) => {
      try {
        const scheme_id = parent.scheme_id;
        let sql = `SELECT * FROM schemes WHERE id = ?`;

        let values = [scheme_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the scheme
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching scheme", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    admission_level: async (parent, args) => {
      try {
        const admission_level_id = parent.admission_level_id;
        let sql = `SELECT * FROM admission_levels WHERE id = ?`;

        let values = [admission_level_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the scheme
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching admission level", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    acc_yr: async (parent, args) => {
      try {
        const acc_yr_id = parent.acc_yr_id;
        let sql = `SELECT * FROM acc_yrs WHERE id = ?`;

        let values = [acc_yr_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the scheme
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching accademic yrs", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    created_user: async (parent, args) => {
      try {
        const user_id = parent.created_by;
        let sql = `SELECT * FROM staff WHERE id = ?`;

        let values = [user_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the one who added the user
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching user", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    modified_user: async (parent, args) => {
      try {
        const user_id = parent.modified_by;
        let sql = `SELECT * FROM staff WHERE id = ?`;

        let values = [user_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the one who added the user
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching user", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
  },
  Mutation: {
    saveRunningAdmission: async (parent, args, context) => {
      const user_id = context.req.user.id;
      const {
        id,
        intake_id,
        scheme_id,
        admission_level_id,
        acc_yr_id,
        start_date,
        end_date,
        no_of_choices,
        max_no_of_forms,
        form_template_id,
        description,
        national_application_fees,
        east_african_application_fees,
        international_application_fees,
        activate_admission_fees,
        national_admission_fees,
        east_african_admission_fees,
        international_admission_fees,
      } = args;
      // we need the current date
      const today = new Date();

      // console.log("args", args);
      // const uniqueID = generateUniqueID();
      // check for the id, if present, we update otherwise we create a new record
      if (id) {
        // update
        try {
          let sql = `UPDATE running_admissions SET 
              intake_id = ?,
              scheme_id = ?,
              admission_level_id = ?,
              acc_yr_id = ?,
              start_date = ?,
              end_date = ?,
              no_of_choices = ?,
              max_no_of_forms = ?,
              form_template_id = ?,
              description = ?,
              national_application_fees = ?,
              east_african_application_fees = ?,
              international_application_fees = ?,
              activate_admission_fees = ?,
              national_admission_fees = ?,
              east_african_admission_fees = ?,
              international_admission_fees = ?,
              modified_by = ?, 
              modified_on = ? 
              WHERE id = ?`;

          let values = [
            intake_id,
            scheme_id,
            admission_level_id,
            acc_yr_id,
            new Date(start_date),
            new Date(end_date),
            no_of_choices,
            max_no_of_forms,
            form_template_id,
            description ? description : null,
            national_application_fees,
            east_african_application_fees,
            international_application_fees,
            activate_admission_fees,
            national_admission_fees,
            east_african_admission_fees,
            international_admission_fees,
            user_id,
            today,
            id,
          ];

          const [results, fields] = await db.execute(sql, values);

          // console.log("the results", results);
          if (results.affectedRows == 0) {
            // no record the provided id
            throw new GraphQLError(`No running admission with id ${id}`, {
              extensions: {
                // code: '',
                http: { status: 400 },
              },
            });
          }
        } catch (error) {
          console.log("error", error);
          throw new GraphQLError(error, {
            extensions: {
              // code: '',
              http: { status: 400 },
            },
          });
        }
      } else {
        // create new record
        try {
          // no repeatition of existing schemes is allowed based on acc_yr, scheme, and intake
          const existingRunningAdmission = await getAllRunningAdmissions({
            intake_id,
            scheme_id,
            acc_yr_id,
          });

          if (existingRunningAdmission[0]) {
            throw new GraphQLError(
              "Admission already exists, Please make changes in the existing one"
            );
          }
          let sql = `INSERT INTO running_admissions(
          intake_id,
          scheme_id,
          admission_level_id,
          acc_yr_id,
          start_date,
          end_date,
          no_of_choices,
          max_no_of_forms,
          form_template_id,
          description,
          national_application_fees,
          east_african_application_fees,
          international_application_fees,
          activate_admission_fees,
          national_admission_fees,
          east_african_admission_fees,
          international_admission_fees,
          created_by, 
          created_on
          ) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

          let values = [
            intake_id,
            scheme_id,
            admission_level_id,
            acc_yr_id,
            new Date(start_date),
            new Date(end_date),
            no_of_choices,
            max_no_of_forms,
            form_template_id,
            description,
            national_application_fees,
            east_african_application_fees,
            international_application_fees,
            activate_admission_fees,
            national_admission_fees,
            east_african_admission_fees,
            international_admission_fees,
            user_id,
            today,
          ];

          const [results, fields] = await db.execute(sql, values);
        } catch (error) {
          console.log("error", error);
          throw new GraphQLError(error.message);
        }
      }

      return {
        success: "true",
        message: "Admission created successfully",
      };
    },
    deleteRunningAdmission: async (parent, args) => {
      try {
        const { running_admission_id } = args;

        // console.log("admission level id", admission_level_id);

        let sql = `UPDATE running_admissions SET deleted = 1 WHERE id = ?`;

        let values = [running_admission_id];

        const [results, fields] = await db.execute(sql, values);

        // console.log("the results", results);
        if (results.affectedRows == 0 || results.changedRows == 0) {
          // no record the provided id
          throw new GraphQLError(`No admission with id ${admission_level_id}`, {
            extensions: {
              // code: '',
              http: { status: 400 },
            },
          });
        }

        return {
          success: "true",
          message: "Admission deleted successfully",
        };
      } catch (error) {
        throw new GraphQLError(error);
      }
    },
  },
};

export default runningAdmissionsResolvers;
