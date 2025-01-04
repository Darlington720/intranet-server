const userTypeDefs = `#graphql
type User {
    id: ID!,
    user_id: String!,
    biodata: Employee!,
    email: String!,
    # pwd: String!,
    last_logged_in: [UserLogin],
    created_on: String,
    created_by: String,
    updated_on: String,
    updated_by: String,
    sys_gen_pwd: Int!,
    has_set_sec_qns: Int!
    role: Role
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
    my_profile: User
}

type Token {
    token: String!
}

type Mutation {
    addUser(user_id: String!, role_id: String!, email: String!, created_by: String!):  User
    addNewUser(payload: NewUserInput!): ResponseMessage
    login(email: String!, pwd: String!): Token
    unlockSession(pwd: String!): Token
    change_password(password: String!, id: ID!): User
    save_user_sec_qns(id: Int!, qns: String!): User
}

input NewUserInput {
    user_id: String!,
    role_id: String!,
    employee_id: String!
}

`;

export default userTypeDefs;
