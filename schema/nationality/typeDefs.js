const nationalityTypeDefs = `#graphql

    type Nationality {
        id: ID!,
        nationality_title: String!,
        country: String!,
        description: String,
        nationality_category: String
    }

    type Query {
        nationalities: [Nationality]
    }

    # type Mutation {
    #     saveLevel(id: ID, level_code: String!, level_title: String!, added_by: String!): Level
    # }
`;

export default nationalityTypeDefs;
