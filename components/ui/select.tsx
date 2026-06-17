"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

interface SelectValueProps {
  placeholder?: string;
}

function Select({ value, onValueChange, children, className }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const items: Array<{ value: string; label: React.ReactNode }> = [];
  const traverse = (node: React.ReactNode) => {
    React.Children.forEach(node, (child) => {
      if (React.isValidElement<{ value?: string; children?: React.ReactNode }>(child)) {
        if (child.type === SelectItem) {
          items.push({
            value: child.props.value ?? "",
            label: child.props.children,
          });
        }
        if (child.props.children) {
          traverse(child.props.children);
        }
      }
    });
  };
  traverse(children);

  const selectedLabel = items.find((item) => item.value === value)?.label;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <span className={cn(!selectedLabel && "text-slate-500")}>
          {(selectedLabel as string) || "Select..."}
        </span>
        <svg className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-elevated py-1 shadow-xl">
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                onValueChange?.(item.value);
                setOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 text-left text-sm transition-colors",
                value === item.value
                  ? "bg-brand/10 text-brand-glow"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectItem({ value, children }: SelectItemProps) {
  // This is a marker component - value and label are extracted by parent
  return null;
}

function SelectTrigger({ children, ...props }: SelectTriggerProps) {
  return <>{children}</>;
}

function SelectValue({ placeholder }: SelectValueProps) {
  return <>{placeholder}</>;
}

function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
