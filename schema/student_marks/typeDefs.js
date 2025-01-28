const StudentMarksTypeDefs = `#graphql

    type StudentMark {
        biodata: Student,
        result_id: ID!,
        student_no: String!,
        module_id: Int,
        course_unit_code: String,
        course_unit_title: String,
        acc_yr_id: String!,
        acc_yr_title: String!,
        study_yr: String!,
        semester: String!,  
        coursework: Float,         
        exam: Float,               
        final_mark: Float,          
        booklet_number: String,
        status: String!,  # Status: Pending/Approved/Rejected
        approval_log_id: Int,
        visibility: Boolean, # Visibility to students
        uploaded_by: String!,
        migration_type: String # 'active', 'completed'
        comments: String,
        retake_count: Int,
        grading_id: String,
        credit_units: String,
        grade: String,
        grade_point: String,
        TCU: Float,
        CTWS: Float,
        CTCU: Float,
        GPA: Float,
        CGPA: Float,
        yrsem: String,
        remarks: String,
        remark_reason: String
    }

    type ResultApprovalLog {
        log_id: ID!,
        result_id: Int!,
        action: String!,  # Approved/Rejected
        performed_by: String!,
        performed_at: String!,
        comments: String
    }

    type ResultsConfig {
        acc_yr_id: String!,
        acc_yr: String!,
        campus_id: String!,
        campus: String!,
        intake_id: String,
        intake: String!,
        study_time_id: String,
        study_time: String!,
        study_yr: String,
        sem: String
    }

    type CourseUnitReport {
        course_unit_code: String!,
        course_unit_title: String!,
    } 

    type StudentsResults {
        course_units: [CourseUnit]
        students_marks(study_yr: String, sem: String): [Student]
    }

    type Query {
        student_marks(student_no: String!, page: Int!, start: Int!, limit: Int!): [StudentMark]
        get_student_marks(student_no: String!): Student
        std_marks(student_nos: [String]!): [Student]
        get_result_config: ResultsConfig!
        results(payload: ResultsInput!): StudentsResults
    }

    type Mutation {
        bulkActiveStudentsResultsUpload(payload: [BulkActiveResultsInput]!): ResponseMessage
        saveResultsConfig(payload: ResultsConfigInput!): ResponseMessage
    }

    input ResultsInput {
        course_id: String!,
        course_version_id: String!,
        acc_yr_id: String!,
        campus_id: String!,
        intake: String!,
        study_time: String!,
        study_yr: String!,
        sem: String! 
    }

    input ResultsConfigInput {
        acc_yr_id: String!,
        campus_id: String!,
        intake: String!,
        study_time: String!,
        study_yr: String,
        sem: String
    }

    input BulkActiveResultsInput {
        student_no: String!,
        acc_yr: String!,
        study_yr: String!,
        sem: String!,
        module_code: String!,
        module_title: String!,
        cswk: String,
        exam: String,
        final_mark: String,
        no_of_retakes: String,
        remark: String,
        booklet_number: String,
        uploaded_by: String,
        datetime: String,
    }

`;

export default StudentMarksTypeDefs;
