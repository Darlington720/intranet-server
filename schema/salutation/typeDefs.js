const salutationTypeDefs = `#graphql

    type Salutation {
        id: ID!,
        salutation_code: String!,
        salutation_description: String!,
    }

    type Query {
        salutations: [Salutation]
    }

    # type Mutation {
    #     saveLevel(id: ID, level_code: String!, level_title: String!, added_by: String!): Level
    # }
`;

export default salutationTypeDefs;
