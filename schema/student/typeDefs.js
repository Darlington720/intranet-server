const studentTypeDefs = `#graphql

    type Student {
        id: ID,
        std_id: ID,
        student_no: String!
        name: String,
        registration_no: String!
        applicant_id: String!,
        course_id: String!,
        campus_id: String!,
        course_version_id: String!,
        course_details: CourseVersion,
        campus_title: String!,
        study_time_id: String!,
        study_time_title: String!,
        intake_id: String!,
        intake_title: String!,
        form_no: String,
        biodata: Applicant!,
        program_choice_id: String,
        is_std_verified: Int!,
        is_resident: Int!,
        hall_of_residence: String,
        entry_study_yr: String!,
        entry_acc_yr: String!,
        entry_acc_yr_title: String!,
        course: Course!,
        intake: Intake!,
        application_form: Application,
        is_on_sponsorship: Int,
        sponsorship: String,
        archived: Int!, # consider it as delete
        added_by: String!,
        verified_by: String,
        admitted_on: String,
        status: Int,
        current_info: CurrentStudentInfo
        # enrollment_status: String # this is supposed to be Not Enrolled, or Enrolled,
        enrollment_history: [StudentEnrollment]!
        registration_history: [StudentRegistration]!
        invoices: [Invoice]!
        # registration_status
        # transactions
        # has_completed
        # has_graduated
        # account_balance -> to be calculated based on txns that are not allocated
    }

    # This is to sammarise the total applicants based on their first choice
    type StudentCourse {
        id: ID!,
        student_id: String!,
        course_id: String!,
        course_version_id: String!,
        creation_date: String!,
        is_current: Int!
    }
    
    type CurrentStudentInfo {
        recent_enrollment: StudentEnrollment,
        current_acc_yr: String!,
        active_sem_id: String!,
        acc_yr_id: String!,
        true_sem: String!,
        true_study_yr: String,
        enrollment_status: String!,
        progress: String!,
        registration_status: String
        account_balance: Int
    }

    type StudentReport {
        id: ID!
        student_no: String!,
        registration_no: String!,
        surname: String!,
        other_names: String!,
        gender: String!,
        email: String!,
        phone_no: String!,
        entry_acc_yr: String!,
        nationality: String!,
        billing_nationality: String!,
        is_resident: Int,
        hall_of_attachment: String,
        hall_of_residence: String,
        study_time: String!,
        acc_yr: String!,
        study_yr: String!,
        sem: String!,
        enrollment_token: String!,
        enrollment_status: String!,
        course_code: String!,
        course_title: String!,
        course_level: String!,
        school_code: String!,
        school_title: String!,
        college_code: String!,
        college_title: String!,
        sponsorship: String,
        campus: String!,
        intake:  String!,
        registration_token: String,
        registration_status: String!,
        registered: Int!,
        provisional: Int,
        enrollment_date: String!,
        registration_date:  String!,
        tuition_invoice_no: String!,
        tuition_amount: String!,
        tuition_credit: String,
        tuition_paid: String,
        tuition_balance_due: String,
        functional_invoice_no: String!,
        functional_amount: String!,
        functional_credit: String,
        functional_paid: String,
        functional_balance_due: String,
        total_bill: String,
        total_credit: String,
        total_paid: String,
        total_due: String
    }



    type Query {
        students(campus: String, intake: String, acc_yr: String, course_version: String, sic: Int): [Student]!
        student_autocomplete(query: String!): [Student]!
        loadStudentFile(student_id: String, student_no: String): Student
        # currentEnrollmentInfo(student_id: String, student_no: String, intake_id: String!): [StudentEnrollment]
    }

    type Mutation {
        registerApplicant(
            surname: String!,
            other_names: String!,
            email: String!,
            phone_no: String!,
            nationality_id: String!,
            date_of_birth: String!,
            gender: String!,
        ): Applicant
        verifyOTP(user_id: String!, otp_code: String!): Applicant
        resendOTP(user_id: String!): ResponseMessage
        setApplicantPassword(user_id: String!, password: String!): Applicant
        applicantLogin(mode: String!, user_id: String!, password: String!): Applicant
        changeApplicantPassword(user_id: String!, old_password: String!, new_password: String!): ResponseMessage
        saveApplicantBioData(
            application_id: ID,
            applicant_id: String!,
            form_no: String,
            admissions_id: String!,
            salutation: String!,
            district_of_birth: String!,
            district_of_origin: String!,
            religion: String!,
            marital_status: String!,
            nin: String,
            place_of_residence: String!,
            completed_form_sections: String!
        ): ResponseMessage
    }
`;

export default studentTypeDefs;
