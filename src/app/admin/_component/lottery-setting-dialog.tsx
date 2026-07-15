"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings } from "lucide-react";
import { useState } from "react";

export default function LotterySettingDialog() {
    const [open, setOpen] = useState(false)
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-8 h-8">
                    <Settings />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Setting</DialogTitle>
                    <DialogDescription>Setting for how lottery show on page</DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}