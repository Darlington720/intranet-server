const tuitionFeesTypeDefs = `#graphql

    type TuitionFee {
        id: ID!,
        acc_yr_id: String!,
        campus_id: String!,
        intake_id: String!,
        school_id: String!,
        course_id: String!,
        study_yr: String!,
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
        tuition_fees(
            acc_yr_id: String!, 
            campus_id: String!, 
            intake_id: String!, 
            school_id: String!,
            course_id: String!,
            study_yr: String!,
            nationality_category_id: String!,
            study_time_id: String!,
            ): [TuitionFee]
    }

    type Mutation {
        saveTuitionFee(
            id: ID,
            acc_yr_id: String!, 
            campus_id: String!, 
            intake_id: String!, 
            school_id: String!,
            course_id: String!,
            study_yr: String!,
            nationality_category_id: String!,
            study_time_id: String!,
            item_id: String!,
            amount: String!,
            frequency_code: String!,
            added_by: String!,
        ): ResponseMessage

        deleteTuitionFee(tuition_fee_id: String!): ResponseMessage
    }

`;

export default tuitionFeesTypeDefs;
