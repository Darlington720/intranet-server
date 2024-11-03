const data = {
  colleges: [
    {
      id: "c9133231-37e2-4a49-a3a5-f81694d1a515-1717754822293",
      college_code: "NKUMBA",
      college_title: "NKUMBA COLLEGE",
      schools: [
        {
          id: "81acdc02-d072-46df-bf9e-ec5a05b63a37-1717757249635",
          school_code: "SBA",
          school_title: "SCHOOL OF BUSINESS ADMINSTRATION",
          levels: [
            {
              id: "059461d7-1630-4d63-8351-c709b82f766b-1718197497254",
              level_code: "CERT",
              level_title: "CERTIFICATE",
              study_times: [
                {
                  id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                  study_time_title: "DAY",
                },
              ],
            },
            {
              id: "b9fee0fe-da41-4124-bda9-50f9fc257212-1718196373087",
              level_code: "BAC",
              level_title: "BACHELOR",
              study_times: [
                {
                  id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                  study_time_title: "DISTANCE",
                },
                {
                  id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                  study_time_title: "WEEKEND",
                },
                {
                  id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                  study_time_title: "DAY",
                },
              ],
            },
            {
              id: "d8f46fc4-04c6-4fec-9afb-74e0b078cb06-1718197523030",
              level_code: "PGD",
              level_title: "POSTGRADUATE DIPLOMA",
              study_times: [
                {
                  id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                  study_time_title: "DISTANCE",
                },
                {
                  id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                  study_time_title: "WEEKEND",
                },
              ],
            },
            {
              id: "f4ab523d-cb79-4699-a5b9-d09adc723550-1718197481723",
              level_code: "MAS",
              level_title: "MASTERS",
              study_times: [
                {
                  id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                  study_time_title: "DISTANCE",
                },
                {
                  id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                  study_time_title: "WEEKEND",
                },
              ],
            },
            {
              id: "fe088b4f-08f2-450d-a055-9c4dc59c27a8-1718201795943",
              level_code: "DIP",
              level_title: "DIPLOMA",
              study_times: [
                {
                  id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                  study_time_title: "DISTANCE",
                },
                {
                  id: "917cf1c6-1e78-422c-b69d-365b1eeb4d44-1718205883274",
                  study_time_title: "WEEKEND",
                },
                {
                  id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                  study_time_title: "DAY",
                },
              ],
            },
          ],
        },
        {
          id: "9aefb8af-ffcd-4b03-8e96-1a6076b97cd1-1718437326032",
          school_code: "SHES",
          school_title: "SCIENCES",
          levels: [
            {
              id: "059461d7-1630-4d63-8351-c709b82f766b-1718197497254",
              level_code: "CERT",
              level_title: "CERTIFICATE",
              study_times: [
                {
                  id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                  study_time_title: "DAY",
                },
              ],
            },
          ],
        },
        {
          id: "cf6fbab1-21db-42f6-b555-ad17077a743b-1718437367764",
          school_code: "SHORT",
          school_title: "SHORT COURSES",
          levels: [
            {
              id: "059461d7-1630-4d63-8351-c709b82f766b-1718197497254",
              level_code: "CERT",
              level_title: "CERTIFICATE",
              study_times: [
                {
                  id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
                  study_time_title: "DAY",
                },
              ],
            },
          ],
        },
        {
          id: "885a1b44-ee61-46d9-8306-699cc506ea55-1718437393373",
          school_code: "SPSR",
          school_title: "SCHOOL OF POSTGRADUATE STUDIES AND RESEARCH",
          levels: [
            {
              id: "5cd790d9-e310-41ac-913b-42f2595611ce-1718197547596",
              level_code: "PhD",
              level_title: "POSTGRADUATE DEGREE",
              study_times: [
                {
                  id: "135cd427-a80d-4f22-a350-514f9b050e67-1718205936290",
                  study_time_title: "DISTANCE",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  nationality_categories: [
    {
      id: "1",
      category_title: "NATIONAL",
    },
    {
      id: "2",
      category_title: "INTERNATIONAL",
    },
  ],
};

const generateTreeData = (data) => {
  return data.colleges.map((college) => ({
    title: college.college_title,
    key: `college-${college.college_code}`,
    children: college.schools.map((school) => ({
      title: school.school_title,
      key: `school-${school.school_code}`,
      children: data.levels.map((level) => ({
        title: level.level_title,
        key: `level-${level.level_code}`,
        children: data.study_times.map((studyTime) => ({
          title: studyTime.study_time_title,
          key: `study-time-${studyTime.study_time_title}`,
          children: data.nationality_categories.map((nationality) => ({
            title: nationality.category_title,
            key: `nationality-${nationality.id}`,
          })),
        })),
      })),
    })),
  }));
};

const treeData = generateTreeData(data);

console.log("tree data", treeData);
