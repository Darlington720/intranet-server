const religionMessageTypeDefs = `#graphql

    type Religion {
        id: String!,
        religion_title: String!
    }

    type Query {
        religions: [Religion!]!
    }
`;

export default religionMessageTypeDefs;
