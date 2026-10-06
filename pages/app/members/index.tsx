import LoggedLayout from "../../../components/LoggedLayout";
import { WorkspaceMembers } from "../../../components/Workspace/WorkspaceMembers";

export default function MembersPage() {
  return (
    <LoggedLayout>
      <WorkspaceMembers />
    </LoggedLayout>
  );
}

MembersPage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};
