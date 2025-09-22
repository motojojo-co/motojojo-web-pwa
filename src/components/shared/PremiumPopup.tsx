import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

const PremiumPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    // Show popup after 50 seconds
    const timeout = setTimeout(() => {
      setIsOpen(true);
    }, 50000);
    
    return () => clearTimeout(timeout);
  }, []);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md border-violet/20">
        <DialogHeader>
          <DialogTitle className="flex items-center text-gradient text-2xl">
            Explore Motojojo Premium
          </DialogTitle>
          <DialogDescription>
            Unlock exclusive benefits and enhance your event experience
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="flex">
            <div className="mr-3 text-yellow">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium">1 Free Event Every Month</h4>
              <p className="text-sm text-muted-foreground">
                Get a complimentary ticket to selected events each month
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="mr-3 text-yellow">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium">Exclusive Discounts</h4>
              <p className="text-sm text-muted-foreground">
                Up to 25% off on all paid events across the platform
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="mr-3 text-yellow">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium">Priority Access</h4>
              <p className="text-sm text-muted-foreground">
                Book tickets before they're available to the public
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="w-full sm:w-auto"
          >
            Not Now
          </Button>
          <Button 
            className="w-full sm:w-auto bg-gradient-to-r from-violet to-red"
            onClick={() => {
              setIsOpen(false);
              window.location.href = "/pricing#plans";
            }}
          >
            Get Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumPopup;
