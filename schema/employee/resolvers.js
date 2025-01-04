import { GraphQLError } from "graphql";
import { tredumoDB, db, database } from "../../config/config.js";
import saveData from "../../utilities/db/saveData.js";
import softDelete from "../../utilities/db/softDelete.js";
import { getColleges } from "../college/resolvers.js";
import { getSchools } from "../school/resolvers.js";
import { getDepartments } from "../department/resolvers.js";
import { getCampuses } from "../campus/resolvers.js";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import chunk from "lodash.chunk";
import { getAllSalutations } from "../salutation/resolvers.js";
import hasPermission from "../../utilities/helpers/hasPermission.js";
import checkPermission from "../../utilities/helpers/checkPermission.js";
import saveDataWithOutDuplicates from "../../utilities/db/saveDataWithOutDuplicates.js";

export const getEmployees = async ({
  id,
  surname,
  other_names,
  active = false,
}) => {
  try {
    let values = [];
    let where = "";
    let extra_join = "";

    if (id) {
      where += " AND employees.id = ?";
      values.push(id);
    }

    if (surname) {
      where += " AND employees.surname = ?";
      values.push(surname);
    }

    if (other_names) {
      where += " AND employees.other_names = ?";
      values.push(other_names);
    }

    if (active) {
      extra_join +=
        " INNER JOIN management_users ON employees.id = management_users.user_id";
    }

    let sql = `
    SELECT 
    employees.*,
    salutations.salutation_code AS salutation,
    nationalities.nationality_title AS nationality,
    designations.designation_name AS designation
    FROM employees 
    LEFT JOIN salutations ON employees.salutation_id = salutations.id
    LEFT JOIN nationalities ON employees.nationality_id = nationalities.id
    LEFT JOIN designations ON employees.designation_id = designations.id
    ${extra_join}
    WHERE status = "active" ${where} ORDER BY employees.created_on DESC`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    throw new GraphQLError("Error fetching employees", error.message);
  }
};

const getEmployeeNextOfKin = async ({ id, employee_id }) => {
  try {
    let values = [];
    let where = "";

    if (id) {
      where += " AND id = ?";
      values.push(id);
    }

    if (employee_id) {
      where += " AND employee_id = ?";
      values.push(employee_id);
    }
    let sql = `SELECT * FROM next_of_kins WHERE deleted = 0 ${where}`;

    const [results] = await db.execute(sql, values);
    return results;
  } catch (error) {
    throw new GraphQLError("Error fetching next of kin", error.message);
  }
};

export const getApprovers = async ({ employee_id, type }) => {
  try {
    let values = [];
    let where = "";

    if (employee_id) {
      where += " AND approvers.employee_id = ?";
      values.push(employee_id);
    }

    if (type) {
      where += " AND approvers.approver_type = ?";
      values.push(type);
    }

    let sql = `SELECT 
      CONCAT(salutations.salutation_code, " ", employees.surname, " ", employees.other_names) AS name,
      approvers.* 
      FROM approvers 
      LEFT JOIN employees ON approvers.approver_id = employees.id
      LEFT JOIN salutations ON employees.salutation_id = salutations.id
      WHERE approvers.deleted = 0 ${where}`;

    const [results] = await db.execute(sql, values);
    return results;
  } catch (error) {
    throw new GraphQLError("Error fetching approvers", error.message);
  }
};

const employeeResolvers = {
  Query: {
    employees: async (parent, args) => {
      const result = await getEmployees({
        active: args.active,
      });
      return result;
    },
    employee: async (parent, args) => {
      const result = await getEmployees({
        id: args.id,
      });
      return result[0];
    },
  },
  Employee: {
    college: async (parent, args) => {
      const college_id = parent.college_id;

      const results = await getColleges({
        id: college_id,
      });

      return results[0];
    },
    school: async (parent, args) => {
      const school_id = parent.school_id;

      const results = await getSchools({
        id: school_id,
      });

      return results[0];
    },
    department: async (parent, args) => {
      const dpt_id = parent.dpt_id;

      const results = await getDepartments({
        id: dpt_id,
      });

      return results[0];
    },
    campus: async (parent, args) => {
      const campus_id = parent.campus_id;

      const results = await getCampuses({
        id: campus_id,
      });

      return results[0];
    },
    next_of_kin: async (parent, args) => {
      const employee_id = parent.id;

      const results = await getEmployeeNextOfKin({
        employee_id,
      });

      return results[0];
    },
    approvers: async (parent, args) => {
      const employee_id = parent.id;

      const results = await getApprovers({
        employee_id,
      });

      return results;
    },
  },
  Mutation: {
    saveReporting: async (parent, args, context) => {
      const {
        employee_id,
        manager,
        indirect_managers,
        first_level_approver,
        second_level_approver,
        third_level_approver,
      } = args.payload;

      const userPermissions = context.req.user.permissions;

      checkPermission(
        userPermissions,
        "can_update_employees",
        "You do not have permission to update this employee's details"
      );

      const newApprovers = [];

      // Create an approver for the manager if provided
      if (manager) {
        newApprovers.push({
          employee_id,
          approver_id: manager,
          approver_type: "manager",
        });
      }

      // Create approvers for the indirect managers if provided
      if (indirect_managers && indirect_managers.length > 0) {
        indirect_managers.forEach((manager) => {
          newApprovers.push({
            employee_id,
            approver_id: manager,
            approver_type: "indirect_manager",
          });
        });
      }

      // Create approvers for the first level, second level, and third level if provided
      if (first_level_approver) {
        newApprovers.push({
          employee_id,
          approver_id: first_level_approver,
          approver_type: "first_level_approver",
        });
      }

      if (second_level_approver) {
        newApprovers.push({
          employee_id,
          approver_id: second_level_approver,
          approver_type: "second_level_approver",
        });
      }

      if (third_level_approver) {
        newApprovers.push({
          employee_id,
          approver_id: third_level_approver,
          approver_type: "third_level_approver",
        });
      }

      await saveDataWithOutDuplicates({
        table: "approvers",
        data: newApprovers,
        id: employee_id,
      });

      return {
        success: "true",
        message: "Reporting details saved successfully",
      };
    },

    saveEmployee: async (parent, args, context) => {
      const user_id = context.req.user.id;
      const {
        id,
        salutation_id,
        surname,
        other_names,
        staff_id,
        email,
        gender,
        status,
        nationality_id,
        address,
        telno,
        religion,
        date_of_birth,
        joining_date,
        designation_id,
        marital_status,
        nin,
        salary,
        college_id,
        school_id,
        dpt_id,
        campus_id,
        mother_deceased,
        mothers_name,
        mothers_telno,
        mothers_email,
        mothers_nin,
        father_deceased,
        fathers_name,
        fathers_telno,
        fathers_email,
        fathers_nin,
        nok_name,
        nok_email,
        nok_relation,
        nok_telno,
        nok_address,
        nssf_no,
        tin_no,
        qualifications,
        contract_start_date,
        contract_end_date,
        medical_condition,
        emergency_contact,
        employment_type,
        illnesses,
        disability,
        reporting,
      } = args.payload;
      // first check if user has permission to save employee
      const userPermissions = context.req.user.permissions;
      // Check edit permission if an ID is provided
      if (id) {
        checkPermission(
          userPermissions,
          "can_update_employees",
          "You do not have permission to update this employee"
        );
      }

      // Check add permission
      checkPermission(
        userPermissions,
        "can_add_employees",
        "You do not have permission to add employees"
      );

      let connection;
      connection = await db.getConnection();
      try {
        // we need the current date
        const today = new Date();
        const uniqueId = generateUniqueID();

        const data = {
          id: !id ? uniqueId : id,
          salutation_id,
          surname,
          other_names,
          staff_id,
          email,
          gender,
          status,
          nationality_id,
          address,
          telno,
          religion,
          date_of_birth,
          joining_date: joining_date || null,
          designation_id: designation_id || null,
          salary: salary || null,
          college_id: college_id || null,
          school_id: school_id || null,
          dpt_id: dpt_id || null,
          campus_id: campus_id || null,
          marital_status,
          nin,
          mother_deceased,
          mothers_name,
          mothers_telno,
          mothers_email,
          mothers_nin,
          father_deceased,
          fathers_name,
          fathers_telno,
          fathers_email,
          fathers_nin,
          nssf_no: nssf_no || null,
          tin_no: tin_no || null,
          medical_condition,
          emergency_contact,
          employment_type: employment_type || null,
          illnesses,
          disability,
          created_on: today,
        };

        const save_id = await saveData({
          table: "employees",
          data,
          id,
        });

        // then the academic qualifications
        const academicQualificationsData =
          qualifications &&
          qualifications.map((qual) => ({
            employee_id: uniqueId,
            institution: qual.institution,
            award_obtained: qual.award_obtained,
            award_duration: qual.award_duration,
            grade: qual.grade,
            start_date: qual.start_date,
            end_date: qual.end_date,
          }));

        let nok_id = null;

        // then the next of kin
        const nextOfKinData = {
          employee_id: !id ? uniqueId : id,
          name: nok_name,
          telno: nok_telno,
          relation: nok_relation,
          address: nok_address,
          email: nok_email,
        };

        // then the contract details data if employment_type = contract
        if (employment_type === "contract") {
          const contractDetailsData = {
            employee_id: uniqueId,
            designation_id,
            start_date: contract_start_date,
            end_date: contract_end_date,
            created_by: user_id,
            created_on: today,
          };

          await saveData({
            table: "contract_details",
            data: contractDetailsData,
          });
        }

        if (id) {
          let nok = await getEmployeeNextOfKin({
            employee_id: id,
          });

          nok_id = nok[0]?.id || null;
        }
        await saveData({
          table: "next_of_kins",
          data: nextOfKinData,
          id: nok_id,
        });

        if (qualifications && qualifications.length > 0) {
          await saveData({
            table: "employees_education_info",
            data: academicQualificationsData,
          });
        }

        await connection.commit();

        return {
          success: "true",
          message: "Employee Saved successfully",
        };
      } catch (error) {
        await connection.rollback();
        throw new GraphQLError(error.message);
      } finally {
        if (connection) {
          // Release the connection back to the pool
          connection.release();
        }
      }
    },
    deleteDesignation: async (parent, args) => {
      try {
        const { id } = args;

        await softDelete({
          table: "designations",
          id,
        });
        return {
          success: "true",
          message: "Designation deleted successfully",
        };
      } catch (error) {
        throw new GraphQLError(error);
      }
    },
    uploadEmployees: async (parent, args, context) => {
      const BATCH_SIZE = 500;
      const user_id = context.req.user.id;

      checkPermission(
        userPermissions,
        "can_upload_employees",
        "You do not have permissions to upload employees"
      );

      let connection = await db.getConnection();
      try {
        // Begin a database transaction
        await connection.beginTransaction();

        // Divide the payload into chunks
        const employeeChunks = chunk(args.payload, BATCH_SIZE);

        for (const chunk of employeeChunks) {
          for (const employee of chunk) {
            let save_id;
            const [surname, ...other_names] = employee.name.split(" ");
            const salutations = await getAllSalutations({
              salutation_description: employee.title,
            });

            if (!salutations[0]) {
              const salutation_data = {
                salutation_code: employee.title,
                salutation_description: employee.title,
              };

              save_id = await saveData({
                table: "salutations",
                data: salutation_data,
              });
            }

            const salutation_id = salutations[0] ? salutations[0].id : save_id;
            const uniqueId = generateUniqueID();
            // Create employee data
            const employee_data = {
              id: uniqueId,
              surname,
              other_names: other_names.join(" "),
              salutation_id,
              staff_id: employee.staff_id,
              email: employee.email,
              status: "active",
              created_on: new Date(),
            };

            // if (students.length > 0) {
            //   throw new GraphQLError("Student already exists: " + student.stdno);
            // }

            const save_applicant_id = await saveData({
              table: "employees",
              data: employee_data,
              id: null,
            });
          }
        }

        // Commit the transaction after processing all chunks
        await connection.commit();

        return {
          success: true,
          message: "Employees uploaded successfully",
        };
      } catch (error) {
        await connection.rollback();
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default employeeResolvers;
