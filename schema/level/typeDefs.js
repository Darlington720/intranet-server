const levelTypeDefs = `#graphql

    type Level {
        id: ID!,
        level_code: String!,
        level_title: String!,
        modified_by: String,
        modified_on: String,
        added_user: Staff!,
        modified_user: Staff
        study_times: [StudyTime]
    }

    type Query {
        levels: [Level]
    }

    type Mutation {
        saveLevel(id: ID, level_code: String!, level_title: String!, level_study_times: [String]!, added_by: String!): Level
    }
`;

export default levelTypeDefs;
