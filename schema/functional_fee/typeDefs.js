const functionalFeesTypeDefs = `#graphql

    type FunctionalFee {
        id: ID!,
        acc_yr_id: String!,
        campus_id: String!,
        intake_id: String!,
        level_id: String!,
        nationality_category_id: String!,
        study_time_id: String!,
        item_id: String!,
        amount: String!,
        frequency_code: String!,
        added_by: String!,
        added_on: String!,
        modified_by: String!,
        modified_on: String!,
        fee_item: FeesItem,
        frequency: FrequencyCode
    }

    type Query {
        functional_fees(
            acc_yr_id: String!, 
            campus_id: String!, 
            intake_id: String!, 
            level_id: String!,
            nationality_category_id: String!,
            study_time_id: String!,
            ): [FunctionalFee]
    }

    type Mutation {
        saveFunctionalFee(
            id: ID,
            acc_yr_id: String!, 
            campus_id: String!, 
            intake_id: String!, 
            level_id: String!,
            nationality_category_id: String!,
            study_time_id: String!,
            item_id: String!,
            amount: String!,
            frequency_code: String!,
            added_by: String!,
        ): ResponseMessage

        deleteFuntionalFee(functional_fee_id: String!): ResponseMessage
    }

`;

export default functionalFeesTypeDefs;
