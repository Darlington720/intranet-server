const awardTypeDefs = `#graphql

    type Award {
        id: ID!,
        level_id: String!,
        award_title: String!,
        modified_by: String,
        modified_on: String,
        added_user: Staff!,
        modified_user: Staff,
        level: Level
    }

    type Query {
        awards: [Award]
    }

    type Mutation {
        saveAward(id: ID, level_id: String!, award_title: String!, added_by: String!): Award
    }
`;

export default awardTypeDefs;
