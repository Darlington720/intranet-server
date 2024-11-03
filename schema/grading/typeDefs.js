const gradingTypeDefs = `#graphql

    type Grading {
        id: ID!,
        grading_title: String!,
        description: String!,
        grading_details: [GradingDetails]!
    }


    type GradingDetails {
        id: ID!,
        grading_id: String!,
        min_value: Float!,
        max_value: Float!,
        grade_point: Float!,
        grade_letter: String!
        grading: Grading!
    }

    type Query {
        grading: [Grading]
        grading_details(grading_id: String!): [GradingDetails]
    }

    type Mutation {
        saveGrading(
            id: ID, 
            grading_title: String!, 
            description: String!, 
            added_by: String, 
        ): [Grading]
        
        saveGradingDetails(
            id: ID, 
            grading_id: String!, 
            min_value: Float!,
            max_value: Float!,
            grade_point: Float!,
            grade_letter: String!,
            added_by: String, 
        ): [GradingDetails]

        deleteGradingDetail(grading_detail_id: String!, grading_id: String!): [GradingDetails]
    }

`;

export default gradingTypeDefs;
