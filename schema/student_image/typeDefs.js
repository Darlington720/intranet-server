const studentImageTypeDefs = `#graphql
    scalar Upload

    type StudentImage {
        id: ID!,
        stdno: String!,
        uploaded_by: String!,
        uploaded_on: String!,
        upload_status: String!, # can be new, update
        modified_by: String,
        modified_on: String,
        student: Student,
        added_user: Staff!,
        modified_user: Staff
    }

    type Query {
        getImage: String! # returns the image url only 
        getRecentlyUploadedImages: [StudentImage]
    }

    type Mutation {
        saveStudentImage(
            id: ID
            file: Upload,
            stdno: String!,
            uploaded_by: String!
        ): ResponseMessage
    }

`;

export default studentImageTypeDefs;
