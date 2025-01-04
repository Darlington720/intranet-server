import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import saveData from "../../utilities/db/saveData.js";
import softDelete from "../../utilities/db/softDelete.js";
import DataLoader from "dataloader";

export const getEvaluationTemplates = async ({ template_id }) => {
  try {
    let values = [];
    let where = "";

    if (template_id) {
      where += " AND template_id = ?";
      values.push(template_id);
    }

    let sql = `SELECT 
      * 
      FROM evaluation_templates
      WHERE deleted = 0 ${where} ORDER BY template_name ASC`;

    const [results] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching evaluation templates");
  }
};

const getTemplateSections = async ({ template_id }) => {
  try {
    let values = [];
    let where = "";

    if (template_id) {
      where += " AND template_id = ?";
      values.push(template_id);
    }

    let sql = `SELECT * FROM evaluation_templates_sections WHERE deleted = 0 ${where} ORDER BY section_order ASC `;

    const [results] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching evaluation sections");
  }
};

const questionsLoader = new DataLoader(async (sectionIds) => {
  const placeholders = sectionIds.map(() => "?").join(",");
  const sql = `SELECT 
  *
  FROM evaluation_questions WHERE section_id IN (${placeholders}) AND deleted = 0`;
  const [results] = await db.execute(sql, sectionIds);

  // Map results by section_id
  const sectionMap = sectionIds.map(
    (id) => results.filter((qn) => qn.section_id === id) || null
  );

  return sectionMap;
});

const evaluationTemplateRessolvers = {
  Query: {
    evaluation_templates: async () => {
      const result = await getEvaluationTemplates({});
      return result;
    },
    evaluation_template_questions: async (parent, args) => {
      const template_id = args.template_id;

      const sections = await getTemplateSections({
        template_id,
      });

      return sections;
    },
  },
  EvaluationTemplate: {
    sections: async (parent, args) => {
      const template_id = parent.template_id;

      const sections = await getTemplateSections({
        template_id,
      });

      return sections;
    },
  },
  TemplateEvaluationSections: {
    questions: (parent) => {
      return questionsLoader.load(parent.section_id);
    },
  },
  Mutation: {
    saveEvaluationTemplate: async (parent, args) => {
      try {
        const { template_id, template_name, description } = args.payload;

        const data = {
          template_name,
          description,
        };

        await saveData({
          table: "evaluation_templates",
          data,
          id: template_id,
          idColumn: "template_id",
        });

        return {
          success: "true",
          message: "Evaluation template saved successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    deleteEvaluationTemplate: async (parent, args) => {
      const { template_id } = args;

      await softDelete({
        table: "evaluation_templates",
        id: template_id,
        idColumn: "template_id",
      });

      return {
        success: "true",
        message: "Evaluation template deleted successfully",
      };
    },
  },
};

export default evaluationTemplateRessolvers;
