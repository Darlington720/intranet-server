const courseTypeDefs = `#graphql

    type Course {
        id: ID!,
        course_code: String!,
        course_title: String!,
        course_duration: Int!,
        duration_measure: String!,
        course_head_id: String, 
        campuses: String,
        entry_yrs: String,
        college_id: String,
        school_id: String,
        department_id: String,
        level: String,
        award: String,
        grading_id: String!,
        study_times: String,
        is_short_course: Int!,
        course_versions: [CourseVersion]!,
        department: Department,
        school: School,
        level_details: Level,
        advertised_course_id: String,
        course_study_times: [StudyTime],
        course_aliases: [CourseAlias]
    }



    type CourseVersion {
        id: String!,
        course_id: String!,
        # course_code: String,
        # course_title: String,
        # course_duration: String,
        # duration_measure: String,
        version_title: String!,
        added_on: String!,
        added_by: String!,
        modified_on: String,
        modified_by: String
        course: Course,
        added_user: Staff,
        modified_user: Staff
        # course_units: [CourseUnit]
    }

    type CourseAlias {
        id: ID,
        alias_code: String!,
        course_id: String!,
        study_time_id: String!,
        campus_id: String!,
        campus_title: String,
        study_time_title: String
    }

    input CourseFields {
        prog_code: String!,
        prog_title: String!,
        prog_version: String!,
        department_code: String!,
        duration: Int!,
        duration_measure: String!,
        level: String!,
        grading_id: String!,
        is_short_course: Boolean!,
    }


    type Query {
        courses: [Course]
        course(course_id: ID!): Course
        course_version_details(course_version_id: String!): CourseVersion
        courses_based_on_level(admission_level_id: String!): [Course]
        advertised_courses(running_admission_id: String!): [Course]
        course_aliases(course_id: String!): [CourseAlias] 
    }

    type Mutation {
        saveCourse(
            id: ID,
            course_code: String!,
            course_title: String!,
            course_duration: Int!,
            duration_measure: String!,
            course_head_id: String, 
            campuses: String!,
            entry_yrs: String!,
            college_id: String!,
            school_id: String!,
            department_id: String!,
            level: String!,
            award: String!,
            grading_id: String!,
            study_times: String!,
            is_short_course: Int!,
            course_version: String!
            course_version_id: String,
            added_by: String!,
            
        ): CourseVersion

        saveCourseVersion(id: ID, course_id: String!, version_title: String!, added_by: String!): CourseVersion
        uploadCourses(courses: [CourseFields]!, uploaded_by: String!): ResponseMessage
        saveAdvertisedCourse(running_admission_id: String!, course_id: String!, added_by: String!): ResponseMessage
        removeAdvertisedCourse(advertised_course_id: String!, added_by: String!): ResponseMessage
        saveCourseAlias(alias: aliasInput!, added_by: String!): ResponseMessage
        deleteCourseAlias(alias_id: ID!): ResponseMessage
        # deleteDepartment(dpt_id: String!): [Department]
    }

    input aliasInput {
        id: String,
        course_id: String!,
        alias_code: String!,
        study_time_id: String!,
        campus_id: String!,
    }

`;

export default courseTypeDefs;
