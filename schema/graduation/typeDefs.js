const graduationSectionTypeDefs = `#graphql

    type GraduationSection {
        id: ID!,
        title: String!,
        for_residents: Boolean,
        instructions: String,
        level_id: String,
        requires_attachments: Boolean,
        sort: Int
    }

    type Elligibity {
        has_missed_papers: Boolean
        has_retakes: Boolean
    }

    type Query {
        graduation_sections: [GraduationSection]
        check_graduation_elligibility: Elligibity
        
    }


    type Mutation {
        verify_student_credentials(payload: CredentialsPayload): Response
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
    }

`;

export default graduationSectionTypeDefs;
