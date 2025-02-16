import { db, port } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import fs from "fs";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";
import path from "path";
import {
  createApplication,
  getApplicationForms,
  updateApplicationCompletedSections,
} from "../application/resolvers.js";
import saveData from "../../utilities/db/saveData.js";
import { checkApplicantData } from "../applicant/resolvers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getApplicantAttachments = async ({
  id,
  applicant_id,
  form_no,
  admissions_id,
}) => {
  try {
    let where = "";
    let values = [];

    if (id) {
      where += " AND application_attachments.id = ?";
      values.push(id);
    }

    if (applicant_id) {
      where += " AND application_attachments.applicant_id = ?";
      values.push(applicant_id);
    }

    if (admissions_id) {
      where += " AND application_attachments.admissions_id = ?";
      values.push(admissions_id);
    }

    if (form_no) {
      where += " AND application_attachments.form_no = ?";
      values.push(form_no);
    }

    let sql = `SELECT *
      FROM 
      application_attachments
      WHERE application_attachments.deleted = 0 ${where}`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error.message);
    throw new GraphQLError(
      "Error fetching other applicant attachments " + error.message,
      {
        extensions: {
          code: "UNAUTHENTICATED",
          http: { status: 501 },
        },
      }
    );
  }
};

const ApplicationAttachmeentResolvers = {
  Upload: GraphQLUpload,
  Query: {
    awards: async () => {
      // const result = await getAllAwards();
      // return result;
    },
  },
  ApplicationAttachment: {
    url: (parent) => {
      return `http://localhost:${port}/attachments/${parent.file_id}`;
    },
  },
  Mutation: {
    saveApplicationAttachments: async (_, args, context) => {
      const applicant_id = context.req.user.applicant_id;
      try {
        const {
          remove_ids,
          admissions_id,
          attachments,
          has_attachments,
          form_no,
        } = args;

        const applicantData = await checkApplicantData(applicant_id, args);

        if (has_attachments) {
          // now lets work on the actual results
          const idsString = remove_ids.join(","); // Convert array to comma-separated string
          // console.log("ids", idsString);
          if (idsString) {
            const sql = `DELETE FROM application_attachments WHERE id IN (${idsString})`;

            // Execute the SQL query
            await db.execute(sql);
          }

          // save the attachments
          for (const attachment of attachments) {
            // console.log(attachment);
            let newFilename;

            // if the attachment doesnt exist
            if (!attachment.id) {
              const file = await attachment.file;

              const { createReadStream, filename, mimetype, encoding } = file;

              // Generate a random string for the filename
              const randomString = randomBytes(16).toString("hex");
              const extension = mimetype.split("/")[1]; // Extract file extension
              newFilename = `${randomString}.${extension}`;
              // Define the path where the file will be saved
              const filePath = path.join(
                __dirname,
                "../../public/attachments",
                newFilename
              );

              // Ensure the 'attachments' directory exists
              fs.mkdirSync(path.join(__dirname, "attachments"), {
                recursive: true,
              });

              // // Create a writable stream to save the file
              const stream = createReadStream();
              const out = fs.createWriteStream(filePath);

              // Pipe the file data into the writable stream
              stream.pipe(out);
            } else {
              // use the existing id to get the existing filename
              const existingAttachment = await getApplicantAttachments({
                id: attachment.id,
              });
              newFilename = existingAttachment[0].file_id;
            }

            const data = {
              applicant_id,
              form_no: applicantData.form_no,
              admissions_id: applicantData.admissions_id,
              file_name: attachment.file_name,
              description: attachment.description,
              file_id: newFilename,
            };

            // console.log(data);

            const save_id = await saveData({
              table: "application_attachments",
              id: attachment.id,
              data,
            });
          }
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
            has_attachments,
            attachments_section_complete: true,
          },
          id: _application[0].id,
        });

        const application = await getApplicationForms({
          id: save_id,
        });

        return {
          success: true,
          message: "Attachments Saved Successfully",
          result: application[0],
        };
      } catch (error) {
        console.log(error.message);
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default ApplicationAttachmeentResolvers;
