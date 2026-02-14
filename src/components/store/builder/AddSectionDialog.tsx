"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Layout, ShoppingBag, Type, Image as ImageIcon, Star } from "lucide-react";
import { ComponentType, COMPONENT_DEFAULTS } from "@/lib/store-builder/types";

interface AddSectionDialogProps {
    onAdd: (type: ComponentType) => void;
    children: React.ReactNode;
}

export function AddSectionDialog({ onAdd, children }: AddSectionDialogProps) {
    const sections = [
        { type: 'Hero', label: 'Hero Banner', icon: ImageIcon, description: 'Large banner with text and button' },
        { type: 'ProductGrid', label: 'Product Grid', icon: ShoppingBag, description: 'Display a collection of products' },
        { type: 'Features', label: 'Features List', icon: Star, description: 'Showcase store features or benefits' },
        { type: 'RichText', label: 'Rich Text', icon: Type, description: 'Add custom text content' },
    ];

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add New Section</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    {sections.map((section) => (
                        <Card
                            key={section.type}
                            className="cursor-pointer hover:border-primary hover:bg-slate-50 transition-all"
                            onClick={() => onAdd(section.type as ComponentType)}
                        >
                            <CardContent className="flex items-center p-6 gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <section.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{section.label}</h3>
                                    <p className="text-sm text-muted-foreground">{section.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
