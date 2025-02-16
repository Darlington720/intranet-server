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
import { checkApplicantData } from "../applicant/resolvers.js";

export const getProgramChoices = async ({
  applicant_id,
  admissions_id,
  form_no,
  choice_id,
  id,
  course_id,
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

    if (course_id) {
      where += " AND program_choices.course_id = ?";
      values.push(course_id);
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
    saveProgramChoices: async (parent, args, context) => {
      const applicant_id = context.req.user.applicant_id;

      let connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        const applicantData = await checkApplicantData(applicant_id, args);

        for (const prog_choice of applicantData.program_choices) {
          const {
            choice_id,
            choice_no,
            course_id,
            campus_id,
            study_time_id,
            entry_yr,
          } = prog_choice;

          const data = {
            applicant_id,
            form_no: applicantData.form_no,
            admissions_id: applicantData.admissions_id,
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

        // lets now update the applications record to notify that the applicant is done with this section

        const _application = await getApplicationForms({
          running_admissions_id: applicantData.admissions_id,
          applicant_id,
          form_no: applicantData.form_no,
          application_details: true,
        });

        if (!_application || _application.length === 0) {
          throw new GraphQLError("Application form not found.");
        }

        const save_id = await saveData({
          table: "applications",
          data: {
            has_chosen_courses: true,
          },
          id: _application[0].id,
        });

        const application = await getApplicationForms({
          id: save_id,
        });

        await connection.commit();

        return {
          success: true,
          message: "Program choices Saved Successfully",
          result: application[0],
        };
      } catch (error) {
        await connection.rollback();
        throw new GraphQLError(error.message);
      } finally {
        if (connection) {
          connection.release();
        }
      }
    },
  },
};

export default progChoiceResolvers;
