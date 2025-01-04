const EmployeeTypeDefs = `#graphql

   type Employee {
    id: ID!,
    salutation_id: String!,
    salutation: String!,
    surname: String!,
    other_names: String!,
    staff_id: String!,
    email: String,
    gender: String,
    status: String,
    nationality_id: String,
    nationality: String,
    address: String,
    telno: String,
    religion: String,
    date_of_birth: String,
    joining_date: String,
    designation_id: String,
    designation: String,
    marital_status: String,
    nin: String,
    nssf_no: String,
    tin_no: String,
    salary: String,
    created_on: String!,
    medical_condition: String,
    emergency_contact: String,
    illnesses: String,
    disability: String,
    mother_deceased: Boolean,
    mothers_name: String,
    mothers_telno: String,
    mothers_email: String,
    mothers_nin: String,
    father_deceased: Boolean,
    fathers_name: String,
    fathers_telno: String,
    fathers_email: String,
    fathers_nin: String,
    employment_type: String,
    next_of_kin: EmployeeNextOfKin,
    college: College,
    school: School,
    department: Department,
    campus: Campus,
    employees_education_info: [EmployeeEducationInfo]
    contracts: [EmployeeContract],
    approvers: [Approver],
   }

   type EmployeeNextOfKin {
    id: ID!
    employee_id: String!
    name: String!,
    telno: String!,
    relation: String!
    address: String!,
    email: String!
   }

   type EmployeeContract {
    id: ID!,
    employee_id: String!,
    designation_id: String!,
    start_date: String!,
    end_date: String!,
    created_by: String,
    created_on: String,
   }

   type Approver {
    id: ID,
    name: String,
    employee_id: String!,
    approver_id: String,
    approver_type: String # manager, indirect etc
   }


    type Query {
       employees(active: Boolean): [Employee]!
       employee(id: ID!): Employee
    }

    type Mutation {
        saveEmployee(
            payload: EmployeeInput!
        ): ResponseMessage
        blockEmployee(id: String!): ResponseMessage
        uploadEmployees(payload: [uploadEmployeeInput]!): ResponseMessage
        saveReporting(payload: ReportingInput): ResponseMessage

    }

    input ReportingInput {
        employee_id: String!,
        manager: String,
        indirect_managers: [String],
        first_level_approver: String,
        second_level_approver: String,
        third_level_approver: String,
    }

    input uploadEmployeeInput {
        title: String!,
        name: String!,
        staff_id: String!,
        email: String,
        nationality: String,
        address: String,
        telno: String,
        religion: String,
        date_of_birth: String,
        marital_status: String
    }

    input EmployeeInput {
        id: ID,
        salutation_id: String!,
        surname: String!,
        other_names: String!,
        staff_id: String!,
        email: String!,
        gender: String!,
        status: String!,
        nationality_id: String!,
        address: String!,
        telno: String!,
        religion: String,
        date_of_birth: String!,
        joining_date: String,
        designation_id: String,
        marital_status: String!,
        nin: String,
        salary: String,
        college_id: String,
        school_id: String,
        dpt_id: String,
        campus_id: String,
        mother_deceased: Boolean,
        mothers_name: String,
        mothers_telno: String,
        mothers_email: String,
        mothers_nin: String,
        father_deceased: Boolean,
        fathers_name: String,
        fathers_telno: String,
        fathers_email: String,
        fathers_nin: String,
        nok_name: String,
        nok_email: String,
        nok_relation: String,
        nok_telno: String,
        nok_address: String,
        employment_type: String,
        nssf_no: String,
        tin_no: String,
        qualifications: [EducInfoInput],
        reporting: ReportingInput,
        contract_start_date: String,
        contract_end_date: String,
        application_letter: Upload,
        employee_cv: Upload,
        medical_condition: String!,
        emergency_contact: String!,
        illnesses: String,
        disability: String,
    }

    input EducInfoInput {
        id: ID,
        institution: String!,
        award_obtained: String!,
        award_duration: String!,
        grade: String!,
        start_date: String!,
        end_date: String!,
    }

   

`;

export default EmployeeTypeDefs;
