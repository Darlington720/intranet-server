const feesItemTypeDefs = `#graphql

    type FeesItem {
        id: ID!,
        item_code: String!,
        item_name: String!,
        item_description: String,
        mandatory: Int!,
        category: FeesCategory,
      
    }

    type Query {
        fees_items: [FeesItem]
      
    }

    type Mutation {
        saveFeesItem(id: ID, item_code: String!, item_name: String!, item_description: String, mandatory: Int, category: String!): ResponseMessage
        deleteFeesItem(fees_item_id: ID!): ResponseMessage
 
    }
`;

export default feesItemTypeDefs;
