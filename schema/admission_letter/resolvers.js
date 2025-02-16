import {
  tredumoDB,
  db,
  database,
  postgraduateDB,
} from "../../config/config.js";
import fs from "fs";
import { GraphQLError } from "graphql";
import path from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";
import saveData from "../../utilities/db/saveData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getAdmissionTemplate = async ({ id }) => {
  let where = "";
  let values = [];

  if (id) {
    where += " AND admission_letters.id = ?";
    values.push(id);
  }

  let sql = `
    SELECT 
      admission_letters.*,
      intakes.intake_title,
      schemes.scheme_title,
      CONCAT(salutations.salutation_code, ' ', employees.surname, ' ', employees.other_names) AS last_modified_by_user
    FROM admission_letters
    LEFT JOIN intakes ON intakes.id = admission_letters.intake_id
    LEFT JOIN schemes ON schemes.id = admission_letters.scheme_id
    LEFT JOIN employees ON employees.id = admission_letters.last_modified_by
    LEFT JOIN salutations ON salutations.id = employees.salutation_id
    WHERE admission_letters.deleted = 0 ${where}
    ORDER BY admission_letters.created_on DESC;
    `;

  const [results] = await db.execute(sql, values);

  return results;
};

const applicationResolvers = {
  Query: {
    admission_letters: async (parent, args) => {
      // return admission letters
      const letters = await getAdmissionTemplate({});

      return letters;
    },
  },
  Mutation: {
    saveAdmissionLetter: async (parent, args, context) => {
      const user_id = context.req.user.id;
      const {
        id,
        intake_id,
        scheme_id,
        description,
        file,
        file_name,
        template_id,
      } = args.payload;

      try {
        // lets first cater for the file
        // console.log(attachment);
        let newFilename;

        // if the attachment doesnt exist
        if (!template_id) {
          const _file = await file;

          const { createReadStream, filename, mimetype, encoding } = _file;

          // Generate a random string for the filename
          const randomString = randomBytes(16).toString("hex");
          const extension = path.extname(filename).slice(1); // Extract file extension
          newFilename = `${randomString}.${extension}`;
          // Define the path where the file will be saved
          const filePath = path.join(
            __dirname,
            "../../public/templates/admission_letters",
            newFilename
          );

          // Ensure the 'attachments' directory exists
          fs.mkdirSync(path.join(__dirname, "admission_letters"), {
            recursive: true,
          });

          // // Create a writable stream to save the file
          const stream = createReadStream();
          const out = fs.createWriteStream(filePath);

          // Pipe the file data into the writable stream
          stream.pipe(out);
        } else {
          // use the existing id to get the existing filename
          const existingTemplate = await getAdmissionTemplate({
            id: template_id,
          });
          newFilename = existingTemplate[0].template_id;
        }

        if (id) {
          // update the record
          const _data = {
            name: description,
            scheme_id,
            intake_id,
            template_id: newFilename,
            file_name,
            last_modified_on: new Date(),
            last_modified_by: user_id,
          };

          const save_id = await saveData({
            table: "admission_letters",
            data: _data,
            id,
          });
        }
        // now, we want to store admission letters
        const data = {
          name: description,
          scheme_id,
          intake_id,
          template_id: newFilename,
          file_name,
          created_on: new Date(),
          created_by: user_id,
          last_modified_on: new Date(),
          last_modified_by: user_id,
        };

        const save_id = await saveData({
          table: "admission_letters",
          data,
          id: null,
        });

        return {
          success: "true",
          message: "Admission Letter Saved Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default applicationResolvers;
