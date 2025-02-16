const admissionLetterTypeDefs = `#graphql
    # staff type is missing field -> email 
    type AdmissionLetter {
        id: ID!,
       name: String!,
       scheme_id: String!,
       scheme_title: String!,
       intake_id: String!,
       intake_title: String!,
       template_id: String!,
       file_name: String!,
       created_on: String!,
       created_by: String!,
       last_modified_on: String,
       last_modified_by: String,
       last_modified_by_user: String
    }

    type Query {
        admission_letters: [AdmissionLetter]
    }

    type Mutation {
        saveAdmissionLetter(payload: AdmissionLetterInput): ResponseMessage
    }

    input AdmissionLetterInput {
        id: String,
        intake_id: String!,
        scheme_id: String!,
        description: String!,
        file: Upload,
        file_name: String!,
        template_id: String
    }
`;

export default admissionLetterTypeDefs;
