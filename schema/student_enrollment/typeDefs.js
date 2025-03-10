const StudentEnrollmentTypeDefs = `#graphql

    type StudentEnrollment {
        id: ID!,
        enrollment_token: String!,
        stdno: String!,
        acc_yr: String!,
        study_yr: String!,
        sem: String!,
        true_sem: Int,
        enrollment_status_id: String!,
        datetime: String!,
        enrolled_by: String!,
        session_id: String!,
        invoiced: Int!,
        tuition_invoice_no: String,
        functional_invoice_no: String,
        exempt_reason: String,
        enrollment_status: EnrollmentStatus,
        acc_yr_title: String,
        active: Boolean,
        enrolled_by_type: String,
    }


    type Query {
        student_enrollment_history(student_id: String, student_no: String): [StudentEnrollment]
        # getCurrentStudentEnrollmentDetails(student_id: String, student_no: String): [AcademicSchedule]
    }

    type Mutation {
        enrollStudent(
            student_id: String!,
            student_no: String!,
            study_yr: Int!,
            semester: Int!,
            enrollment_status: String!,
            enrolled_by: String!,
            ): ResponseMessage

        selfEnrollment(
            study_yr: String!,
            sem: String!,
            enrollment_status: String!,
        ): Response

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
        ): ResponseMessage

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

        activateSemester(id: ID!): Response

        # selfStudentEnrollment(
        #     student_id: String,
        #     student_no: String,
        #     study_yr: String!,
        #     active_sem_id: String!,
        #     enrollment_status: String!,
        #     enrolled_by: String!,
        #     ): ResponseMessage
    }

`;

export default StudentEnrollmentTypeDefs;
