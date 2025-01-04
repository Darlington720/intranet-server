const campusTypeDefs = `#graphql

    type Campus {
        id: ID!,
        campus_title: String!,
        added_by: String!,
        added_on: String!,
        modified_by: String,
        modified_on: String,
        added_user: Staff,
        modified_user: Staff
    }

    type Query {
        campuses: [Campus]
    }

    type Mutation {
        saveCampus(id: ID, campus_title: String!, added_by: String!): Campus
    }

`;

export default campusTypeDefs;
