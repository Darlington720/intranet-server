const frequencyCodeTypeDefs = `#graphql

    type FrequencyCode {
        id: ID!,
        code_id: String!,
        code_title: String!
    }

    type Query {
        frequency_codes: [FrequencyCode]
    }

    # type Mutation {
    #     saveIntake(id: ID, intake_title: String!, added_by: String!): Intake
    # }

`;

export default frequencyCodeTypeDefs;
