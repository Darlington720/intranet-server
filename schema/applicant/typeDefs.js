const applicantTypeDefs = `#graphql

    type Applicant {
        id: ID!,
        salutation_id: String,
        salutation: String,
        surname: String!,
        other_names: String!,
        email: String,
        phone_no: String,
        nationality_id: String!,
        date_of_birth: String,
        gender: String!,
        is_verified: Int!,
        has_pwd: Int!,
        created_at: String!,
        updated_at: String,
        nationality: Nationality,
        district_of_birth: String,
        district_of_origin: String,
        religion: String,
        marital_status: String,
        nin: String,
        place_of_residence: String,
        permanent_district: String,
        permanent_subcounty: String,
        permanent_state: String!,
        verified_credentials: Boolean,
        credentials_verified_on: String,
        credentials_verified_by: String,
        is_complete: Boolean  # this is to check if the applicant has fully filled the required details
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
        applicantProfile: Applicant
        applicantsSammary(acc_yr_id: String!, scheme_id: String!, intake_id: String!, completed: Boolean, school_id: String!): [ApplicantSammary]!
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
        ): Token
        verifyOTP(otp_code: String!): ResponseMessage
        resendOTP: ResponseMessage
        setApplicantPassword(password: String!): ResponseMessage
        applicantLogin(user_id: String!, password: String!): Token
        changeApplicantPassword(old_password: String!, new_password: String!): ResponseMessage
        saveApplicantBioData(payload: ApplicantBioDataInput): ApplicationResponse
        uploadApplicants(payload: ApplicantInput!): Response
    }

    type Subscription {
        uploadApplicantsProgress: UploadProgress!
    }

    input ApplicantInput {
        admission_details: schemeInput!,
        applicants: [importApplicantInput]!
    }

    input schemeInput {
        acc_yr_id: String!,
        scheme_id: String!,
        intake_id: String!
    }

    input importApplicantInput {
        surname: String!,
        other_names: String!,
        gender: String!,
        entry_study_yr: String!,
        study_time: String!,
        campus: String!,
        nationality: String!,
        progcode: String!,
        sponsorship: String!,
        email: String,
        telno: String,
        dob: String,
        district: String,
        choice_2: String,
        oq_award: String,
        oq_institution: String,
        oq_awarding_body: String,
        oq_duration: String,
        oq_class: String,
        oq_grade: String,
        oq_start_date: String,
        oq_end_date: String
    }

    input ApplicantBioDataInput {
        application_id: ID,
        form_no: String,
        admissions_id: String!,
        salutation: String!,
        district_of_birth: String!,
        district_of_origin: String!,
        religion: String!,
        marital_status: String!,
        nin: String,
        place_of_residence: String!,
        completed_form_sections: String
    }
`;

export default applicantTypeDefs;
