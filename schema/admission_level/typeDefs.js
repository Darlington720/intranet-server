const AdmissionLevelTypeDefs = `#graphql

   type AdmissionLevel {
    id: ID!,
    admission_level_title: String!,
    prog_levels: String,
    admission_level_description: String!,
    created_by: String!,
    created_on: String!,
    modified_by: String,
    modified_on: String,
    created_user: Staff,
    modified_user: Staff,
    running_admissions: [RunningAdmission],
   }

    type Query {
       admission_levels: [AdmissionLevel]
    }

    type Mutation {
        saveAdmissionLevel(
            id: ID, 
            admission_level_title: String!,
            prog_levels: String!,
            admission_level_description: String!,
            added_by: String!, 
        ): ResponseMessage
        deleteAdmissionLevel(admission_level_id: String!): ResponseMessage
    }

`;

export default AdmissionLevelTypeDefs;
