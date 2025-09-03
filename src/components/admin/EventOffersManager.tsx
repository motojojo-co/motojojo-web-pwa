import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  EventOffer, 
  CreateEventOfferData, 
  createEventOffer, 
  updateEventOffer, 
  deleteEventOffer 
} from "@/services/eventOfferService";

interface EventOffersManagerProps {
  eventId: string;
  offers: EventOffer[];
  onOffersChange: (offers: EventOffer[]) => void;
}

const OFFER_TYPES = [
  { value: 'razorpay_above', label: 'Transaction of Razorpay over and Above' },
  { value: 'add_person', label: 'Add Person (+1, +3, etc.)' },
  { value: 'group_discount', label: 'Group Discount' },
  { value: 'no_stag', label: 'No STAG' },
  { value: 'student_discount', label: 'Student Discount' },
  { value: 'flat_rate', label: 'Flat Rate' },
  { value: 'women_flash_sale', label: 'Women Flash Sale' }
];

const OFFER_TEMPLATES = [
  {
    title: 'Add 450 for +1',
    offer_type: 'add_person',
    price_adjustment: 450,
    min_quantity: 1,
    group_size: 2,
    description: 'Add one additional person for ₹450'
  },
  {
    title: 'Add 400 for +3',
    offer_type: 'add_person',
    price_adjustment: 400,
    min_quantity: 3,
    group_size: 4,
    description: 'Add three additional persons for ₹400 each'
  },
  {
    title: 'Add 750 for +1',
    offer_type: 'add_person',
    price_adjustment: 750,
    min_quantity: 1,
    group_size: 2,
    description: 'Premium add one person for ₹750'
  },
  {
    title: 'Group of 4 - ₹500 each',
    offer_type: 'group_discount',
    price_adjustment: 500,
    min_quantity: 4,
    group_size: 4,
    description: 'Special rate for groups of 4 people'
  },
  {
    title: 'Student Flat Rate - ₹499',
    offer_type: 'flat_rate',
    price_adjustment: 499,
    min_quantity: 1,
    group_size: 1,
    description: 'Special student pricing with ID verification'
  },
  {
    title: 'Women Flash Sale - Friday 2 Hours',
    offer_type: 'women_flash_sale',
    price_adjustment: 0,
    min_quantity: 1,
    max_quantity: 1,
    group_size: 1,
    description: 'Special flash sale for women every Friday for 2 hours. Single ticket only.'
  }
];

export default function EventOffersManager({ eventId, offers, onOffersChange }: EventOffersManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<EventOffer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isNewEvent = eventId === "new";

  const [formData, setFormData] = useState<CreateEventOfferData>({
    event_id: eventId,
    offer_type: 'razorpay_above',
    title: '',
    description: '',
    price_adjustment: 0,
    min_quantity: 1,
    max_quantity: undefined,
    group_size: 1,
    conditions: {},
    is_active: true,
    valid_from: new Date().toISOString(),
    valid_until: null
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, event_id: eventId }));
  }, [eventId]);

  const resetForm = () => {
    setFormData({
      event_id: eventId,
      offer_type: 'razorpay_above',
      title: '',
      description: '',
      price_adjustment: 0,
      min_quantity: 1,
      max_quantity: undefined,
      group_size: 1,
      conditions: {},
      is_active: true,
      valid_from: new Date().toISOString(),
      valid_until: null
    });
    setEditingOffer(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isNewEvent) {
        // For new events, just add to local state
        const tempOffer = {
          id: `temp-${Date.now()}`,
          ...formData,
          valid_from: new Date().toISOString(),
          valid_until: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as EventOffer;
        
        if (editingOffer) {
          const updatedOffers = offers.map(offer => 
            offer.id === editingOffer.id ? { ...tempOffer, id: editingOffer.id } : offer
          );
          onOffersChange(updatedOffers);
        } else {
          onOffersChange([...offers, tempOffer]);
        }
        
        toast({
          title: editingOffer ? "Offer updated!" : "Offer added!",
          description: "The offer will be saved when you create the event.",
        });
      } else {
        // For existing events, save to database
        if (editingOffer) {
          const updatedOffer = await updateEventOffer({
            id: editingOffer.id,
            ...formData
          });
          
          const updatedOffers = offers.map(offer => 
            offer.id === updatedOffer.id ? updatedOffer : offer
          );
          onOffersChange(updatedOffers);
          
          toast({
            title: "Offer updated successfully!",
            description: "The offer has been updated.",
          });
        } else {
          const newOffer = await createEventOffer(formData);
          onOffersChange([...offers, newOffer]);
          
          toast({
            title: "Offer created successfully!",
            description: "The new offer has been added to the event.",
          });
        }
      }
      
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save the offer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (offer: EventOffer) => {
    setEditingOffer(offer);
    setFormData({
      event_id: offer.event_id,
      offer_type: offer.offer_type,
      title: offer.title,
      description: offer.description || '',
      price_adjustment: offer.price_adjustment,
      min_quantity: offer.min_quantity,
      max_quantity: offer.max_quantity,
      group_size: offer.group_size,
      conditions: offer.conditions,
      is_active: offer.is_active
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (offerId: string) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      try {
        if (isNewEvent || offerId.startsWith('temp-')) {
          // For new events or temporary offers, just remove from local state
          const updatedOffers = offers.filter(offer => offer.id !== offerId);
          onOffersChange(updatedOffers);
        } else {
          // For existing events, delete from database
          await deleteEventOffer(offerId);
          const updatedOffers = offers.filter(offer => offer.id !== offerId);
          onOffersChange(updatedOffers);
        }
        
        toast({
          title: "Offer deleted successfully!",
          description: "The offer has been removed from the event.",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete the offer. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const getOfferTypeLabel = (type: string) => {
    return OFFER_TYPES.find(t => t.value === type)?.label || type;
  };

  const getPriceDisplay = (offer: EventOffer) => {
    if (offer.offer_type === 'flat_rate') {
      return `₹${offer.price_adjustment}`;
    }
    if (offer.price_adjustment > 0) {
      return `+₹${offer.price_adjustment}`;
    }
    return `-₹${Math.abs(offer.price_adjustment)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Event Offers</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingOffer ? 'Edit Offer' : 'Add New Offer'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick Templates */}
              <div className="space-y-2">
                <Label>Quick Templates</Label>
                <div className="flex flex-wrap gap-2">
                  {OFFER_TEMPLATES.map((template, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        ...template,
                        offer_type: template.offer_type as any
                      }))}
                    >
                      {template.title}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="offer_type">Offer Type</Label>
                  <Select 
                    value={formData.offer_type} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, offer_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select offer type" />
                    </SelectTrigger>
                    <SelectContent>
                      {OFFER_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="title">Offer Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Add +1 Person, Group Discount, etc."
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the offer details..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="price_adjustment">Price Adjustment</Label>
                  <Input
                    id="price_adjustment"
                    type="number"
                    value={formData.price_adjustment}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_adjustment: Number(e.target.value) }))}
                    placeholder="0"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use positive for additional cost, negative for discount
                  </p>
                </div>

                <div>
                  <Label htmlFor="min_quantity">Minimum Quantity</Label>
                  <Input
                    id="min_quantity"
                    type="number"
                    value={formData.min_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_quantity: Number(e.target.value) }))}
                    min="1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="max_quantity">Maximum Quantity (Optional)</Label>
                  <Input
                    id="max_quantity"
                    type="number"
                    value={formData.max_quantity || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      max_quantity: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="group_size">Group Size</Label>
                  <Input
                    id="group_size"
                    type="number"
                    value={formData.group_size}
                    onChange={(e) => setFormData(prev => ({ ...prev, group_size: Number(e.target.value) }))}
                    min="1"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Number of people this offer applies to
                  </p>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingOffer ? "Update Offer" : "Create Offer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {offers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No offers added yet. Click "Add Offer" to create your first offer.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {offers.map((offer) => (
            <Card key={offer.id} className={!offer.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={offer.is_active ? 'default' : 'secondary'}>
                        {getOfferTypeLabel(offer.offer_type)}
                      </Badge>
                      {!offer.is_active && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                    <h4 className="font-medium">{offer.title}</h4>
                    {offer.description && (
                      <p className="text-sm text-muted-foreground">{offer.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium text-green-600">
                        {getPriceDisplay(offer)}
                      </span>
                      <span>Min: {offer.min_quantity}</span>
                      {offer.max_quantity && <span>Max: {offer.max_quantity}</span>}
                      <span>Group: {offer.group_size}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(offer)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(offer.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
