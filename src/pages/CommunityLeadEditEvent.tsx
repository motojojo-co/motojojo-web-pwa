import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateEventForCommunityLead, getCommunityLeadEvents } from "@/services/communityLeadService";

const CommunityLeadEditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id || !id) return;
      const events = await getCommunityLeadEvents(user.id);
      const ev = events.find((e: any) => e.id === id);
      if (ev) {
        setTitle(ev.title || "");
        setCity(ev.city || "");
      }
      setLoading(false);
    };
    load();
  }, [user?.id, id]);

  const save = async () => {
    if (!user?.id || !id) return;
    await updateEventForCommunityLead(id, { title, city }, user.id);
    navigate("/communitylead/activity");
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-black">Edit Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="text-black" />
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="text-black" />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="text-black" onClick={() => navigate("/communitylead/activity")}>Cancel</Button>
              <Button className="text-black" onClick={save}>Save</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunityLeadEditEvent;
