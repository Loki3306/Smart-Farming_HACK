import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// List of crops the model is trained on
const TRAINED_CROPS = [
  "Apple",
  "Banana",
  "Blackgram",
  "Chickpea",
  "Coconut",
  "Coffee",
  "Cotton",
  "Grapes",
  "Jute",
  "Kidneybeans",
  "Lentil",
  "Maize",
  "Mango",
  "Mothbeans",
  "Mungbean",
  "Muskmelon",
  "Orange",
  "Papaya",
  "Pigeonpeas",
  "Pomegranate",
  "Rice",
  "Watermelon",
];

interface CropSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CropSelector({ value, onChange, disabled }: CropSelectorProps) {
  const [open, setOpen] = useState(false);
  const [isOther, setIsOther] = useState(false);
  const [customCrop, setCustomCrop] = useState('');

  // Check if current value is in trained crops
  useEffect(() => {
    const normalizedValue = value.toLowerCase().trim();
    const isTrainedCrop = TRAINED_CROPS.some(
      crop => crop.toLowerCase() === normalizedValue
    );
    
    if (!isTrainedCrop && value) {
      setIsOther(true);
      setCustomCrop(value);
    } else {
      setIsOther(false);
      setCustomCrop('');
    }
  }, [value]);

  const handleSelectCrop = (selectedCrop: string) => {
    if (selectedCrop === 'other') {
      setIsOther(true);
      setCustomCrop('');
      onChange('');
    } else {
      setIsOther(false);
      setCustomCrop('');
      onChange(selectedCrop);
    }
    setOpen(false);
  };

  const handleCustomCropChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const customValue = e.target.value;
    setCustomCrop(customValue);
    onChange(customValue);
  };

  // Get display value
  const getDisplayValue = () => {
    if (isOther) {
      return 'Other (Custom Crop)';
    }
    if (value) {
      // Find matching crop with proper capitalization
      const matchingCrop = TRAINED_CROPS.find(
        crop => crop.toLowerCase() === value.toLowerCase()
      );
      return matchingCrop || value;
    }
    return 'Select crop...';
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between"
          >
            {getDisplayValue()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search crop..." />
            <CommandList>
              <CommandEmpty>No crop found.</CommandEmpty>
              <CommandGroup heading="Model-Trained Crops">
                {TRAINED_CROPS.map((crop) => (
                  <CommandItem
                    key={crop}
                    value={crop}
                    onSelect={() => handleSelectCrop(crop)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value.toLowerCase() === crop.toLowerCase() && !isOther
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    {crop}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Other Options">
                <CommandItem
                  value="other"
                  onSelect={() => handleSelectCrop('other')}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      isOther ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  Other (Custom Crop)
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {isOther && (
        <div className="space-y-1">
          <Input
            type="text"
            value={customCrop}
            onChange={handleCustomCropChange}
            placeholder="Enter custom crop name..."
            disabled={disabled}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            ⚠️ Custom crops will receive general recommendations only
          </p>
        </div>
      )}
    </div>
  );
}
