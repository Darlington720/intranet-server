const schoolTypeDefs = `#graphql

    # staff type is missing field -> email 
    type School {
        id: ID!,
        school_code: String!,
        school_title: String!,
        school_dean_id: String!,
        college_id: String!,
        added_by: String,
        added_on: String,
        modified_by: String,
        modified_on: String,
        college: College,
        added_user: Staff,
        modified_user: Staff,
        school_dean: Staff,
        departments: [Department]!
        levels: [Level]
        courses(campus_id: String): [Course]!
    }

    type Query {
        schools: [School]
        schools_in_college(college_id: ID!): [School]
    }

    type Mutation {
        saveSchool(
            id: ID, 
            school_code: String!, 
            school_title: String!, 
            school_dean_id: String!,
            college_id: String!, 
            added_by: String, 
        ): [School]
        deleteSchool(school_id: String!): [School]
        saveSchoolLevels(school_id: String!, levels: [String]!, added_by: String!): ResponseMessage
    }

`;

export default schoolTypeDefs;
