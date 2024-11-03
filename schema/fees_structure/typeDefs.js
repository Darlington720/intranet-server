const feesStructureTypeDefs = `#graphql

    type FeeStructure {
        id: ID!,
        item_code: String!,
        item_name: String!,
        item_description: String,
        mandatory: Int!,
        category: FeesCategory,
        amount: String,
        frequency_code: String,
        study_yr: String,
        semester: String
    }

    type Query {
        calculateFeesStructure(
            acc_yr_id: String!,
            campus_id: String!,
            intake_id: String!,
            course_id: String!,
            course_duration: Int!,
            nationality_category_id: String!,
            study_time_id: String!,
            level_id:String!,
            study_yrs: [String],
            other_fees: [String]
        ): [FeeStructure]
    }

    type Mutation {
        copyFeesStructure(
            from_acc_yr_id: String!,
            from_campus_id: String!,
            from_intake_id: String!,
            to_acc_yr_id: String!,
            to_campus_id: String!,
            to_intake_id: String!,
            scope: [String]!,
            overwrite: Int!,
            added_by: String!
        ): ResponseMessage
        
    }
`;

export default feesStructureTypeDefs;
