const intakeTypeDefs = `#graphql

    type Intake {
        id: ID!,
        intake_title: String!,
        added_by: String!,
        added_on: String!,
        modified_by: String,
        modified_on: String,
        added_user: Staff,
        modified_user: Staff
    }

    type Query {
        intakes: [Intake]
    }

    type Mutation {
        saveIntake(id: ID, intake_title: String!, added_by: String!): Intake
    }

`;

export default intakeTypeDefs;
