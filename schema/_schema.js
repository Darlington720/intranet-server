export const typeDefs = `#graphql

    type SemInitiation {
        id: ID!,
        acc_yr: String!,
        name: String!,
        open_date: String!,
        close_date: String!,
        created_by: String!,
        created_on: String!,
        last_modified_by: String!,
        last_modified_on: String!
    }

    type University {
        id: ID!,
        university_title: String!
    }

    type Campus {
        id: ID!,
        campus_title: String!,
        added_by: String!,
        added_on: String!,
        modified_by: String!,
        modified_on: String!,
    }
    
    type College {
        id: ID!,
        college_title: String!,
        schools: [School]! # to be implemented
    }

    type School {
        id: ID!,
        code: String!,
        title: String!,
        # school_id: String!, # added
        added_by: String!,
        added_on: String!,
        modified_by: String!,
        modified_on: String!,
        departments: [Department]!
    }

    type Department {
        id: ID!,
        school_id: String!,
        dpt_code: String!,
        dpt_title: String!,
        added_by: String!,
        added_on: String!,
        modified_by: String!,
        modified_on: String!,
        school: School,
        college_id: String!,
        programmes: [Programme]!
    }
    
    type ProgrammeLevel {
        id: ID!,
        name: String!
    }

    type Award {
        id: ID!,
        name: String!
    }

    type Programme {
        id: ID!,
        dpt_id: String!,
        prog_code: String!,
        prog_title: String!,
        prog_level: String!,
        award: String!,
        prog_duration: Int
        department: Department!,
        prog_versions: [ProgrammeVersion]!
    }

    type ProgrammeVersion {
        id: ID!,
        prog_id: String!,
        prog_version_title: String!,
        programme: Programme!,
        modules: [Module]!
    }

    type Module {
        id: ID!,
        prog_version_id: String!,
        module_code: String!,
        module_title: String!,
        credit_units: Int!,
        module_level: String!,
        module_year: Int!, # will depend on prog_duration
        module_sem: Int!,
        grading_id: String!,
        pass_mark: Int!,
        grading_system: GradingSystem!
    }

    type GradingSystem {
        id: ID!,
        name: String!,
        grading: [GradingSystemDetails]
    }

    type GradingSystemDetails {
        id: ID!,
        grading_system_id: String!,
        min_value: Int!,
        max_value: Int!,
        grade_point: Int!,
        grade_letter: String!,
    }

    type Intake {
        id: ID!,
        title: String!
    }

    type AccYr {
        id: ID!,
        title: String!
    }

    type Semester {
        id: ID!,
        title: String!
    }

    type Scheme {
        id: ID!,
        name: String!,
        description: String!,
        created_by: String!, # Cater about the actual user later
        created_on: String!,
        modified_by: String!, # Cater about the actual user later
        modified_on: String!,
        admission_fees: [AdmissionFee]!
        admission_letters: [AdmissionLetter]! 
    }

    type AdmissionFee {
        id: ID!,
        fee_name: String!
        amount: String!
    }

    type AdmissionLetter {
        id: ID!,
        name: String!,
        scheme_id: String!,
        template: String!,
        created_on: String!,
        created_by: String!,
        modified_on: String!,
        modified_by: String!
    }

    type Applicant {
        applicant_id: ID!,
        salutation: String!,
        surname: String!,
        othernames: String!,
        email: String!,
        phone_no: String!,
        dob: String!,
        district_of_birth: String!,
        religion: String!,
        gender: String!,
        marital_status: String!,
        nationality: String!,
        nin: String!,
        district_of_residence: String!,
        applications: [Application]!
    }

    type ApplicantProgrammeChoice {
        id: ID!,
        applicant_id: String!,
        choice_no: String!,
        campus_id: String!,
        programme_id: String!,
        study_time_id: String!,
        entry_acc_yr: String!,
        applications: [Application]!
    }

    type Application {
        id: ID!,
        applicant_id: String!,
        form_no: String!,
        admisson_id: String!,
        date: String!,
        status: String!,
        is_verified: Int!,
        is_completed: Int!,
        is_paid: Int!,
        olevel_info: String!, # serialised
        alevel_info: String!, # serialised
        referees: String!, # serialised
        medical_history: String!, # serialised
        next_of_kin: String!, # serialised
        attachments: String!, # serialised
        applicant: Applicant!,
        application_payments: [ApplicationPayment]
        programme_choices: [ApplicantProgrammeChoice]
    }

    type ApplicationPayment {
        id: ID!,
        application_id: String!,
        payment_date: String!,
        bank: String!,
        amount: String!,
        branch: String!,
        ref_no: String!,
        payment_status: String!
    }

    type PaymentMethod {
        id: ID!,
        name: String!
    }

    type Bank {
        id: ID!,
        name: String!
    }

    type Religion {
        id: ID!,
        name: String!
    }

    type MaritalStatus {
        id: ID!,
        name: String!
    }

    type Nationality {
        id: ID!,
        name: String!,
        std_category_id: String!,
        student_category: StudentCategory!
    }

    type District {
        id: ID!,
        name: String!
    }

    type StudyTime {
        id: ID!,
        study_time_name: String!
    }

    type EnrollmentStatus {
        id: ID!,
        title: String!,
        description: String!
    }

    type Student {
        id: ID!,
        stdno: String!,
        regno: String!,
        prog_version_id: String!,
        fees_structure_version_id: String!,
        biodata: Applicant!,
        intake: String!,
        prog_code: String!,
        prog_title: String!,
        prog_duration: Int,
        prog_level: String!,
        campus: String!,
        study_time: String!,
        entry_acc_yr: String!,
        form_no: String!,
        is_verified: String!,
        status: String!,
        admitted_by: String!,
        admitted_on: String!,
        dpt_code: String!,
        dpt_title: String!,
        school_code: String!,
        school_title: String!,
        college: String!,
        programme_version: ProgrammeVersion!,
        residence_status: String!,
        account_balance: String!, # based on the deposit transactions
        fees_structure_version: FeesStructureVersion!, # This is assigned on admission 
        #  "hall_of_attachment": null,
        enrollment_and_reg_details: CurrentStudentEnrollmentAndRegStatus!,
        enrollment_track: [StudentEnrollment]!,
        #registration
    }

    # this is to track the students current year and current semester based on the enrollment track along with his/her enrollment status
    type CurrentStudentEnrollmentAndRegStatus {
        enrollment_id: String!,
        current_year: String!,
        current_sem: String!,
        enrollment_status: String!,
        registration_status: String!
    }

    type StudentEnrollment {
        enrollment_id: ID!,
        stdno: String!,
        acc_yr: String!,
        study_yr: String!,
        sem: String!,
        enrollment_status_id: String!,
        date: String!,
        datetime: String!,
        enrolled_by: String!,
        sem_init_id: String!,
        invoices: [StudentInvoice]! # after enrollment, the std is invoiced based on the enrollment_id/token
    }

    # Students register for courseunits/modules.
    type StudentRegistration {
        registration_id: ID!,
        enrollment_id: String!,
        stdno: String!,
        date: String!,
        datetime: String!,
        registered_by: String!,
        sem_init_id: String!,
        registered_modules: [StudentRegisteredModule]!
    }

    type StudentRegisteredModule {
        id: ID!,
        registration_id: String!, # the module is tied to the registration id of the student
        module_id: String!,
        registered_as: String!, # this can either be normal, retake, missed paper
        sem_init_id: String!,
        module: Module!
    }

    # normal paper, retake, missed etc
    type ExamRegistrationStatus {
        id: ID!,
        name: String!
    }

    type StudentInvoice {
        id: ID!,
        enrollment_id: String!,
        stdno: String! # 
        invoice_no: String!, # this uniquely identifies each invoice ie tuition -> T-BSCS000W8E1 etc, it show partly reflect or decribe the invoice
        narration: String!,
        currency_code: String!,
        study_yr: String!,
        sem: String!,
        date: String!,
        category_id: String!, # This is to know the category that the invoice falls in eg Tuition, Functional, Retake etc
        is_mandatory: Int! # This is to get the mandatory invoices ie tuition and functional, the others eg retakes are not mandatory
        status: String! # can be pending, paid, partially paid
        invoice_amount: String!,
        invoice_comments: String!,
        amount_paid: String!,
        amount_due: String!,
        yr_sem: String!,
        # exemption_amount: String!,
        # exempted_percentage: String!,
        # exemption_comments: String!,
        # exemption_date: String!,
        # exempted_b
        # credit_note: String!,
        items: [FeesItem] # These are the list of items based of the fees_category
        transactions: [StudentTransaction]! # based on invoice_no
        # credit_units: [CreditUnit]!
        # exemptions: [Exemption]!

    }

    type PaymentReference {
        id: ID!,
        expiry_date: String!,
        is_used: Int!, # 0 for false, 1 for true
        ref_status: String!, # PENDING, CONFIRMED, REJECTED
        stdno: String!,
        generated_by: String!, 
        ref_no: String!,
        amount: String!,
        creation_date: String!,
        datetime: String!,
        invoice_no: String! # can include the allocation or pp for prepayment (deposit)
    }

    # This is generated after after actual payment of the fees
    type StudentTransaction {
        transaction_id: ID!,
        date: String!,
        datetime: String!,
        ref_no: String!,
        stdno: String!,
        invoice_no: String!
        bank: String!,
        branch: String!,
        amount:  String!,
        posted_by: String!,
    }

    type StudentDeposit {
        id: ID!,
        date: String!,
        datetime: String!,
        ref_no: String!,
        stdno: String!,
        bank: String!,
        branch: String!,
        amount:  String!,
        posted_by: String!,
        invoice_no: String!, # this is for allocation of money to various pending invoices, the result is stored as a transaction
        remaining_amount: String!,
    }

   
    type FeesCategory {
        id: ID!,
        category_name: String! # eg functional, tuition, retake etc
    }

    # New tables start here
    type StudentCategory {
        id: ID!,
        name: String! # eg Local, International, PHD, all
    }

    type FeesStructureVersion {
        id: ID!,
        version_name: String!,
    }

    # This is to be used to formulate the entire fees structure of the student
    # type FeesFrequencyCode {
    #     id: ID!,
    #     name: String!,
    #     description: String!,
    #     regex: String!
    # }

    type FeesItem {
        id: ID!,
        item_code: String!,
        item_name: String!,
        currency: String!,
        category_id: String!,
        category: FeesCategory!
    }

    # # Now, we need to have fees assigning categories (criteria)
    # type FeesAssigmentCategory {
    #     id: ID!,
    #     std_category_id: String!,
    #     study_time_id: String!,
    #     school_id: String!,
    #     prog_level: String!,
    #     version_id: String!,
    #     fees: [Fee]! # this are all the fees in the particular category
    # }

    type Fee {
        id: ID!,
        fee_item_id: String!,
        school_id: String!, # can be NULL if the fee applies universally across all schools.
        level_id: String!, # (e.g., BACHELORS, CERT). This can be NULL if the fee applies to all levels.
        course_id: String!, # can be NULL if the fee applies to all courses.
        student_category_id: String! # (e.g., Local, international). This can be NULL if the fee applies to all categories.
        study_time_id: String!, # (e.g., day, weekend). This can be NULL if the fee applies to all study times.
        amount: String!, 
        fees_freq_id: String!,
        version_id: String!, # for the fees structure version
        item: FeesItem!,
        paid_when: String!, # How often is the fee paid
        is_mandatory: Int! # This is to get the mandatory invoices ie tuition and functional, the others eg retakes are not mandatory
    }

    # these are fees that are not mandatory, but they are paid eg retakes, missed papers, annual reports
    # type OtherFee {
    #     id: ID!,
    #     fee_item_id: String!,
    #     amount: String!,
    #     item: FeesItem!
    # }


    type StudentResult {
        id: ID!,
        stdno: String!,
        module_id: String!,
        cw_mark: Int!,
        final_exam_mark: Int!,
        final_mark: Int!,
        remark: String!,
        is_published: String!,
        is_audited_result: String!,
        is_retaken: String!,
        sem_init_id: String!,
        acc_yr: String!, # will be picked from enrollment, implying that no student will receive marks without enrolling
        study_yr: String!, # will be picked from enrollment
        sem: String!, # will be picked from enrollment
        yr_sem: String!,
        module: [Module]!
    }

   type ActivityLogs {
    id: ID!,
    created_at: String!,
    created_by: String!,
    action: String!, 
    payload: String!,
    machine_ipaddress: String!
   }
    

    type Query {
        university: [University]
    }

`;
