import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";

const getUniversityDetails = async () => {
  try {
    let sql = `SELECT * FROM university`;

    const [results, fields] = await db.execute(sql);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching modules");
  }
};

const awardResolvers = {
  Query: {
    university_details: async () => {
      const result = await getUniversityDetails();
      return result[0];
    },
  },
  Mutation: {
    saveUniversityDetails: async (parent, args) => {
      const {
        id,
        university_code,
        university_title,
        contact,
        entry_yrs,
        semeters_per_acc_yr,
        university_x_account,
        university_facebook_account,
        university_instagram_account,
        university_logo,
        favicon,
        primary_color,
        secondary_color,
      } = args;

      const uniqueID = generateUniqueID();

      if (id) {
        // update
        try {
          let sql = `UPDATE university SET 
          university_code = ?, 
          university_title = ?, 
          contact = ?, 
          entry_yrs = ?, 
          semeters_per_acc_yr = ?, 
          university_x_account = ?,
          university_facebook_account = ?, 
          university_instagram_account = ?, 
          university_logo = ?,
          favicon = ?,
          primary_color = ?,
          secondary_color = ?
          WHERE id = ?`;

          let values = [
            university_code,
            university_title,
            contact,
            entry_yrs,
            semeters_per_acc_yr,
            university_x_account,
            university_facebook_account,
            university_instagram_account,
            university_logo,
            favicon,
            primary_color,
            secondary_color,
            id,
          ];

          const [results, fields] = await db.execute(sql, values);

          // console.log("the results", results);
          if (results.affectedRows == 0) {
            // no record the provided id
            throw new GraphQLError(`ID not found`, {
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
          let sql = `INSERT INTO university(
            id,
            university_code,
            university_title,
            contact,
            entry_yrs,
            semeters_per_acc_yr,
            university_x_account,
            university_facebook_account,
            university_instagram_account,
            university_logo,
            favicon,
            primary_color,
            secondary_color
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?, ? )`;

          let values = [
            uniqueID,
            university_code,
            university_title,
            contact,
            entry_yrs,
            semeters_per_acc_yr,
            university_x_account,
            university_facebook_account,
            university_instagram_account,
            university_logo,
            favicon,
            primary_color,
            secondary_color,
          ];

          const [results, fields] = await db.execute(sql, values);
        } catch (error) {
          console.log("error", error);
          throw new GraphQLError("Failed to insert university details");
        }
      }

      let sql = `SELECT * FROM university WHERE id = ?`;

      let values = [id ? id : uniqueID];

      const [results2, fields2] = await db.execute(sql, values);
      // console.log("resuit2", results2[0]);
      return results2[0];
    },
  },
};

export default awardResolvers;
