export const typeDefs = `#graphql
    type AccYr {
        acc_yr_id: ID!,
        acc_yr_name: String!,
        created_by: String!,
        created_on: String!
    }

    type SchemeCategory {
        scheme_category_id: ID!,
        scheme_name: String!
    }

    type Intake {
        id: ID!,
        intake_name: String!,
    }

    type AdmissionCategory {
        id: ID!,
        category_name: String!
    }

    type Scheme {
        id: ID!,
        scheme_category: SchemeCategory!,
        acc_yr: String!,
        intake: Intake!,
        admission_category: AdmissionCategory!,
        start_date: String!,
        end_date: String!
    }

    type Program {
        id: ID!,
        course_code: String!,
        program: String!,
        studentcount: Int!
        school_id: String! #to be implemented later 
    }

    type Campus {
        cam_id: ID!,
        campus_name: String!
    }

    type ApplicantBiodata {
        id: ID!,
        applicant_id: String!,
        surname: String!,
        other_names: String!,
        email: String!,
        phone_no: String!,
        scheme_id: String!,
        form_no: String!,
        salutation: String!,
        DOB: String!,
        district_of_birth: String!,
        religion: String!,
        gender: String!,
        marital_status: String!,
        nationality: String!,
        nin_no: String!,
        passport_no: String!,
        district_of_residence: String!,
        form_status: String!,
        created_on: String!
    }

    type Qualification {
        id: ID!,
        applicant_id: String!,
        scheme_id: String!,
        institute_name: String!,
        award_obtained: String!,
        award_type: String!,
        award_duration: String!,
        award_body: String!,
        grade: String!,
        start_date: String!,
        end_date: String!,
        attachment: String!,
        section_status: String!
    }

    type Subject {
        id: ID!,
        subject_code: String!,
        subject_name: String!
    }

    type OlevelResult {
        id: ID!,
        applicant_olevel_info_id: Int!,
        subject: Subject!,
        grade: String!
    }

    type AlevelResult {
        id: ID!,
        applicant_alevel_info_id: Int!,
        subject: Subject!,
        grade: String!
    }

    type OlevelInfo {
        id: ID!,
        applicant_id: String!,
        scheme_id: String!,
        school_name: String!,
        index_no: String!,
        yr_of_sitting: String!,
        total_distinctions: String!,
        total_credits: String!,
        total_passes: String!,
        section_status: String!,
        olevel_results: [OlevelResult]!
    }

    type AlevelInfo {
        id: ID!,
        applicant_id: String!,
        scheme_id: String!,
        school_name: String!,
        index_no: String!,
        yr_of_sitting: String!,
        points_obtained: Int!,
        section_status: String!,
        alevel_results: [AlevelResult]!
    }

    type Referee {
        id: ID!,
        applicant_id: String!,
        scheme_id: String!,
        ref_name: String!,
        ref_address: String!,
        ref_email: String!,
        ref_phone_no: String!,
        section_status: Int!
    }

    type MedicalHistory {
        id: ID!,
        applicant_id: String!,
        scheme_id: String!,
        blood_type: String!,
        disability: String!,
        illness: String!,
        emergency_contact: String!,
        section_status: Int!
    }

    type NextOfKin {
        id: ID!,
        applicant_id: String!,
        scheme_id: String!,
        name: String!,
        address: String!,
        relation: String!,
        contact: String!,
        email: String!,
        section_status: Int
    }

    type Payment {
        id: ID!,
        applicant_id: String!,
        scheme_id: String!,
        payment_ref: String!,
        amount: String!,
        date: String!,
        section_status: Int!       
    }

    type StudyTime {
        id: ID!,
        study_time_name: String!
    }

    type ProgramChoice {
        id: ID!,
        applicant_id: String!,
        scheme_id: String!,
        program: Program!,
        campus: Campus!,
        study_time: StudyTime!,
        entry_yr: String!,
        section_status: String!
        choice: String!
    }

    type ApplicantForm {
        id: ID!,
        applicant_id: String!,
        surname: String!,
        other_names: String!,
        email: String!,
        phone_no: String!,
        scheme_id: String!,
        scheme: Scheme!,
        form_no: String!,
        salutation: String!,
        DOB: String!,
        district_of_birth: String!,
        religion: String!,
        gender: String!,
        marital_status: String!,
        nationality: String!,
        nin_no: String!,
        passport_no: String!,
        district_of_residence: String!,
        form_status: String!,
        created_on: String!
        prog_choices: [ProgramChoice]!,
        other_qualifications: [Qualification]!,
        olevel_info: OlevelInfo!,
        alevel_info: AlevelInfo!,
        referees: [Referee]!,
        medical_history: MedicalHistory,
        next_of_kin: NextOfKin,
        payments: [Payment]!,
        sent_for_marks: Int!
        application_sent_details: ApplicationSent
        pre_admission_marks: [PostGradPreAdmissionMarks]!
        admitted: String!
    }

    type Student {
        stdno: String!,
        surname: String!,
        other_names: String!,
        form_no: String!,
        gender: String!,
        phone_no: String!,
        email: String!,
        entry_acc_yr: String!
        nationality: String!,
        facultycode: String!,
        progtitle: String!,
        progcode: String!,
        progduration: String!,
        facultytitle: String,
        intake: String!,
        campus: String!,
        # sponsorship: String!,
        # residence_status: String!,
        current_sem: String!,
        study_yr: String!,
        study_time: String!,
        collegetitle: String!,
    }


    type PhDStudent {
        stdno: String!,
        surname: String!,
        other_names: String!,
        form_no: String!,
        gender: String!,
        phone_no: String!,
        email: String!,
        entry_acc_yr: String!
        nationality: String!,
        facultycode: String!,
        facultytitle: String,
        progtitle: String!,
        progcode: String!,
        progduration: String!,
        intake: String!,
        campus: String!,
        # current_sem: String!,
        study_yr: String!,
        study_time: String!,
        collegetitle: String!,
    }

    type ApplicationSent {
        program: Program!,
        completed: String!,
        date_sent: String!,
        sent_by: String!
    }

    type PostGradPreAdmissionMarks {
        id: ID!,
        pre_entry_exam_marks: String!,
        concept_exam_marks: String!,
        passed: Int!,
        added_by: String!,
        add_on: String!
    }

    # staff type is missing field -> email 
    type Staff {
        id: ID!,
        staff_id: String!,
        title: String!,
        staff_name: String!,
        role: String!,
        email: String
    }

    type Module {
        id: ID!,
        title: String!,
        route: String!,
        logo: String!
    }

    type UserRole {
        id: ID!,
        role_name: String!
        modules: String!
        _modules: [Module]
        permissions: String!
    }

    type SystemModules {
        id: ID!,
        module_name: String!,
        module_icon: String!,
        module_url: String!
    }

    type UserLogin {
        id: ID!,
        user_id: String!,
        logged_in: String!,
        logged_out: String,
        machine_ipaddress: String!
    }

    type User {
        id: ID!,
        user_id: String!,
        biodata: Staff!,
        email: String!,
        pwd: String!,
        last_logged_in: [UserLogin],
        created_on: String,
        created_by: String,
        updated_on: String,
        updated_by: String,
        sys_gen_pwd: Int!,
        has_set_sec_qns: Int!
        role: UserRole
        # modules: [Module]!
    }

    type ProgramAndCourse {
        id: ID!,
        code: String!,
        name: String!,
        created_by: String!,
        created_on: String!,
        modified_on: String!,
        type: String,
        contents: Int,
        description: String,
        parent_id: String,
    }

    type CourseUnit {
        id: ID!,
        program_version_id: String!,
        module_code: String!,
        module_name: String!,
        module_level: String!,
        study_yr: String!,
        sem: String!,
        created_by: String!,
        created_on: String!,
        modified_on: String!,
        status: String,
    }

    type ScheduledCourseUnit {
        timetable_id: ID!,
        session: String!,
        courseunit_name: String!,
        lecturer: Staff,
        active_session_id: Int!
    }

    type SecurityQuestion {
        id: ID!
        qn: String!,
        ans: String!
    }

    type UserSecurityQuestions {
        id: ID!,
        user_id: Int!,
        questions: [SecurityQuestion]
    }


    type SuccessMessage {
        message: String!
    }

    type Query {
        acc_yrs: [AccYr]
        schemes: [SchemeCategory]
        intakes: [Intake]
        scheme(acc_yr: String!, intake_id: String, scheme_category_id: String): Scheme
        program_choices(acc_yr: String!, intake_id: String, scheme_category_id: String): [ProgramChoice]
        # applicant_bio_data(applicant_id: String!, scheme_id: String!): ApplicantBiodata
        # other_qualifications(applicant_id: String!, scheme_id: String!): [Qualification]
        applicant_forms(scheme_id: String!, program_id: String!): [ApplicantForm]
        admissible_phd_applicants(acc_yr: String!, intake_id: String!): [ApplicantForm]
        staff_autocomplete(staff_name: String!): [Staff]
        staff_members: [Staff]
        user_roles: [UserRole]
        roles: [UserRole]
        users: [User]
        programs_and_courses(parent_id: ID): [ProgramAndCourse]
        lecturer_course_units(lecturer_id: ID!): [ScheduledCourseUnit]
        questions: [SecurityQuestion]
        modules: [Module]
    }

    type Mutation {
        addUser(user_id: String!, role_id: String!, email: String!, created_by: String!):  User
        login(email: String!, pwd: String!): User
        change_password(password: String!, id: ID!): User
        save_user_sec_qns(id: Int!, qns: String!): User
        save_sent_phd_stds(stds: [PostGradInput]!, sent_by: String!): SuccessMessage
        admit_students(stds: [PostGradInput]!, admitted_by: String!): SuccessMessage
        add_program_and_course(
        code: String!,
        name: String!
        created_by: Int!,
        type: String!,
        description: String,
        parent_id: Int
        ): [ProgramAndCourse]
       saveRolePermissions(role_id: ID!,  modules: String!): [UserRole]
    }


    input PostGradInput {
        schemeId: String!,
        applicantId: String!
        program_id: String!
    }

    input ProgramCourseInput {
        code: String!,
        name: String!
        created_by: Int!,
        type: String!,
        description: String,
        parent_id: Int

    }

`;
