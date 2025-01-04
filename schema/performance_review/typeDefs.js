const performanceReviewTypeDefs = `#graphql

    type PerformanceReview {
        id: ID!,
        employee_id: String!,
        template_id: String!,
        status: String!,
        review_period: String!,
        added_by: String!,
        added_on: String!,
        employee_name: String,
        template_name: String,
        added_by_name: String
        employee: Employee,
        template: EvaluationTemplate,
        employee_approvers: [Approver],
    }

    type Query {
        performance_reviews: [PerformanceReview]
        performance_review(id: ID!): PerformanceReview
    }

    type Mutation {
        savePerformanceReview(payload: PerformanceReviewInput): ResponseMessage
    }

    input PerformanceReviewInput {
        id: ID,
        employee_id: String!,
        template_id: String!,
        status: String!,
        period: String!
    }
`;

export default performanceReviewTypeDefs;
