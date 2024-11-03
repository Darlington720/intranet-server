const RunningAdmissionsTypeDefs = `#graphql

   type RunningAdmission {
    id: ID,
    intake_id: String!,
    scheme_id: String!,
    admission_level_id: String!,
    acc_yr_id: String!,
    start_date: String!,
    end_date: String!,
    no_of_choices: Int!,
    max_no_of_forms: Int!,
    form_template_id: String!,
    description: String,
    national_application_fees: String!,
    east_african_application_fees: String!,
    international_application_fees: String!,
    activate_admission_fees: Int!,
    national_admission_fees: String,
    east_african_admission_fees: String,
    international_admission_fees: String,
    created_by: String!,
    created_on: String!,
    modified_by: String,
    modified_on: String,
    created_user: Staff,
    modified_user: Staff,
    intake: Intake,
    scheme: Scheme,
    admission_level: AdmissionLevel,
    acc_yr: AcademicYear,
   }

    type Query {
       running_admissions: [RunningAdmission]
    }

    type Mutation {
        saveRunningAdmission(
            id: ID, 
            intake_id: String!,
            scheme_id: String!,
            admission_level_id: String!,
            acc_yr_id: String!,
            start_date: String!,
            end_date: String!,
            no_of_choices: Int!,
            max_no_of_forms: Int!,
            form_template_id: String!,
            description: String,
            national_application_fees: String!,
            east_african_application_fees: String!,
            international_application_fees: String!,
            activate_admission_fees: Int!,
            national_admission_fees: String,
            east_african_admission_fees: String,
            international_admission_fees: String,
            added_by: String!, 
        ): ResponseMessage
        deleteRunningAdmission(running_admission_id: String!): ResponseMessage
    }

`;

export default RunningAdmissionsTypeDefs;
