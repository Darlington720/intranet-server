const feesCategoryTypeDefs = `#graphql

    type FeesCategory {
        id: ID!,
        category_name: String!,
        modified_by: String,
        modified_on: String,
        added_user: Staff!,
        modified_user: Staff,
        fees_items: [FeesItem]
    }

    type Query {
        fees_categories: [FeesCategory]
    }

    type Mutation {
        saveFeesCategory(id: ID, category: String!, added_by: String!): ResponseMessage
        deleteFeesCategory(category_id: ID!): ResponseMessage
    }
`;

export default feesCategoryTypeDefs;
