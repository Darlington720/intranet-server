const staffTypeDefs = `#graphql

    # staff type is missing field -> email 
    type Staff {
        id: ID!,
        staff_id: String!,
        title: String!,
        staff_name: String!,
        role: String!,
        email: String
    }


    type Query {
        staff_members: [Staff]
        staff_autocomplete(staff_name: String!): [Staff]
    }

    # type Mutation {
        
    # }

`;

export default staffTypeDefs;
