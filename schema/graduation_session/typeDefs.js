const graduationSessionTypeDefs = `#graphql

    type GraduationSession {
        id: ID!,
        acc_yr_id: String!,
        acc_yr_title: String!,
        graduation_date: String!,
        clearance_start_date: String!,
        clearance_deadline: String!,
        graduation_venue: String!,
        maximum_attendees: String!,
        status: String,
        last_modified_on: String,
        last_modified_by: String
    }

    type Query {
        graduation_sessions: [GraduationSession]
        active_graduation_session: GraduationSession
    }

    type Mutation {
        saveGraduationSession(payload: GraduationSessionInput): Response
    }

    input GraduationSessionInput {
        id: ID,
        acc_yr_id: String!,
        graduation_date: String!,
        clearance_start_date: String!,
        clearance_deadline: String!,
        graduation_venue: String!,
        maximum_attendees: String!,
        
    }
`;

export default graduationSessionTypeDefs;
