const feesVersionTypeDefs = `#graphql

    type FeesVersion {
        id: ID!,
        version_title: String!,
        version_description: String,
        modified_by: String,
        modified_on: String,
        added_user: Staff!,
        modified_user: Staff,
    }

    type Query {
        fees_versions: [FeesVersion]
    }

    type Mutation {
        saveFeesVersion(id: ID, version_title: String!, version_description: String, added_by: String!): ResponseMessage
        deleteFeesVersion(version_id: ID!): ResponseMessage
    }
`;

export default feesVersionTypeDefs;
