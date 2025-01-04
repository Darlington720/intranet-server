const evaluationTemplatesTypeDefs = `#graphql

    type EvaluationTemplate {
        template_id: ID!,
        template_name: String!,
        description: String,
        sections: [TemplateEvaluationSections!]!
    }

    type TemplateEvaluationSections {
        section_id: ID!,
        template_id: Int!,
        section_title: String!,
        section_order: Int!,
        questions: [SectionQuestion]!
    }

    type SectionQuestion {
        question_id: ID!
        section_id: Int!,
        question_name: String!,
        description: String,
        question_order: Int!
    }

    type Query {
        evaluation_templates: [EvaluationTemplate]
        evaluation_template_questions(template_id: ID!): [TemplateEvaluationSections]!
    }

    type Mutation {
        saveEvaluationTemplate(payload: EvaluationTemplateInput): ResponseMessage
        deleteEvaluationTemplate(template_id: ID!): ResponseMessage

    }

    input EvaluationTemplateInput {
        template_id: ID,
        template_name: String!
        description: String
    }
`;

export default evaluationTemplatesTypeDefs;
