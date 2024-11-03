const applicationAttachmentTypeDefs = `#graphql
    scalar Upload

    type ApplicationAttachment {
        id: ID!,
        applicant_id: String!,
        form_no: String!,
        admissions_id: String!, # running_admissions_id
        description: String!,
        file_name: String!,
        file_id: String!,
        url: String
    }

    type Query {
        application_attachments: [ApplicationAttachment]
    }

    type Mutation {
        saveApplicationAttachment(
            attachments: [AttachmentInput]!
            remove_ids: [String],
            has_attachments: Int!,
            applicant_id: String!,
            form_no: String,
            admissions_id: String!,
            completed_form_sections: String!
        ): ResponseMessage
    }

    input AttachmentInput {
        id: ID
        description: String!,
        file: Upload,
        file_name: String!
    }
`;

export default applicationAttachmentTypeDefs;
