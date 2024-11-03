const SemesterTypeDefs = `#graphql

    type Semester {
        id: ID!,
        title: String!,
    }

    type Query {
        semesters: [Semester]
    }

    # type Mutation {
    #     saveAccYr(id: ID, acc_yr_title: String!, added_by: String!): AcademicYear
    # }

`;

export default SemesterTypeDefs;
