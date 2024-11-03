const courseChangeTypeDefs = `#graphql

    type CourseChange {
        id: ID!,
        student_id: String!,
        prev_course_id: String!,
        new_course_id: String!,
        change_date: String!,
        change_reason: String,
        changed_by: String!
    }

    type Query {
        course_changes(std_id: String): [CourseChange]
    }

    # type Mutation {
    #     saveLevel(id: ID, level_code: String!, level_title: String!, added_by: String!): Level
    # }
`;

export default courseChangeTypeDefs;
