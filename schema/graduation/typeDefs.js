const graduationSectionTypeDefs = `#graphql

    type GraduationSection {
        id: ID!,
        title: String!,
        for_residents: Boolean,
        instructions: String,
        level_id: String,
        requires_attachments: Boolean,
        sort: Int,
        logs: [ClearanceLog]
    }

    type ClearanceLog {
        id: ID!,
        student_no: String,
        section_id: String,
        status: String,
        date: String,
        acc_yr_id: String!,
        acc_yr_title: String!,
        cleared_by: String,
        created_on: String!,
        rejection_logs: [RejectionLog]
        student_details: Student
    }

    type RejectionLog {
        id: ID!,
        clearance_id: String,
        reject_reason: String,
        rejected_at: String,
        rejected_by: String
        rejected_by_user: String
    }

    type Elligibity {
        is_elligible: Boolean
        has_retakes: Boolean
    }

    type FacultyStatistic {
        school_code: String,
        total_students: Int
    }

    type GraduationData {
        total_eligible_students: Int!,
        total_cleared_students: Int!,
        faculty_breakdown: [FacultyStatistic]
        # pending_approvals: ,
    }

    type StudentGraduationSection {
        graduation_details: GraduationSession!
        graduation_sections: [GraduationSection]
    }

 

    type Query {
        graduation_sections: StudentGraduationSection
        check_graduation_elligibility: Elligibity
        load_graduation_data: GraduationData
        getGraduationStudents: [Student]
        library_clearance_students: [ClearanceLog]
    }


    type Mutation {
        verify_student_credentials(payload: CredentialsPayload): Response
        clearStudentForGraduation(payload: ClearancePayload): Response
    }
    
    input ClearancePayload {
        clearance_id: ID! # This belongs to the clearance module, can be library, or exams etc
        status: String! # rejected, cleared...
        reason: String,
        student_no: String!,
    }

    input CredentialsPayload {
        surname: String!,
        othernames: String!,
        email: String!,
        phone_no: String!,
        place_of_residence: String!,
        date_of_birth: String!,
        gender: String!,
        country_of_origin: String!,
        nationality: String!,
        acc_yr_id: String!
    }

`;

export default graduationSectionTypeDefs;
