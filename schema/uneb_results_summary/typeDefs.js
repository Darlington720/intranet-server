const unebResultsSummaryTypeDefs = `#graphql

    type UnebResultsSummary {
        id: ID!,
        did_exams: Int!,
        applicant_id: String!,
        form_no: String!,
        admissions_id: String!, # running_admissions_id
        school_id: String,
        index_no: String,
        year_of_sitting: String,
        total_distinctions: Int,
        total_credits: Int,
        total_passes: Int,
        uneb_study_level_id: String!,
        school: UnebCentre
        uneb_results: [UnebResult],
        completed: Boolean
    }

    type UnebResult {
        id: ID!,
        uneb_results_summary_id: String!,
        subject_code: String!,
        grade: String!
        subject: UnebSubject
    }

    type Query {
        uneb_results_summary: [UnebResultsSummary]
    }

    type Mutation {
        saveUnebResults(
            did_exams: Boolean!,
            school_id: String,
            index_no: String,
            year_of_sitting: String,
            total_distinctions: Int,
            total_credits: Int,
            total_passes: Int,
            uneb_study_level_id: String!,
            form_no: String,
            admissions_id: String!,
            uneb_results: [UnebResultInput]!,
            remove_ids: [String]!
        ): ApplicationResponse
    }


    input UnebResultInput {
        subject_code: String!,
        grade: String!
    }
`;

export default unebResultsSummaryTypeDefs;
