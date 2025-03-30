const applicationTypeDefs = `#graphql
    # staff type is missing field -> email 
    type Application {
        id: ID!,
        applicant_id: String!,
        form_no: String!,
        admissions_id: String!, # running_admissions_id
        creation_date: String!,
        status: String!,
        is_verified: String!,
        is_completed: Boolean,
        is_paid: String!,
        std_id: String, # only received after admission
        is_admitted: Boolean,
        admitted_by: String,
        admitted_by_user: String,
        has_other_qualifications: Boolean,
        has_chosen_courses: Boolean
        has_attachments: Boolean,
        completed_section_ids: String,
        running_admissions: RunningAdmission
        applicant: Applicant,
        program_choices: [ProgramChoice],
        olevel_info: UnebResultsSummary,
        alevel_info: UnebResultsSummary,
        other_qualifications: [ApplicantQualification],
        attachments: [ApplicationAttachment],
        next_of_kin: NextOfKin,
        application_fee: String,
        qualifications_section_complete: Boolean
        attachments_section_complete: Boolean
        nok_section_complete: Boolean
        submission_date: String
        admitted_choice: Int
    }

    type ApplicationResponse {
        success: Boolean
        message: String
        result: Application
    }

    type UploadProgress {
    progress: Int!
  }

   type Applications {
        total_records: Int,
        applications: [Application]
    }

    type AdmittedStudents {
        total_records: Int,
        students: [Student]
    }

    type Query {
        applications(applicant_id: String, admissions_id: String, course_id: String, campus_id: String, is_completed: Boolean, start: Int!, limit: Int!,): Applications
        application(admissions_id: String, applicant_id: String!, form_no: String): Application
        admitted_students_summary(acc_yr_id: String!, scheme_id: String!, intake_id: String!, school_id: String!): [ApplicantSammary]!
        admitted_students(applicant_id: String, admissions_id: String, course_id: String, campus_id: String,  start: Int!, limit: Int!): AdmittedStudents
        my_applications(admitted: Boolean): [Application]
        application_details(running_admissions_id: String, form_no: String): Application
        global_search_applications(search_criteria: String!, search_value: String!, admissions_id: String, admitted: String,start: Int!, limit: Int!): AdmittedStudents
    }

    type Mutation {
        admit_students(applicants: [AdmissionInput]!): ResponseMessage  
        push_to_std_info_center(std_ids: [String]!, pushed_by: String!): ResponseMessage  
        submitApplication(admissions_id: String!, form_no: String!): ApplicationResponse
    }

    

    type Subscription {
        uploadProgress: UploadProgress!
    }

    input AdmissionInput {
        application_id: String!
        applicant_id: String!,
        course_id: String!,
        campus_id: String!,
        study_time_id: String!,
        entry_yr: String!
    }

`;

export default applicationTypeDefs;
