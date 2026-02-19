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
import { FaToggleOn, FaToggleOff } from "react-icons/fa";
import { apiClient } from "../../../lib/api";

interface LinkActionsProps {
    id: string;
    isActive: boolean;
    expiresAt: string;
    updatedAt: string;
    onLinkUpdated: () => void;
}



