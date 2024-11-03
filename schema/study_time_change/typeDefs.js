const StudyTimeChangeTypeDefs = `#graphql

    type StudyTimeChange {
        id: ID!,
        student_id: String!,
        prev_study_time_id: String!,
        new_study_time_id: String!,
        change_date: String!,
        change_reason: String,
        changed_by: String!
    }

    type Query {
        study_time_changes(std_id: String): [StudyTimeChange]
    }

    # type Mutation {
    #     saveLevel(id: ID, level_code: String!, level_title: String!, added_by: String!): Level
    # }
`;

export default StudyTimeChangeTypeDefs;
