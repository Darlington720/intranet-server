const AcademicScheduleTypeDefs = `#graphql

    type AcademicSchedule {
        id: ID!,
        acc_yr_id: String!,
        intake_id: String!,
        semester: String!,
        start_date: String!,
        end_date: String!,
        added_by: String!,
        added_on: String!,
        modified_by: String,
        modified_on: String,
        added_user: Staff!,
        modified_user: Staff,
        acc_yr: AcademicYear,
        intake: Intake,
        status: String
    }

    type Query {
        academic_schedules: [AcademicSchedule]
    }

    type Mutation {
        saveAcademicSchedule(
        id: ID, 
        acc_yr_id: String!,
        intake_id: String!,
        semester: String!,
        start_date: String!,
        end_date: String!,
        added_by: String!): ResponseMessage

        deleteAdcademicSchedule(schedule_id: String!): ResponseMessage
    }

`;

export default AcademicScheduleTypeDefs;
