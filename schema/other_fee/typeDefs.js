const otherFeeTypeDefs = `#graphql

    type OtherFee {
        id: ID!,
        acc_yr_id: String!,
        campus_id: String!,
        intake_id: String!,
        nationality_category_id: String!,
        item_id: String!,
        amount: String!,
        added_by: String!,
        added_on: String!,
        fee_item: FeesItem,
    }

    type Query {
        other_fees(
            acc_yr_id: String!, 
            campus_id: String!, 
            intake_id: String!, 
            nationality_category_id: String!,
            ): [OtherFee]
    }

    type Mutation {
        saveOtherFee(
            id: ID,
            acc_yr_id: String!, 
            campus_id: String!, 
            intake_id: String!, 
            nationality_category_id: String!,
            item_id: String!,
            amount: String!,
            added_by: String!,
        ): ResponseMessage

        deleteOtherFee(other_fee_id: String!): ResponseMessage
    }

`;

export default otherFeeTypeDefs;
