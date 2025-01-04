const DesignationTypeDefs = `#graphql

   type Designation {
    id: ID!,
    designation_name: String!,
    description: String,
    created_on: String!
   }

    type Query {
       designations: [Designation]
    }

    type Mutation {
        saveDesignation(
            payload: DesignationInput!
        ): ResponseMessage
        deleteDesignation(id: String!): ResponseMessage
    }

    input DesignationInput {
        id: ID,
        name: String!,
        description: String
    }

`;

export default DesignationTypeDefs;
