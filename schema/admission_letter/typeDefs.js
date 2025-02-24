const admissionLetterTypeDefs = `#graphql
    # staff type is missing field -> email 
    type AdmissionLetter {
       id: ID!,
       name: String!,
       scheme_id: String!,
       scheme_title: String!,
       intake_id: String!,
       intake_title: String!,
       content: String!,
       template_id: String,
       header: String,
       signature: String,
       background: String,
       layout_width: String,
       layout_height: String,
       reporting_dates: String,
       registration_dates: String,
       lecture_dates: String,
       file_name: String,
       created_on: String!,
       created_by: String!,
       last_modified_on: String,
       last_modified_by: String,
       last_modified_by_user: String
    }

    type AdmissionLetterResponse {
       file: String!  # Base64-encoded file
       filename: String!
    }

    type AdmissionLetterResponse2 {
        admission_letter: String!
        background_image: String
    }


    type Query {
        admission_letters: [AdmissionLetter]
        print_admission_letter(form_no: String!): AdmissionLetterResponse2!
        print_admission_letters(students: [LetterPreviewInput]): [AdmissionLetterResponse2]!
    }

    type Mutation {
        saveAdmissionLetter(payload: AdmissionLetterInput): ResponseMessage
        saveAdmissionTemplate(payload: AdmissionTemplateInput): ResponseMessage
    }

    input LetterPreviewInput {
        form_no: String!,
        applicant_id: String!
    }

    input AdmissionLetterInput {
        id: String,
        intake_id: String!,
        scheme_id: String!,
        template_name: String!,
        file: Upload,
        file_name: String,
        template_id: String
    }


    input AdmissionTemplateInput {
        id: String,
        intake_id: String!,
        scheme_id: String!,
        template_name: String!,
        content: String!,
        layout_width: String!,
        layout_height: String!,
        header: Upload,
        signature: Upload,
        background: Upload,
        reporting_dates: String,
        registration_dates: String,
        lecture_dates: String,
    }
`;

export default admissionLetterTypeDefs;
