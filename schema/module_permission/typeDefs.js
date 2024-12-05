const modulePermissionTypeDefs = `#graphql

    type ModulePermission {
        permission_id: ID!,
        permission_name: String!,
        requires_approval: Boolean,
        description: String,
        module: Module!
    }

    type Query {
        module_permissions(module_id: ID!): [ModulePermission!]!
    }

`;

export default modulePermissionTypeDefs;
