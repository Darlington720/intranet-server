const EnrollmentStatusTypeDefs = `#graphql

  type EnrollmentStatus {
        id: String!,
        title: String!,
        description: String,
        color_code: String!
    }
    type Query {
        enrollment_types: [EnrollmentStatus]
    }

    # type Mutation {
    #     saveAccYr(id: ID, acc_yr_title: String!, added_by: String!): AcademicYear
    # }

`;

export default EnrollmentStatusTypeDefs;
