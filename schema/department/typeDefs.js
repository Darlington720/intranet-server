const departmentTypeDefs = `#graphql

    type Department {
        id: ID!,
        dpt_code: String!,
        dpt_title: String!,
        dpt_head_id: String!,
        school_id: String!,
        added_by: String!,
        added_on: String!,
        modified_by: String!,
        modified_on: String!,
        school: School,
        added_user: Staff,
        modified_user: Staff,
        department_head: Staff
        courses(campus_id: String): [Course]!
    }


    type Query {
        departments: [Department]
        departments_in_school(school_id: ID!): [Department]
    }

    type Mutation {
        saveDepartment(
            id: ID, 
            dpt_code: String!, 
            dpt_title: String!, 
            dpt_head_id: String!,
            school_id: String!, 
            added_by: String, 
        ): [Department]
        deleteDepartment(dpt_id: String!): [Department]
    }

`;

export default departmentTypeDefs;
