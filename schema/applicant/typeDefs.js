const applicantTypeDefs = `#graphql

    type Applicant {
        id: ID!,
        salutation_id: String!,
        salutation: String,
        surname: String!,
        other_names: String!,
        email: String!,
        phone_no: String!,
        nationality_id: String!,
        date_of_birth: String!,
        gender: String!,
        is_verified: Int!,
        has_pwd: Int!,
        created_at: String!,
        updated_at: String,
        nationality: Nationality,
        district_of_birth: String!,
        district_of_origin: String!,
        religion: String!,
        marital_status: String!,
        nin: String,
        place_of_residence: String!,
        permanent_district: String!,
        permanent_subcounty: String!,
        permanent_state: String!,
        is_complete: String!  # this is to check if the applicant has fully filled the required details
    }

    # This is to sammarise the total applicants based on their first choice
    type ApplicantSammary {
        admissions_id: String!,
        course_code: String!,
        course_id: String!,
        campus_id: String!
        campus_title: String!,
        course_title: String,
        student_count: Int!,
    }

    type Query {
        applicant: Applicant
        applicantsSammary(acc_yr_id: String!, scheme_id: String!, intake_id: String!): [ApplicantSammary]!
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

export default applicantTypeDefs;
