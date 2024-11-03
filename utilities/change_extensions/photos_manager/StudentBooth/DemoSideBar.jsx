import FuseNavigation from "@fuse/core/FuseNavigation";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

const navigationData = [
  {
    id: "1",
    title: "Actions",
    // subtitle: "Task, project & team",
    type: "group",
    children: [
      {
        id: "1.1",
        name: "reports",
        title: "Photo Reports",
        type: "item",
        subtitle: "Photo Manager reports",

        icon: "material-solid:app_registration",
        route: "photo_manager/reports",
      },
      {
        id: "1.2",
        name: "updated_photos",
        title: "Updated Photos",
        subtitle: "Students' with updated photos",
        type: "item",
        icon: "material-solid:auto_graph",
        route: "photo_manager/updated_photos",
      },
      // {
      //   id: "1.3",
      //   name: "clearance",
      //   title: "Student Clearance",
      //   type: "item",
      //   icon: "material-solid:clear_all",
      //   route: "admissions",
      // },
      // {
      //   id: "1.4",
      //   name: "bulk_sms",
      //   title: "Bulk SMS",
      //   type: "item",
      //   icon: "material-solid:sms",
      //   route: "registration/reports",
      // },
      // {
      //   id: "1.5",
      //   name: "configurator",
      //   title: "Configurator",
      //   // subtitle: "",
      //   type: "item",
      //   icon: "material-solid:settings",
      //   route: "registration/reports",
      // },
    ],
  },
  {
    id: "4",
    type: "divider",
  },
];

function DemoSidebar({ changeContent }) {
  const navigate = useNavigate();
  return (
    <div className="px-12 py-24">
      <div className="mx-12 text-3xl font-bold tracking-tighter">
        Photos Manager Side Bar
      </div>

      <FuseNavigation
        navigation={navigationData}
        className="px-0"
        // navigation={(item) => `/${item.route}`}
        onItemClick={(item) => {
          changeContent(item.name);
        }}
      />
    </div>
  );
}

export default DemoSidebar;
