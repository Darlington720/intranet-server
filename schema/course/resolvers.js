import { db } from "../../config/config.js";
import { GraphQLError, version } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import saveData from "../../utilities/db/saveData.js";
import softDelete from "../../utilities/db/softDelete.js";
import DataLoader from "dataloader";

export const getAllCourses = async ({ school_id }) => {
  try {
    let where = "";
    let values = [];

    if (school_id) {
      where += " AND courses.school_id = ?";
      values.push(school_id);
    }

    let sql = `SELECT * FROM courses WHERE deleted = 0 ${where} ORDER BY course_code ASC`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching courses", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 501 },
      },
    });
  }
};

const getCourseAliases = async (course_id) => {
  try {
    let sql = `SELECT course_aliases.*, campuses.campus_title, study_times.study_time_title
      FROM course_aliases 
      LEFT JOIN campuses ON campuses.id = course_aliases.campus_id
      LEFT JOIN study_times ON study_times.id = course_aliases.study_time_id
      WHERE course_aliases.course_id = ? AND course_aliases.deleted = 0`;
    let values = [course_id];

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results; // returning the aliases
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching aliases" + error.message);
  }
};

export const getCourseByID = async (course_id) => {
  try {
    let sql = `SELECT * FROM courses WHERE id = ? AND deleted = 0`;
    let values = [course_id];

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results[0]; // returning the course
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching courses", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 501 },
      },
    });
  }
};

const courseLoader = new DataLoader(async (courseIds) => {
  // console.log("course ids", courseIds);
  const placeholders = courseIds.map(() => "?").join(",");
  const sql = `SELECT 
  *
  FROM courses WHERE id IN (${placeholders}) AND deleted = 0`;
  const [results] = await db.execute(sql, courseIds);

  // Map results by course_id
  const courseMap = courseIds.map(
    (id) => results.find((course) => course.id === id) || null
  );

  // console.log("course Map", courseMap);
  return courseMap;
});

export const getCourse = async ({
  course_id,
  course_version_id,
  course_code,
  course_version,
}) => {
  try {
    let values = [];
    let where = "";

    if (course_code) {
      where += " AND courses.course_code = ?";
      values.push(course_code);
    }

    if (course_version) {
      where += " AND course_versions.version_title = ?";
      values.push(course_version);
    }

    if (course_id) {
      where += " AND courses.id = ?";
      values.push(course_id);
    }

    if (course_version_id) {
      where += " AND course_versions.id = ?";
      values.push(course_version_id);
    }

    let sql = `
    SELECT 
      courses.*,
      course_versions.id AS course_version_id,
      course_versions.version_title,
      levels.level_code
    FROM courses 
    LEFT JOIN course_versions ON courses.id = course_versions.course_id
    LEFT JOIN levels ON levels.id = courses.level
    WHERE courses.deleted = 0 ${where}`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results; // returning the course
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching courses", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 501 },
      },
    });
  }
};

export const getCourseVersionDetails = async ({
  course_version_id,
  course_version,
  course_id,
}) => {
  try {
    let values = [];
    let where = "";

    if (course_version_id) {
      where += " AND course_versions.id = ?";
      values.push(course_version_id);
    }

    if (course_id) {
      where += " AND course_versions.course_id = ?";
      values.push(course_id);
    }

    if (course_version) {
      where += " AND course_versions.version_title = ?";
      values.push(course_version);
    }

    let sql = `SELECT * FROM course_versions WHERE deleted = 0 ${where}`;

    const [results] = await db.execute(sql, values);
    // console.log("results", results);
    return results[0]; // returning the course
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching course versions", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 501 },
      },
    });
  }
};

const getCourseVersions = async (course_id) => {
  try {
    // let sql = `SELECT * FROM course_versions WHERE course_id = ? AND deleted = 0 ORDER BY added_on ASC`;
    let sql = `SELECT * FROM course_versions WHERE course_id = ? AND deleted = 0`;

    let values = [course_id];

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results; // returning the course
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching courses", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 501 },
      },
    });
  }
};

const courseVersionLoader = new DataLoader(async (courseIds) => {
  // console.log("course ids", courseIds);
  const placeholders = courseIds.map(() => "?").join(",");
  const sql = `SELECT 
  *
   FROM course_versions WHERE course_id IN (${placeholders}) AND deleted = 0 ORDER BY added_on ASC`;
  const [results] = await db.execute(sql, courseIds);

  // Group results by course_id
  const courseMap = courseIds.map((id) =>
    results.filter((cv) => cv.course_id === id)
  );

  // console.log("map", courseMap);
  return courseMap;
});

const courseResolvers = {
  Query: {
    courses: async () => {
      const result = await getAllCourses({});
      return result;
    },

    course_version_details: async (_, args) => {
      const course_version_id = args.course_version_id;
      const result = await getCourseVersionDetails({ course_version_id });
      return result;
    },

    courses_based_on_level: async (_, args) => {
      const admission_level_id = args.admission_level_id;

      // console.log("results", admission_level_id);
      try {
        let sql = `SELECT * FROM admission_levels WHERE id = ? AND deleted = 0`;
        let values = [admission_level_id];

        const [results, fields] = await db.execute(sql, values);

        if (!results[0]) return [];

        let prog_level_ids = [];
        let progam_levels = JSON.parse(results[0].prog_levels);

        if (progam_levels) {
          prog_level_ids = progam_levels.map((level) => level.value);
        }
        // console.log("progam_level_id", prog_level_ids);

        let placeholders = prog_level_ids.map(() => "?").join(",");

        let sql2 = `SELECT *
                  FROM courses
                  WHERE level IN (${placeholders}) AND deleted = 0 ORDER BY course_title ASC`;

        let values2 = [...prog_level_ids];

        const [results2, fields2] = await db.execute(sql2, values2);
        // console.log("results2", results2);
        return results2;
        // return results[0]; // returning the admission level
      } catch (error) {
        console.log("error", error);
        throw new GraphQLError("Error fetching level", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },

    advertised_courses: async (_, args) => {
      const running_admission_id = args.running_admission_id;
      try {
        let sql = `SELECT advertised_courses.id AS advertised_course_id, courses.*
        FROM advertised_courses
        INNER JOIN courses ON courses.id = advertised_courses.course_id
        WHERE running_admission_id = ? AND advertised_courses.deleted = 0;`;
        let values = [running_admission_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results; // returning advertised courses
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(
          "Error fetching advertised courses: " + error.message,
          {
            extensions: {
              code: "UNAUTHENTICATED",
              http: { status: 501 },
            },
          }
        );
      }
    },
    course_aliases: async (_, args) => {
      try {
        const { course_id } = args;

        const aliases = await getCourseAliases(course_id);

        return aliases;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
  Course: {
    // course_versions: async (parent, args) => {
    //   const course_id = parent.id;
    //   // console.log("course id", course_id);
    //   const result = await getCourseVersions(course_id);
    //   return result; // returning all courses
    // },

    course_versions: (parent) => {
      return courseVersionLoader.load(parent.id);
    },
    department: async (parent, args) => {
      try {
        let sql = `SELECT * FROM departments WHERE id = ? AND deleted = 0`;
        let values = [parent.department_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // returning the dpt
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching department", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    school: async (parent, args) => {
      try {
        let sql = `SELECT * FROM schools WHERE id = ? AND deleted = 0`;
        let values = [parent.school_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // returning the school
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching school", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    level_details: async (parent, args) => {
      try {
        let sql = `SELECT * FROM levels WHERE id = ?`;
        let values = [parent.level];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // returning the school
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching level", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    course_study_times: async (parent, args) => {
      try {
        const study_times = parent.study_times;

        if (!study_times) return [];

        const _study_times = JSON.parse(study_times);

        const ids = _study_times.map((item) => item.value);
        // console.log(ids);

        const sql = `SELECT * FROM study_times WHERE id IN (${ids
          .map(() => "?")
          .join(", ")}) ORDER BY study_time_title ASC`;

        let values = [...ids];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results;
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching level", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },

    // added_user: async (parent, args) => {
    //   try {
    //     const user_id = parent.added_by;
    //     let sql = `SELECT * FROM staff WHERE id = ?`;

    //     let values = [user_id];

    //     const [results, fields] = await db.execute(sql, values);
    //     // console.log("results", results);
    //     return results[0]; // expecting the one who added the user
    //   } catch (error) {
    //     // console.log("error", error);
    //     throw new GraphQLError("Error fetching user", {
    //       extensions: {
    //         code: "UNAUTHENTICATED",
    //         http: { status: 501 },
    //       },
    //     });
    //   }
    // },
    // modified_user: async (parent, args) => {
    //   try {
    //     const user_id = parent.modified_by;
    //     let sql = `SELECT * FROM staff WHERE id = ?`;

    //     let values = [user_id];

    //     const [results, fields] = await db.execute(sql, values);
    //     // console.log("results", results);
    //     return results[0]; // expecting the one who added the user
    //   } catch (error) {
    //     // console.log("error", error);
    //     throw new GraphQLError("Error fetching user", {
    //       extensions: {
    //         code: "UNAUTHENTICATED",
    //         http: { status: 501 },
    //       },
    //     });
    //   }
    // },
    // department_head: async (parent, args) => {
    //   try {
    //     const user_id = parent.dpt_head_id;
    //     let sql = `SELECT * FROM staff WHERE id = ?`;

    //     let values = [user_id];

    //     const [results, fields] = await db.execute(sql, values);
    //     // console.log("results", results);
    //     return results[0]; // expecting the one who added the user
    //   } catch (error) {
    //     // console.log("error", error);
    //     throw new GraphQLError("Error fetching user", {
    //       extensions: {
    //         code: "UNAUTHENTICATED",
    //         http: { status: 501 },
    //       },
    //     });
    //   }
    // },
  },
  CourseVersion: {
    // course: async (parent, args) => {
    //   const course_id = parent.course_id;
    //   const result = await getCourseByID(course_id);
    //   return result; // returning the course
    // },
    course: (parent) => {
      return courseLoader.load(parent.course_id);
    },
    added_user: async (parent, args) => {
      try {
        const user_id = parent.added_by;
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
    saveCourse: async (parent, args) => {
      const {
        id,
        course_code,
        course_title,
        course_duration,
        duration_measure,
        course_head_id,
        campuses,
        entry_yrs,
        college_id,
        school_id,
        department_id,
        level,
        award,
        grading_id,
        study_times,
        course_version,
        course_version_id,
        is_short_course,
        added_by,
      } = args;
      const uniqueCourseID = generateUniqueID();
      const uniqueVersionID = generateUniqueID();
      // we need the current date
      const today = new Date();
      if (id && !course_version_id) {
        throw new GraphQLError(`Internal System Error`, {
          extensions: {
            // code: '',
            http: { status: 500 },
          },
        });
      }

      // check for the id, if present, we update otherwise we create a new record
      if (id) {
        // update
        try {
          let sql = `UPDATE courses SET
            course_code = ?,
            course_title = ?,
            course_duration = ?,
            duration_measure = ?,
            course_head_id = ?,
            campuses = ?,
            entry_yrs = ?,
            college_id = ?,
            school_id = ?,
            department_id = ?,
            level = ?,
            award = ?,
            grading_id = ?,
            study_times = ?,
            is_short_course = ?
          WHERE id = ?`;

          let values = [
            course_code,
            course_title,
            course_duration,
            duration_measure,
            course_head_id,
            campuses,
            entry_yrs,
            college_id,
            school_id,
            department_id,
            level,
            award,
            grading_id,
            study_times,
            is_short_course,
            id,
          ];

          const [results, fields] = await db.execute(sql, values);

          // console.log("the results", results);
          if (results.affectedRows == 0) {
            // no record the provided id
            throw new GraphQLError(`No course with id ${id}`, {
              extensions: {
                // code: '',
                http: { status: 400 },
              },
            });
          }
        } catch (error) {
          // console.log("error", error);
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
          let sql = `INSERT INTO courses(id, course_code, course_title, course_duration, duration_measure, course_head_id, campuses, entry_yrs, college_id, school_id, department_id, level, award,  grading_id, study_times, is_short_course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

          let values = [
            uniqueCourseID,
            course_code,
            course_title,
            course_duration,
            duration_measure,
            course_head_id,
            campuses,
            entry_yrs,
            college_id,
            school_id,
            department_id,
            level,
            award,
            grading_id,
            study_times,
            is_short_course,
          ];

          const [results, fields] = await db.execute(sql, values);

          // console.log("results from insert", results);

          // insert the course version as well
          let sql2 = `INSERT INTO course_versions( id, course_id, version_title, added_on, added_by) VALUES (?, ?, ?, ?, ?)`;
          let values2 = [
            uniqueVersionID,
            uniqueCourseID,
            course_version,
            today,
            added_by,
          ];

          const [results2, fields2] = await db.execute(sql2, values2);
        } catch (error) {
          console.log("error", error);
          throw new GraphQLError("Failed to insert courses");
        }
      }

      const result = await getCourseVersionDetails({
        course_version_id: course_version_id
          ? course_version_id
          : uniqueVersionID,
      });

      return result; // returning the saved course
    },
    saveCourseVersion: async (parent, args) => {
      const { id, course_id, version_title, added_by } = args;
      const uniqueCourseVersionID = generateUniqueID();

      // console.log("args", args);

      // The course has to exist
      const res = await getCourseByID(course_id);

      if (!res) {
        throw new GraphQLError(`No course with id ${course_id}`, {
          extensions: {
            // code: '',
            http: { status: 400 },
          },
        });
      }
      // we need the current date
      const today = new Date();

      // check for the id, if present, we update otherwise we create a new record
      if (id) {
        // update
        try {
          let sql = `UPDATE course_versions SET
            course_id = ?, 
            version_title = ?, 
            added_by = ?
            WHERE id = ?`;

          let values = [course_id, version_title, added_by, id];

          const [results, fields] = await db.execute(sql, values);

          // console.log("the results", results);
          if (results.affectedRows == 0) {
            // no record the provided id
            throw new GraphQLError(`No course Version with id ${id}`, {
              extensions: {
                // code: '',
                http: { status: 400 },
              },
            });
          }
        } catch (error) {
          // console.log("error", error);
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
          let sql = `INSERT INTO course_versions(id, course_id, version_title, added_by, added_on) VALUES (?, ?, ?, ?, ?)`;

          let values = [
            uniqueCourseVersionID,
            course_id,
            version_title,
            added_by,
            today,
          ];

          const [results, fields] = await db.execute(sql, values);
        } catch (error) {
          console.log("error", error);
          throw new GraphQLError("Failed to insert version");
        }
      }

      const result = await getCourseVersionDetails({
        course_version_id: id ? id : uniqueCourseVersionID,
      });
      // console.log("the course", result);

      return result; // returning the saved course
    },
    uploadCourses: async (parent, args) => {
      // console.log("the args", args);
      const { courses, uploaded_by } = args;
      let finalCourses = [];
      let finalCourseVersions = [];

      const x = await courses.map(async (course) => {
        const uniqueCourseID = generateUniqueID();
        const uniqueVersionID = generateUniqueID();
        // we need the current date
        const today = new Date();
        // fisrt, we need to get the school_id based
        let sql1 = "SELECT * FROM departments WHERE dpt_code = ?";
        let values = [course.department_code];

        const [results, fields] = await db.execute(sql1, values);

        if (!results[0]) {
          return;
        }

        let school_id = results[0].school_id;
        let dpt_id = results[0].id;

        // now the level id
        let sql3 = "SELECT * FROM levels WHERE level_code = ?";
        let values3 = [course.level];

        const [results3, fields3] = await db.execute(sql3, values3);

        if (!results3[0]) {
          return;
        }

        let level_id = results3[0].id;

        // now the grading
        let sql4 = "SELECT * FROM grading_systems WHERE grading_title = ?";
        let values4 = [course.grading_id];

        const [results4, fields4] = await db.execute(sql4, values4);

        if (!results4[0]) {
          return;
        }

        let grading_id = results4[0].id;

        // getting the college as well from the school id
        let sql2 = "SELECT * FROM schools WHERE id = ?";
        let values2 = [school_id];

        const [results2, fields2] = await db.execute(sql2, values2);

        let college_id = results2[0].college_id;

        // lastly, is_short_course
        // let boolValue = course.is_short_course === "true"; // Convert string to boolean (true)
        let isShortCourseValue = Number(course.is_short_course);

        finalCourses.push({
          id: uniqueCourseID,
          course_code: course.prog_code,
          course_title: course.prog_title,
          course_duration: course.duration,
          duration_measure: course.duration_measure,
          college_id: college_id,
          school_id: school_id,
          department_id: dpt_id,
          level: level_id,
          grading_id: grading_id,
          is_short_course: isShortCourseValue,
        });

        finalCourseVersions.push({
          id: uniqueVersionID,
          course_id: uniqueCourseID,
          version_title: course.prog_version,
          added_on: today,
          added_by: uploaded_by,
        });
      });

      await Promise.all(x);
      console.log("results", {
        finalCourses,
        finalCourseVersions,
      });

      // Constructing the query and values
      const columns = Object.keys(finalCourses[0]);
      const values = finalCourses.map(Object.values);

      const columns2 = Object.keys(finalCourseVersions[0]);
      const values2 = finalCourseVersions.map(Object.values);
      // console.log("the columns", columns);
      // console.log("the values", values);

      // Construct the SQL query
      const placeholders = values
        .map(() => `(${new Array(columns.length).fill("?").join(", ")})`)
        .join(", ");
      const sql = `
    INSERT INTO courses (${columns.join(", ")})
    VALUES ${placeholders}
  `;
      // Flatten values array
      const flattenedValues = [].concat(...values);

      // for the versions
      // Construct the SQL query
      const placeholders2 = values2
        .map(() => `(${new Array(columns2.length).fill("?").join(", ")})`)
        .join(", ");
      const sql2 = `
     INSERT INTO course_versions (${columns2.join(", ")})
     VALUES ${placeholders2}
   `;
      // Flatten values array
      const flattenedValues2 = [].concat(...values2);

      try {
        const [result] = await db.execute(sql, flattenedValues);
        const [result2] = await db.execute(sql2, flattenedValues2);
        console.log("Rows inserted:", result);
        console.log("Rows inserted:", result2);
        return {
          success: "true",
          message: "Courses Uploaded Successfully",
        };
      } catch (error) {
        console.error("Error inserting data:", error);
      }
    },
    saveAdvertisedCourse: async (parent, args) => {
      const { running_admission_id, course_id, added_by } = args;
      // we need the current date
      const today = new Date();

      // no repeations should be allowed
      let sql = `SELECT * FROM advertised_courses WHERE course_id = ? AND running_admission_id= ? AND deleted = 0`;
      let values = [course_id, running_admission_id];

      const [results, fields] = await db.execute(sql, values);

      if (results[0]) {
        return {
          success: "false",
          message: "Course already registered",
        };
      }

      // create new record
      try {
        let sql = `INSERT INTO advertised_courses(running_admission_id, course_id, added_by, added_on) VALUES (?, ?, ?, ?)`;

        let values = [running_admission_id, course_id, added_by, today];

        const [results, fields] = await db.execute(sql, values);

        return {
          success: "true",
          message: "Course registered Successfully",
        };
      } catch (error) {
        console.log("error", error);
        throw new GraphQLError("Failed to register course " + error.message);
      }
    },
    removeAdvertisedCourse: async (parent, args) => {
      try {
        const { advertised_course_id, added_by } = args;

        let sql = `UPDATE advertised_courses SET deleted = 1, removed_by = ?, removed_on = ? WHERE id = ?`;
        const today = new Date();

        let values = [added_by, today, advertised_course_id];

        const [results, fields] = await db.execute(sql, values);

        // console.log("the results", results);
        if (results.affectedRows == 0 || results.changedRows == 0) {
          // no record the provided id
          throw new GraphQLError(
            `No advert course with id ${advertised_course_id}`,
            {
              extensions: {
                // code: '',
                http: { status: 400 },
              },
            }
          );
        }

        return {
          message: "Course Removed Successfully",
          success: "false",
        };
      } catch (error) {
        throw new GraphQLError(error);
      }
    },
    saveCourseAlias: async (parent, args) => {
      const { alias, added_by } = args;

      const data = {
        course_id: alias.course_id,
        alias_code: alias.alias_code,
        study_time_id: alias.study_time_id,
        campus_id: alias.campus_id,
        added_by,
      };

      await saveData({
        table: "course_aliases",
        data,
        id: alias.id,
      });

      return {
        success: "true",
        message: "Program alias Saved Successfully!",
      };
    },
    deleteCourseAlias: async (parent, args) => {
      const { alias_id } = args;

      await softDelete({
        table: "course_aliases",
        id: alias_id,
      });

      return {
        success: "true",
        message: "Program alias Deleted Successfully!",
      };
    },
  },
};

export default courseResolvers;
