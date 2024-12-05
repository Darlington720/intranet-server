const roleTypeDefs = `#graphql

    type Role {
            role_id: ID!,
            role_name: String!
            description: String
    }
    type Query {
        all_roles: [Role!]!
    }

    type Mutation {
        saveRole(payload: RoleInput!): ResponseMessage
        deleteRole(role_id: ID!): ResponseMessage
    }

    input RoleInput {
        id: ID
        role_name: String!
        description: String
    }

`;

export default roleTypeDefs;
