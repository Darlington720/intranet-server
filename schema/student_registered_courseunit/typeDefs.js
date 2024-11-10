const studentRegisteredCourseUnitTypeDefs = `#graphql

    type StudentRegisteredCourseUnit {
        id: ID,
        student_no: String!,
        course_unit_code: String!,
        status: String!, # normal, retake or missed
        paid: Int,
        study_year: Int!,
        semester: Int!,
        invoice_no: String,
        retake_count: Int,
        enrolled_on: String!,
        enrolled_by: String!
        enrolled_user: Staff
        course_unit: CourseUnit,
    }

    type Query {
        student_registered_courseunits(student_no: String!, study_year: Int!, sem: Int!): [StudentRegisteredCourseUnit]
    }

    type Mutation {
        register_module(payload: RegisterModuleInput!): ResponseMessage
        remove_module(module_id: String!): ResponseMessage
    }

    input RegisterModuleInput {
        student_no: String!, 
        course_unit_code: String!, 
        study_yr: Int!, 
        sem: Int!, 
        status: String!,
        acc_yr_id: String!
    }
`;

export default studentRegisteredCourseUnitTypeDefs;
