const universityTypeDefs = `#graphql

    type University {
        id: ID!,
        university_code: String,
        university_title: String,
        university_logo: String,
        contact: String,
        entry_yrs: Int,
        semeters_per_acc_yr: Int,
        university_x_account: String,
        university_facebook_account: String,
        university_instagram_account: String,
        favicon: String,
        primary_color: String,
        secondary_color: String,
    }

    type Query {
        university_details: University
    }

    type Mutation {
        saveUniversityDetails(
            id: ID,
            university_code: String,
            university_title: String,
            contact: String,
            entry_yrs: Int,
            semeters_per_acc_yr: Int,
            university_x_account: String,
            university_facebook_account: String,
            university_instagram_account: String,
            university_logo: String,
            favicon: String,
            primary_color: String,
            secondary_color: String,
        ): University
        
    }

`;

export default universityTypeDefs;
