const applicantFormSectionsTypeDefs = `#graphql

    type ApplicantFormSections {
        section_id: ID!,
        section_title: String!,
        admission_level_id: String
    }

    type Query {
        applicant_form_sections(admission_level_id: String!): [ApplicantFormSections]!
    }
`;

export default applicantFormSectionsTypeDefs;
