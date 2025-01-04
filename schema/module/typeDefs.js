const moduleTypeDefs = `#graphql

type Module {
        id: ID!,
        title: String!,
        route: String!,
        logo: String!,
        description: String,
        permissions: String
    }
     
type Query {
    modules: [Module]
}

# type Mutation {
#     addModule(): Module
# }

`;

export default moduleTypeDefs;
