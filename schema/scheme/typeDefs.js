const schemeTypeDefs = `#graphql

   type Scheme {
    id: ID!,
    scheme_title: String!,
    description: String!,
    is_active: Int!,
    created_by: String!,
    created_on: String!,
    modified_by: String,
    modified_on: String,
    created_user: Staff,
    modified_user: Staff,
   }

    type Query {
       schemes: [Scheme]
       active_schemes: [Scheme]
    }

    type Mutation {
        saveScheme(
            id: ID, 
            scheme_title: String!,
            description: String!,
            is_active: Int!, 
            added_by: String!, 
        ): ResponseMessage
        deleteScheme(scheme_id: String!): ResponseMessage
    }

`;

export default schemeTypeDefs;
