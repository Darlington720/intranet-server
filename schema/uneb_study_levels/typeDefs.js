const unebStudyLevelsTypeDefs = `#graphql

    # staff type is missing field -> email 
    type UnebStudyLevel {
        id: ID!,
        title: String!,
    }


    type Query {
        uneb_study_levels: [UnebStudyLevel]
    }

    # type Mutation {
        
    # }

`;

export default unebStudyLevelsTypeDefs;
