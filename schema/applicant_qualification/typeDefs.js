const applicantQualificationTypeDefs = `#graphql

    type ApplicantQualification {
        id: ID!,
        applicant_id: String!,
        form_no: String!,
        admissions_id: String!, # running_admissions_id
        institute_name: String,
        award_obtained: String,
        award_type: String,
        award_duration: String,
        grade: String,
        awarding_body: String,
        start_date: String,
        end_date: String,
    }

    type Query {
        qualifications: [ApplicantQualification]
    }

    type Mutation {
        saveQualifications(
            has_other_qualifications: Boolean!,
            qualifications: [QualificationInput],
            form_no: String,
            admissions_id: String!,
            remove_ids: [String]!
        ): ApplicationResponse
    }

    input QualificationInput {
        id: ID,
        institute_name: String!,
        award_obtained: String!,
        award_type: String!,
        award_duration: String!,
        grade: String!,
        awarding_body: String!,
        start_date: String!,
        end_date: String!,
    }
`;

export default applicantQualificationTypeDefs;
