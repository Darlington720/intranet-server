const unebSubjectsTypeDefs = `#graphql

    # staff type is missing field -> email 
    type UnebSubject {
        id: ID!,
        uneb_subject_code: String!,
        uneb_subject_title: String!,
        uneb_study_level_id: String!,
        uneb_study_level: UnebStudyLevel,
    }


    type Query {
        uneb_Subjects(uneb_study_level_id: String!): [UnebSubject]
    }

    # type Mutation {
        
    # }

`;

export default unebSubjectsTypeDefs;
