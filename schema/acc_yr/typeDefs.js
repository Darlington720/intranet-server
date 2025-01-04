const AccYrTypeDefs = `#graphql

    type AcademicYear {
        id: ID!,
        acc_yr_title: String!,
        added_by: String!,
        added_on: String!,
        modified_by: String,
        modified_on: String,
        added_user: Staff,
        modified_user: Staff
    }

    type Query {
        acc_yrs: [AcademicYear]
    }

    type Mutation {
        saveAccYr(id: ID, acc_yr_title: String!, added_by: String!): AcademicYear
    }

`;

export default AccYrTypeDefs;
