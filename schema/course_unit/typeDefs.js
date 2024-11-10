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
        added_on: String!,
        last_modified_on: String,
        added_user: Staff,
        last_modified_user: Staff,
    }

    type StudentRegisteredCourseUnit {
        course_unit: CourseUnit,
        enrollment_status: String! # normal, retake or missed
        paid: Int
    }

    type Query {
        course_units(course_version_id: String!): [CourseUnit]
    }

    type Mutation {
        generateModuleCode(course_code: String!): String
        saveCourseUnit(course_unit: CourseUnitInput!, saved_by: String!): ResponseMessage
        uploadCourseUnits(course_units: [CourseUnitUploadInput]!): ResponseMessage
        deleteCourseUnit(unit_id: String!): ResponseMessage
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

    input CourseUnitUploadInput {
        module_code: String!,
        module_title: String!,
        course_code: String!,
        course_version: String!,
        credit_units: Int!,
        module_level: String!,
        grading_id: String!,
        module_year: Int!,
        module_sem: Int!,
    }

`;

export default courseUnitTypeDefs;
