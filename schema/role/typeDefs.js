const roleTypeDefs = `#graphql

    type Role {
            role_id: ID,
            role_name: String!
            description: String,
            _modules: [Module]!
            permissions: String
    }
    type Query {
        all_roles: [Role!]!
        role_modules(role_id: String!): [Module]!
    }

    type Mutation {
        saveRole(payload: RoleInput!): ResponseMessage
        updateRolePermissions(payload: RolePermissionInput!): ResponseMessage 
        updateRoleModules(payload: RoleModuleInput!): ResponseMessage 
        deleteRole(role_id: ID!): ResponseMessage
        deleteRoleModule(role_id: String!, module_id: String!): ResponseMessage
    }

    input RoleInput {
        id: ID
        role_name: String!
        description: String
    }

    input RolePermissionInput {
        role_id: ID!
        permissions: String!
    }

    input RoleModuleInput {
        role_id: ID!
        module_ids: [String!]!
    }

`;

export default roleTypeDefs;
