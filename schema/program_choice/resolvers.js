import { GraphQLError } from "graphql";
import { tredumoDB, db, database } from "../../config/config.js";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import {
  createApplication,
  getApplicationForms,
  updateApplicationCompletedSections,
} from "../application/resolvers.js";
import { getCourseByID } from "../course/resolvers.js";
import saveData from "../../utilities/db/saveData.js";

export const getProgramChoices = async ({
  applicant_id,
  admissions_id,
  form_no,
  choice_id,
  id,
}) => {
  try {
    let where = "";
    let values = [];

    if (id) {
      where += " AND program_choices.id = ?";
      values.push(id);
    }

    if (applicant_id) {
      where += " AND program_choices.applicant_id = ?";
      values.push(applicant_id);
    }

    if (admissions_id) {
      where += " AND program_choices.admissions_id = ?";
      values.push(admissions_id);
    }

    if (form_no) {
      where += " AND program_choices.form_no = ?";
      values.push(form_no);
    }

    if (choice_id) {
      where += " AND program_choices.id = ?";
      values.push(choice_id);
    }

    let sql = `SELECT 
      program_choices.*, 
      campuses.campus_title,
      courses.course_title,
      courses.course_code,
      courses.course_duration,
      courses.duration_measure,
      levels.level_code,
      study_times.study_time_title
      FROM 
      program_choices
      LEFT JOIN courses ON program_choices.course_id = courses.id
      LEFT JOIN levels ON courses.level = levels.id
      LEFT JOIN campuses ON program_choices.campus_id = campuses.id
      LEFT JOIN study_times ON program_choices.study_time_id = study_times.id
      WHERE program_choices.deleted = 0 ${where} ORDER BY choice_no ASC`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error.message);
    throw new GraphQLError("Error fetching Program Choices " + error.message, {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 501 },
      },
    });
  }
};

const progChoiceResolvers = {
  Query: {
    program_choices: () => {},
  },
  ProgramChoice: {
    course: async (parent) => {
      const course_id = parent.course_id;
      const course = await getCourseByID(course_id);
      return course;
    },
  },
  Mutation: {
    saveProgramChoices: async (parent, args) => {
      const today = new Date();
      const {
        program_choices,
        applicant_id,
        form_no,
        admissions_id,
        completed_form_sections,
      } = args;

      // console.log("the grgs", args);

      let message = "";

      try {
        const insertProgramChoices = await program_choices.map(
          async (prog_choice) => {
            const {
              choice_id,
              choice_no,
              course_id,
              campus_id,
              study_time_id,
              entry_yr,
            } = prog_choice;

            // if (choice_id) {
            //   // but first check if the choice_id is valid
            //   const existingProgChoice = await getProgramChoices({
            //     choice_id,
            //   });

            //   // console.log(existingProgChoice);

            //   if (!existingProgChoice[0]) {
            //     throw new GraphQLError("Inalid Choice id!!!");
            //   }

            //   // update
            //   let sql2 = `UPDATE program_choices SET
            //     applicant_id = ?,
            //     form_no = ?,
            //     admissions_id = ?,
            //     choice_no = ?,
            //     course_id = ?,
            //     campus_id = ?,
            //     study_time_id = ?,
            //     entry_yr = ?,
            //     updated_at = ?
            //     WHERE id = ?`;

            //   let values2 = [
            //     applicant_id,
            //     form_no,
            //     admissions_id,
            //     choice_no,
            //     course_id,
            //     campus_id,
            //     study_time_id,
            //     entry_yr,
            //     today,
            //     choice_id,
            //   ];

            //   const [results2, fields2] = await db.execute(sql2, values2);
            // } else {
            //   // first, we do not any repeatition in the choices chosen for a specified running admission
            //   const existingProgChoice = await getProgramChoices({
            //     applicant_id,
            //     form_no,
            //     admissions_id,
            //   });

            //   // console.log("existingProgChoice", existingProgChoice);

            //   if (existingProgChoice[0]) {
            //     return;
            //   }

            //   // lets now insert the program choices in the database
            //   let sql = `INSERT INTO program_choices(
            //   applicant_id,
            //   form_no,
            //   admissions_id,
            //   choice_no,
            //   course_id,
            //   campus_id,
            //   study_time_id,
            //   entry_yr,
            //   created_at
            //   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            //   let values = [
            //     applicant_id,
            //     form_no,
            //     admissions_id,
            //     choice_no,
            //     course_id,
            //     campus_id,
            //     study_time_id,
            //     entry_yr,
            //     today,
            //   ];

            //   const [results, fields] = await db.execute(sql, values);
            // }

            const data = {
              applicant_id,
              form_no,
              admissions_id,
              choice_no,
              course_id,
              campus_id,
              study_time_id,
              entry_yr,
            };

            await saveData({
              table: `program_choices`,
              id: choice_id,
              data,
            });
          }
        );

        await Promise.all(insertProgramChoices);

        // lets see if the form is already created
        const existingApplicationForm = await getApplicationForms({
          form_no,
        });

        if (!existingApplicationForm[0]) {
          // now, lets create the form for the applicant
          await createApplication(
            applicant_id,
            admissions_id,
            completed_form_sections
          );
        } else {
          // if the application exists, just update the form section ids
          await updateApplicationCompletedSections(
            existingApplicationForm[0].id,
            completed_form_sections
          );
        }

        return {
          success: "true",
          message: "Program Choices saved Successfully",
        };
      } catch (error) {
        // console.log("error", error.message);
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default progChoiceResolvers;
