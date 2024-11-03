const studyTimeTypeDefs = `#graphql

    type StudyTime {
        id: ID!,
        study_time_title: String!,
        added_by: String!,
        added_on: String!,
        modified_by: String,
        modified_on: String,
        added_user: Staff!,
        modified_user: Staff
    }

    type Query {
        study_times: [StudyTime]
    }

    type Mutation {
        saveStudyTime(id: ID, study_time_title: String!, added_by: String!): StudyTime
    }

`;

export default studyTimeTypeDefs;
