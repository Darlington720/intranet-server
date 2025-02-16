const ProgramChoiceTypeDefs = `#graphql


    # type Program {
    #     id: ID!,
    #     course_code: String!,
    #     program: String!,
    #     studentcount: Int!
    #     school_id: String! #to be implemented later 
    # }

    type ProgramChoice {
        id: ID!,
        applicant_id: String!,
        form_no: String!,
        admissions_id: String!, # running_admissions_id
        choice_no: Int,
        course_id: String!,
        campus_id: String!,
        study_time_id: String!
        entry_yr: String!,
        created_at: String!,
        updated_at: String,
        course: Course
        campus_title: String,
        study_time_title: String,
    }

    type Query {
        program_choices: [ProgramChoice]
    }

    type Mutation {
        saveProgramChoices(
            program_choices: [ProgChoiceInput]!,
            form_no: String,
            admissions_id: String!,
        ): ApplicationResponse
    }

    input ProgChoiceInput {
        choice_id: String,
        choice_no: Int,
        course_id: String!,
        campus_id: String!,
        study_time_id: String!,
        entry_yr: String!,
    }

`;

export default ProgramChoiceTypeDefs;
