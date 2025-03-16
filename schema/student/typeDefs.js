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
        is_resident: Boolean!,
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
        admitted_by_user:  String
        status: Int,
        study_yr: String,
        current_sem: String,
        current_info: CurrentStudentInfo
        # enrollment_status: String # this is supposed to be Not Enrolled, or Enrolled,
        enrollment_history: [StudentEnrollment]!
        registration_history: [StudentRegistration]!
        invoices: [Invoice]!
        student_marks(study_yr: String, sem: String): [StudentMark]
        course_duration: Int
        has_cleared: Boolean,
        graduation_status: String,
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
        enrollment_types: [EnrollmentStatus]
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
        is_resident: Boolean,
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
        students(campus: String, intake: String, acc_yr: String, course_version: String, sic: Boolean, search_creteria: String, search_value: String): [Student]!
        student_autocomplete(query: String!): [Student]!
        loadStudentFile(student_id: String, student_no: String): Student
        my_details: Student
        my_results: Student
        # currentEnrollmentInfo(student_id: String, student_no: String, intake_id: String!): [StudentEnrollment]
    }

    type Mutation {
        saveNewStudent(payload: newStdInput): ResponseMessage
        uploadStudents(payload: [uploadStdInput]!): ResponseMessage
        uploadStudentsV2(payload: [uploadStdV2]!): ResponseMessage
        saveStudentData(payload: saveStdInput): ResponseMessage
        studentPortalLogin(user_id: String!, password: String!): Token
        changeStdPwd(password: String!): ResponseMessage
        saveStdCredentials(email: String!, phone_no: String!): ResponseMessage
        studentSemesterEnrollment(payload: studentSemEnrollmentInput!): ResponseMessage
        saveStudentDetails(payload: studentDetailsInput!): Response
    }

    input studentDetailsInput {
        std_id: String!
        student_no: String!,
        registration_no: String!,
        course_id: String!,
        intake_id: String!,
        study_time_id: String!,
        campus_id: String!,
        is_resident: Boolean,
        hall_of_residence: String
    }

    input studentSemEnrollmentInput {
        acc_yr_id: String!,
        study_yr: String!,
        sem: String!,
        enrollment_status_id: String,
    }

    input saveStdInput {
        student_no: String!,
        applicant_id: String!,
        reg_no: String,
        surname: String,
        other_names: String,
        gender: String,
        district: String,
        email: String,
        phone_no: String,
        entry_acc_yr: String,
        entry_study_yr: Int,
        nationality: String,
        sponsorship: Int,
        guardian_name: String,
        guardian_contact: String,
        billing_nationality: String,
        hall_of_attachment: String,
        hall_of_residence: String,
        course_id: String,
        course_version_id: String,
        intake_id: String,
        campus_id: String,
        study_yr: Int,
        current_sem: Int,
        residence_status: Int,
        study_time_id: String,
        completed: Int,
    }

    input newStdInput {
        student_no: String!,
        reg_no: String!,
        surname: String!,
        other_names: String!,
        gender: String!,
        district: String,
        email: String,
        phone_no: String,
        entry_acc_yr: String,
        entry_study_yr: Int!,
        nationality: String!,
        sponsorship: Int,
        guardian_name: String,
        guardian_contact: String,
        billing_nationality: String!,
        hall_of_attachment: String,
        hall_of_residence: String,
        course_id: String!,
        course_version_id: String!,
        intake_id: String!,
        campus_id: String!,
        study_yr: Int!,
        current_sem: Int!,
        residence_status: Int!,
        study_time_id: String!,
        completed: Int,
    }

    input uploadStdInput { 
        accesscode: String,
        name: String!,
        accyr: String!,
        billing_nationality: String!,
        campus: String!,
        college: String,
        collegetitle: String!,
        email: String,
        enrollment_date: String!,
        enrollment_status: String!,
        enrollment_token: String!,
        entry_ac_yr: String!,
        functional_amount: String,
        functional_balance_due: String,
        functional_credit: String,
        functional_invoice_no: String,
        functional_paid: String,
        hall_of_attachment: String,
        hall_of_residence: String,
        facultycode: String,
        facultytitle: String,
        intake: String!,
        nationality: String!,
        prog_alias: String!,
        progcode: String!,
        programlevel: String,
        progtitle: String,
        provisional: String,
        reg_status: String!,
        registered: String!,
        registration_date: String,
        registration_token: String,
        regno: String,
        residence_status: String,
        sem: String,
        sex: String,
        sponsorship: String,
        stdno: String,
        study_time: String,
        study_yr: String,
        telno: String,
        total_bill: String,
        total_credit: String,
        total_due: String,
        total_paid: String,
        tuition_amount: String,
        tuition_balance_due: String,
        tuition_credit: String,
        tuition_invoice_no: String,
        tuition_paid: String,
        card_printed: String,
        discount_codes: String,
    }

    input uploadStdV2 {
        religion: String,
        stdno: String,
        sdate: String,
        admitted_date: String,
        joined_date: String,
        admissions_form_no: String,
        regno: String,
        surname: String,
        other_names: String,
        sex: String,
        email: String,
        telno: String,
        entry_ac_yr: String,
        entry_study_yr: String,
        nationality: String,
        billing_nationality: String,
        home_district: String,
        progcode: String,
        prog_alias: String,
        progversion: String,
        intake: String,
        campus: String,
        study_yr: String,
        current_sem: String,
        std_status: String,
        study_time: String,
        sponsorship: String,
        sponsorship_category: String,
        grading_id: String,
        residence_status: String,
        archived: String,
        completed: String,
        dob_sdate: String,         
    }
`;

export default studentTypeDefs;
