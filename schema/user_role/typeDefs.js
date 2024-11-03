const userRoleTypeDefs = `#graphql

type UserRole {
        id: ID!,
        role_name: String!
        modules: String!
        _modules: [Module]
        permissions: String!
}
type Query {
    user_roles: [UserRole]
    roles: [UserRole]
}

type Mutation {
    saveRolePermissions(role_id: ID!,  modules: String!): [UserRole]
}

`;

export default userRoleTypeDefs;
