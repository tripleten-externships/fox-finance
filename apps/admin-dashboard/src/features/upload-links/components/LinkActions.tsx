import { useState } from "react";
import {
    Button,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    toast,
} from "@fox-finance/ui";
import { FaToggleOn, FaToggleOff, FaSpinner } from "react-icons/fa";
import { apiClient } from "../../../lib/api";

interface LinkActionsProps {
    id: string;
    isActive: boolean;
    expiresAt: string;
    updatedAt: string;
    onLinkUpdated: () => void;
}



export const LinkActions: React.FC<LinkActionsProps> = ({
    id,
    isActive,
    expiresAt,
    updatedAt,
    onLinkUpdated,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [optimisticActive, setOptimisticActive] = useState(isActive);

    const isExpired = new Date(expiresAt) < new Date();
    const canToggle = !isExpired && !isLoading;

    const handleActivate = () => {
        console.log("Activate link:", id);
    
        // Optimistic update - flip the toggle immediately
        setOptimisticActive(true);
        setIsLoading(true);
        
        // TODO: Implement API call
        // On success: keep optimistic state
        // On error: rollback to original state
    };

    const handleDeactivate = () => {
        console.log("Deactivate link:", id);
        // Optimistic update - flip the toggle immediately
        setOptimisticActive(false);
        setIsLoading(true);
        setIsDialogOpen(false);
        
        // TODO: Implement API call
        // On success: keep optimistic state
        // On error: rollback to original state

    };
    
    return (
        <div>
            <Button
                variant="ghost"
                disabled={!canToggle}
                size="icon"
                onClick={() => {
                    if (!canToggle) return;

                    if (optimisticActive) {
                        setIsDialogOpen(true);
                    } else {
                        handleActivate();
                    }
                }}
            >
                {isLoading ? (
                    <FaSpinner className="w-4 h-4 animate-spin" />
                ) : optimisticActive ? (
                    <FaToggleOn />
                ) : (
                    <FaToggleOff />
                )}
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deactivate Upload Link?</DialogTitle>
                        <DialogDescription>
                            This will prevent clients from using this link to upload documents.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeactivate}>
                            Deactivate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default LinkActions;