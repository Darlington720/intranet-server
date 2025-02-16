const nextOfKinTypeDefs = `#graphql

    type NextOfKin {
        id: ID!,
        applicant_id: String!,
        form_no: String!,
        admissions_id: String!, # running_admissions_id
        full_name: String!,
        email: String!,
        address: String!,
        phone_no: String!,
        relation: String!
    }

    type Query {
        next_of_kin: [Nationality]
    }

    type Mutation {
        saveNextOfKin(
            id: ID, 
            form_no: String!,
            admissions_id: String!, # running_admissions_id
            full_name: String!,
            email: String!,
            address: String!,
            phone_no: String!,
            relation: String!,
            ): ApplicationResponse

    }
`;

export default nextOfKinTypeDefs;
