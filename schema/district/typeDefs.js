const districtMessageTypeDefs = `#graphql

    type District {
        id: String!,
        district_title: String!
    }

    type Query {
        districts: [District!]!
    }
`;

export default districtMessageTypeDefs;
