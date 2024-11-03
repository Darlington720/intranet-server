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
        is_completed: String!,
        is_paid: String!,
        std_id: String, # only received after admission
        is_admitted: Int!,
        admitted_by: String!,
        has_other_qualifications: Int,
        has_attachments: Int,
        completed_section_ids: String!,
        running_admissions: RunningAdmission
        applicant: Applicant,
        program_choices: [ProgramChoice],
        olevel_info: UnebResultsSummary,
        alevel_info: UnebResultsSummary,
        other_qualifications: [ApplicantQualification],
        attachments: [ApplicationAttachment],
        next_of_kin: NextOfKin,
        application_fee: String
    }


    type Query {
        applications(applicant_id: String, admissions_id: String, course_id: String, campus_id: String): [Application]
        application(admissions_id: String, applicant_id: String!, form_no: String): Application
        admitted_students_summary(acc_yr_id: String!, scheme_id: String!, intake_id: String!): [ApplicantSammary]!
        admitted_students(applicant_id: String, admissions_id: String, course_id: String, campus_id: String): [Student]
    }

    type Mutation {
        admit_students(applicants: [AdmissionInput]!, admitted_by: String!): ResponseMessage  
        push_to_std_info_center(std_ids: [String]!, pushed_by: String!): ResponseMessage  
    }

    input AdmissionInput {
        application_id: String!,
        prog_choice_id: String!,
        std_id: String
    }

`;

export default applicationTypeDefs;
