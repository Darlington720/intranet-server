const nationalityCategoryTypeDefs = `#graphql

    type NationalityCategory {
        id: ID!,
        category_title: String!,
        description: String,
    }

    type Query {
        nationality_categories: [NationalityCategory]
    }

    # type Mutation {
    #     saveLevel(id: ID, level_code: String!, level_title: String!, added_by: String!): Level
    # }
`;

export default nationalityCategoryTypeDefs;
