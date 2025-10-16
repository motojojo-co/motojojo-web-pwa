import { useAuth } from "@/hooks/use-auth";

const CommunityLeadTest = () => {
  const { user, isCommunityLead, isLoaded } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Community Lead Test Page</h1>
        <div className="space-y-2">
          <p><strong>User ID:</strong> {user?.id || 'Not loaded'}</p>
          <p><strong>Email:</strong> {user?.email || 'Not loaded'}</p>
          <p><strong>Is Community Lead:</strong> {isCommunityLead ? 'Yes' : 'No'}</p>
          <p><strong>Is Loaded:</strong> {isLoaded ? 'Yes' : 'No'}</p>
          <p><strong>User Role:</strong> {user?.user_metadata?.role || 'Not set'}</p>
        </div>
      </div>
    </div>
  );
};

export default CommunityLeadTest;
