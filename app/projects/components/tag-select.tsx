"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { useEffect, useState } from "react"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
  } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"
export const TagSelect = ({tags,selected,related}:{tags:string[],selected:string[],related:"projects"|"blog"}) => {
    const [open, setOpen] = useState(false)
    const [values, setValues] = useState(selected);
    const router = useRouter();
    const searchParams = useSearchParams();
    useEffect(()=>{
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("tags");
        values.forEach((val) => {
            newParams.append("tags", val);
        });
        router.push(`/${related}?${newParams.toString()}`);
    },[values])
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="xs:w-[200px] w-full justify-between"
          >
            {values.length > 0
              ? `${values.length} topic(s) selected`
              : "Filter by topic..."}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search topic..." className="h-9" />
            <CommandList>
              <CommandEmpty>No topic found.</CommandEmpty>
              <CommandGroup>
                {tags.map((tag) => (
                  <CommandItem
                    key={tag}
                    value={tag}
                    onSelect={(currentValue) => {
                        const included = values.includes(currentValue);
                        if(included){
                            setValues((prev) => prev.filter((val) => val !== currentValue));
                            setOpen(false);
                            return;
                        }
                        setValues((prev) => [...prev, currentValue]);
                      setOpen(false)
                    }}
                  >
                    {tag}
                    <Check
                      className={cn(
                        "ml-auto",
                        values.includes(tag) ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
}