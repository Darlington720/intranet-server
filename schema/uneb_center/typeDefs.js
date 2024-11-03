const unebCentersTypeDefs = `#graphql

    # staff type is missing field -> email 
    type UnebCentre {
        id: ID!,
        center_number: String!,
        center_name: String!,
    }


    type Query {
        uneb_centres: [UnebCentre]
    }

    # type Mutation {
        
    # }

`;

export default unebCentersTypeDefs;
