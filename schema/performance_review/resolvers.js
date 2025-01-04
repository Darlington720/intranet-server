import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import saveData from "../../utilities/db/saveData.js";
import { getApprovers, getEmployees } from "../employee/resolvers.js";
import sendEmail from "../../utilities/emails/mailer.js";
import checkPermission from "../../utilities/helpers/checkPermission.js";
import hasPermission from "../../utilities/helpers/hasPermission.js";
import { getEvaluationTemplates } from "../evaluation_template/resolvers.js";

const generatePerformanceReviewEmail = ({ subject, body }) => {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.5; }
          .container { margin: 0 auto; padding: 20px; max-width: 600px; }
          .header { background: #4CAF50; color: #fff; padding: 10px; text-align: center; }
          .content { margin: 20px 0; }
          .footer { font-size: 12px; color: #888; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${subject}</h2>
          </div>
          <div class="content">
            ${body}
          </div>
          <div class="footer">
            <p>Performance Management System</p>
            <p>&copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const getPerformanceReviews = async ({ user_id, id }) => {
  try {
    let values = [];
    let where = "";

    if (id) {
      where += " AND performance_reviews.id = ?";
      values.push(id);
    }

    if (user_id) {
      // meaning view only own created reviews and the ones created for u
      where +=
        " AND performance_reviews.added_by = ? OR performance_reviews.employee_id = ?";
      values.push(user_id, user_id);
    }

    const sql = `
      SELECT 
        performance_reviews.*,
        CONCAT(salutations.salutation_code, " ", e1.surname, " ", e1.other_names) AS employee_name,
        CONCAT(salutations.salutation_code, " ", e2.surname, " ", e2.other_names) AS added_by_name,
        evaluation_templates.template_name
      FROM performance_reviews
      LEFT JOIN employees e1 ON e1.id = performance_reviews.employee_id
      LEFT JOIN employees e2 ON e2.id = performance_reviews.added_by
      LEFT JOIN salutations ON e1.salutation_id = salutations.id
      LEFT JOIN evaluation_templates ON performance_reviews.template_id = evaluation_templates.template_id
      WHERE performance_reviews.deleted = 0 ${where}
    `;

    const [results] = await db.execute(sql, values);

    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching reviews " + error.message);
  }
};

const performanceReviewResolvers = {
  Query: {
    performance_reviews: async (parent, args, context) => {
      const user = context.req.user;

      // check and see if user has permission to view all reviews
      const can_manage_all_reviews = hasPermission(
        user.permissions,
        "can_manage_all_appraisals"
      );

      const result = await getPerformanceReviews({
        user_id: !can_manage_all_reviews ? user.id : null,
      });
      return result;
    },
    performance_review: async (parent, args, context) => {
      const results = await getPerformanceReviews({
        id: args.id,
      });

      return results[0];
    },
  },
  PerformanceReview: {
    employee: async (parent, args, context) => {
      const employee_id = parent.employee_id;

      const results = await getEmployees({
        id: employee_id,
      });

      return results[0];
    },
    template: async (parent, args, context) => {
      const template_id = parent.template_id;

      const results = await getEvaluationTemplates({
        template_id,
      });

      return results[0];
    },
    employee_approvers: async (parent, args, context) => {
      const employee_id = parent.employee_id;

      const results = await getApprovers({
        employee_id,
      });

      return results;
    },
  },

  Mutation: {
    savePerformanceReview: async (parent, args, context) => {
      try {
        const user_id = context.req.user.id;
        const userPermissions = context.req.user.permissions;
        const { id, employee_id, template_id, status, period } = args.payload;

        checkPermission(userPermissions, "can_create_appraisals");

        const data = {
          employee_id,
          template_id,
          status,
          review_period: period,
          added_by: user_id,
          added_on: new Date(),
        };

        await saveData({
          table: "performance_reviews",
          data,
          id,
        });

        // Fetch employee and creator details
        const [employee] = await getEmployees({ id: employee_id });
        const [creator] = await getEmployees({ id: user_id });

        if (!employee || !creator) {
          throw new Error("Employee or creator details not found");
        }

        if (employee_id != user_id) {
          const employeeEmailContent = generatePerformanceReviewEmail({
            subject: "New Performance Review Assigned",
            body: `
              <p>Dear ${employee.salutation} ${employee.surname} ${employee.other_names},</p>
              <p>${creator.salutation} ${creator.surname} ${creator.other_names} has started a performance review for you.</p>
              <p>Please make sure to update this review as soon as possible.</p>
              <p>Best regards,<br>Performance Management Team</p>
            `,
          });

          await sendEmail({
            to: employee.email,
            subject: "New Performance Review Assigned",
            message: employeeEmailContent,
          });
        }

        // Send email to the creator
        const creatorEmailContent = generatePerformanceReviewEmail({
          subject: "Performance Review Created",
          body: `
        <p>Dear ${creator.salutation} ${creator.surname} ${creator.other_names},</p>
        <p>The performance review has been successfully created.</p>
        <p>${employee.salutation} ${employee.surname} ${employee.other_names} has been notified about the review.</p>
        <p>Best regards,<br>Performance Management Team</p>
      `,
        });

        // email to the creator of the review
        await sendEmail({
          to: creator.email,
          subject: "Performance Review Created",
          message: creatorEmailContent,
        });

        return {
          success: "true",
          message: "Performance Review Saved Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default performanceReviewResolvers;
