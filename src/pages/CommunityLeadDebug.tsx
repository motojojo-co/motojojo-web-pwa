import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

const CommunityLeadDebug = () => {
  const { user, isCommunityLead, isLoaded, profile } = useAuth();

  useEffect(() => {
    console.log("CommunityLeadDebug - User:", user);
    console.log("CommunityLeadDebug - Is Community Lead:", isCommunityLead);
    console.log("CommunityLeadDebug - Is Loaded:", isLoaded);
    console.log("CommunityLeadDebug - Profile:", profile);
  }, [user, isCommunityLead, isLoaded, profile]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Community Lead Debug</h1>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>User ID:</strong>
              <p className="text-sm text-gray-600">{user?.id || 'Not loaded'}</p>
            </div>
            <div>
              <strong>Email:</strong>
              <p className="text-sm text-gray-600">{user?.email || 'Not loaded'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Is Community Lead:</strong>
              <p className="text-sm text-gray-600">{isCommunityLead ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <strong>Is Loaded:</strong>
              <p className="text-sm text-gray-600">{isLoaded ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div>
            <strong>User Role (from metadata):</strong>
            <p className="text-sm text-gray-600">{user?.user_metadata?.role || 'Not set'}</p>
          </div>

          <div>
            <strong>Profile Role:</strong>
            <p className="text-sm text-gray-600">{profile?.role || 'Not set'}</p>
          </div>

          <div>
            <strong>Full Profile:</strong>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>

          <div>
            <strong>Full User:</strong>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityLeadDebug;
