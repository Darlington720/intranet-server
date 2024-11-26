const StudentRegistrationTypeDefs = `#graphql

    type StudentRegistration {
        id: ID!,
        student_no: String!,
        registration_token: String,
        enrollment_token: String,
        acc_yr_id: String!,
        acc_yr_title: String!,
        study_yr: String!,
        sem: String!,
        provisional: Int!,
        provisional_reason: String,
        provisional_expiry: String,
        de_registered: Int!,
        de_registered_reason: String,
        reg_comments: String,
        registered_by: String!
        date: String!,
        registered_user: Staff
    }

    type ReportSummary {
        school_id: String!,
        school_code: String!,
        school_title: String!,
        course_id: String!,
        course_code: String!,
        course_title: String!,
        study_yr: String!,
        total_enrolled: Int,
        total_provisional: Int
        total_registered: Int
    }

    type ReportTotals {
        total_enrolled: Int,
        total_provisional: Int,
        total_registered: Int,
    }

   type StudentRegistrationReport {
        totals: ReportTotals
        report_summary: [ReportSummary]
    }

    type Query {
        student_registration_history(student_no: String!): [StudentRegistration]
        student_registration_report(payload: RegReportInput!): StudentRegistrationReport
        get_students(payload: RegReportInput!): [StudentReport]
        download_report(payload: RegReportInput!): String!
        # getCurrentStudentEnrollmentDetails(student_id: String, student_no: String): [AcademicSchedule]
   
    }

    type Mutation {
        registerStudent(
            payload: RegInput
            ): ResponseMessage
        savePastEnrollment(
            student_id: String!,
            student_no: String!,
            acc_yr: String!,
            study_yr: Int!,
            semester: Int!,
            intake: String!,
            # active_sem_id: String!,
            enrollment_status: String!,
            enrolled_by: String!,
        ):ResponseMessage

        deleteEnrollment(
            enrollment_id: String!
        ): ResponseMessage

        editEnrollment(
            enrollment_id: ID!,
            acc_yr: String!,
            study_yr: Int!,
            semester: Int!,
            enrollment_status: String!,
            enrolled_by: String!,
            invoice: Int!,
        ): ResponseMessage
    }

    input RegInput {
        student_no: String!,
        acc_yr_id: String!,
        study_yr: String!,
        sem: String!,
        enrollment_token: String!,
        reg_comments: String,
        provisional: Int,
        provisional_reason: String,
        provisional_expiry: String,
    }   

    input RegReportInput {
        campus_id: String!,
        college_id: String!,
        intake_id: String!,
        acc_yr_id: String!,
        study_time_id: String!,
        semester: Int!,
        school_id: String,
        course_id: String
    }
`;

export default StudentRegistrationTypeDefs;
