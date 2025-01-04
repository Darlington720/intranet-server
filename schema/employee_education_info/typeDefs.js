const employeeEducationInfoTypeDefs = `#graphql

    type EmployeeEducationInfo {
        id: ID!,
        employee_id: String!
        institution: String!,
        award_obtained: String!,
        award_duration: String!,
        grade: String!,
        start_date: String!,
        end_date: String!,
    }

    type Query {
        education_info: [EmployeeEducationInfo]
    }

    type Mutation {
        saveEducationInfo(payload: EducationInfoInput!): ResponseMessage
    }

    input EducationInfoInput {
        id: ID,
        employee_id: String!
        institution: String!,
        award_obtained: String!,
        award_duration: String!,
        grade: String!,
        start_date: String!,
        end_date: String!,
    }
`;

export default employeeEducationInfoTypeDefs;
