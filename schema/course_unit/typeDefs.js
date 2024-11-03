const courseUnitTypeDefs = `#graphql

    type CourseUnit {
        id: ID!,
        course_unit_code: String!,
        course_unit_title: String!,
        course_id: String!,
        course_version_id: String!,
        course_unit_year: String!,
        course_unit_sem: String!,
        course_unit_level: String!,
        credit_units: String!,
        grading_id: String!,
    }

    type Query {
        course_units(course_version_id: String!): [CourseUnit]
    }

    type Mutation {
        generateModuleCode(course_code: String!): String
        saveCourseUnit(course_unit: CourseUnitInput!, saved_by: String!): ResponseMessage
    }

    input CourseUnitInput {
        id: ID,
        course_unit_code: String!,
        course_unit_title: String!,
        course_id: String!,
        course_version_id: String!,
        course_unit_year: String!,
        course_unit_sem: String!,
        course_unit_level: String!,
        credit_units: String!,
        grading_id: String!,
    }
`;

export default courseUnitTypeDefs;
