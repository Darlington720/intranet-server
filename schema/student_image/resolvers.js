import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import findImageWithExtension from "../../utilities/findImageWithExtension.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import saveData from "../../utilities/db/saveData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getRecentUploadedImages = async () => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
    const day = String(today.getDate()).padStart(2, "0");

    const localDate = `${year}-${month}-${day}`;

    // const sql = `
    //         SELECT
    //           students.student_no,
    //           students.registration_no,
    //           students.course_id,
    //           CONCAT(applicants.surname, ' ', applicants.other_names) AS name,
    //           student_images.id
    //          FROM students
    //          LEFT JOIN applicants ON applicants.id = students.applicant_id
    // `;
    const sql = `SELECT 
    student_images.*,
    CONCAT(applicants.surname, ' ', applicants.other_names) AS name 
    FROM student_images 
    LEFT JOIN students ON student_images.stdno = students.student_no
    LEFT JOIN applicants ON applicants.id = students.applicant_id
    WHERE DATE(student_images.uploaded_on) = ?;`;
    const values = [localDate];

    const [results, fields] = await db.execute(sql, values);
    console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching images");
  }
};

const studentImageResolvers = {
  Query: {
    getRecentlyUploadedImages: async () => {
      const result = await getRecentUploadedImages();
      return result;
    },
  },
  StudentImage: {
    student: async (parent, args) => {
      try {
        const sql = `SELECT * FROM students WHERE  student_no = ? AND deleted = 0 AND is_std_verified = 1`;
        const values = [parent.stdno];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0];
      } catch (error) {
        console.log("error", error);
        throw new GraphQLError("Error fetching images");
      }
    },
    added_user: async (parent, args) => {
      try {
        const user_id = parent.uploaded_by;
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
    saveStudentImage: async (_, args) => {
      try {
        const { id, file, stdno, uploaded_by } = args;
        // console.log(args);

        const existingImage = findImageWithExtension(
          stdno,
          path.join(__dirname, "../../public/student_photos")
        );
        const _file = await file;

        const { createReadStream, filename, mimetype, encoding } = _file;
        const extension = filename.split(".").pop();

        const folderPath = path.join(__dirname, "../../public/student_photos");

        let data = null;

        if (id) {
          data = {
            stdno,
            upload_status: "update",
            modified_by: uploaded_by,
            modified_on: new Date(),
          };
        } else {
          data = {
            stdno,
            uploaded_by,
            uploaded_on: new Date(),
            upload_status: "new",
          };
        }

        await saveData({
          table: "student_images",
          id,
          data,
        });

        // console.log("existing image", existingImage);

        if (existingImage) {
          fs.unlinkSync(path.join(folderPath, existingImage));
        }

        // Define the path for the new image
        const newFilename = `${stdno}.${extension}`;
        const filePath = path.join(folderPath, newFilename);

        // Ensure the 'student_photos' directory exists
        fs.mkdirSync(folderPath, { recursive: true });

        // Create a writable stream to save the new file (overwrite old one)
        const stream = createReadStream();
        const out = fs.createWriteStream(filePath);

        stream.pipe(out);

        out.on("finish", () => {});

        return {
          success: "true",
          message: "Image uploaded Successfully",
        };
      } catch (error) {
        console.log(error.message);
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default studentImageResolvers;
