const moduleTypeDefs = `#graphql

type Module {
        id: ID!,
        title: String!,
        route: String!,
        logo: String!
    }
     
type Query {
    modules: [Module]
}

# type Mutation {
#     addModule(): Module
# }

`;

export default moduleTypeDefs;
