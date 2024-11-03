const userTypeDefs = `#graphql
type User {
    id: ID!,
    user_id: String!,
    biodata: Staff!,
    email: String!,
    pwd: String!,
    last_logged_in: [UserLogin],
    created_on: String,
    created_by: String,
    updated_on: String,
    updated_by: String,
    sys_gen_pwd: Int!,
    has_set_sec_qns: Int!
    role: UserRole
    # modules: [Module]!
    }

# last login instances
type UserLogin {
    id: ID!,
    user_id: String!,
    logged_in: String!,
    logged_out: String,
    machine_ipaddress: String!
}


type Query {
    users: [User]
}

type Mutation {
    addUser(user_id: String!, role_id: String!, email: String!, created_by: String!):  User
    login(email: String!, pwd: String!): User
    change_password(password: String!, id: ID!): User
    save_user_sec_qns(id: Int!, qns: String!): User
}

`;

export default userTypeDefs;
