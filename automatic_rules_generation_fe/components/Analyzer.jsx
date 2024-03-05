import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAvailableDomains } from '../src/features/domain/domainSlice';
import axios from 'axios';
import { setAnalysis } from '../src/features/analysis/analysisSlice'; 
import { Label } from './ui/label';
import { Button } from './ui/button';
import { AiFillAlert } from "react-icons/ai";
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from './ui/textarea';
import { setSelectedDomain } from '../src/features/domain/domainSlice';



const Analyzer = ({ fetchAvailableDomains }) => {
    const dispatch = useDispatch();
    const availableDomains = useSelector(selectAvailableDomains);
    const firstDomainLabel = availableDomains.length > 0 ? availableDomains[0].label : '';
    const [selectedDomainState, setSelectedDomainState] = useState(firstDomainLabel);
    const [textInput, setTextInput] = useState('');
    const [currentCartridge, setCurrentCartridge] = useState('');

    //combobox states
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")

    useEffect(() => {
      fetchAvailableDomains();
      fetchCurrentCartridge();
    }, []);
  
    const fetchCurrentCartridge = async () => {
      try {
        const response = await axios.get('http://localhost:5000/get_current_cartridge')
        setCurrentCartridge(response.data.cartridge_name)
        dispatch(setSelectedDomain(response.data.cartridge_name))
      } catch (error) {
        console.error(error.response?.data?.error || 'Error analyzing text')
      }
    }

    const handleAnalyze = async () => {
      try {
        const response = await axios.post('http://localhost:5000/analyze_text', {
          selected_domain: selectedDomainState,
          text_input: textInput,
        });
  
        const result = response.data.analysis;
  
        dispatch(setAnalysis(result));
  
      } catch (error) {
        console.error(error.response?.data?.error || 'Error analyzing text');
      }
    };

    const handleSwitchCartridge = async () => {
      try {
        await axios.post('http://localhost:5000/switch_cartridge', {
          selected_domain: selectedDomainState,
        });
        fetchCurrentCartridge();
      } catch (error) {
        console.error(error.response?.data?.error || 'Error switching cartridge');
      }
    };
  
    return (
      <div>
        <div className='grid grid-cols-6 gap-4'>
          <div className='flex align-center items-center col-span-3 '>
            <div className='flex flex-col'>
              <Label>
              Current taxonomy: {currentCartridge}
              </Label>
              <Label>
              Select available taxonomy:
              </Label>
                  
              <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[200px] justify-between"
                >
                {selectedDomainState
                    ? availableDomains.find((domain) => domain.value === selectedDomainState)?.label
                    : firstDomainLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                <CommandInput placeholder="Search available taxonomy..." className="h-9" />
                <CommandEmpty>No framework found.</CommandEmpty>
                <CommandGroup>
                    {availableDomains.map((domain) => (
                    <CommandItem
                        key={domain.value}
                        value={domain.value}
                        onSelect={(currentValue) => {
                        setSelectedDomainState(currentValue === value ? "" : currentValue)
                        setOpen(false)
                        }}
                    >
                        {domain.label}
                        <AiFillAlert
                        className={cn(
                            "ml-auto h-4 w-4",
                            value === domain.value ? "opacity-100" : "opacity-0"
                        )}
                        />
                    </CommandItem>
                    ))}
                </CommandGroup>
                </Command>
              </PopoverContent>
              </Popover>
            </div>

            <Button onClick={handleSwitchCartridge}>Switch Taxonomy</Button>
          </div>

          <div className='col-span-3'>
            <Label>
            Text Input:
            </Label>
            <Textarea
                className=""
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
            />
            <Button onClick={handleAnalyze}>Analyze</Button>
          </div>
        </div>
      </div>
    );
  };
  
  export default Analyzer;
