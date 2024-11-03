const collegeTypeDefs = `#graphql

    type College {
        id: ID!,
        college_code: String!,
        college_title: String!,
        schools: [School]! # to be implemented
    }

    type Query {
        colleges: [College]
    }

    type Mutation {
        saveCollege(id: ID, college_code: String!, college_title: String!): [College]
    }

`;

export default collegeTypeDefs;
