import './App.css'
import Generate from '../components/Generate'
import Analyzer from '../components/Analyzer'
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { addDomain } from '../src/features/domain/domainSlice';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import TextRenderer from '@/components/TextRenderer';
import CategoriesRenderer from '@/components/CategoriesRenderer';


function App() {
  const dispatch = useDispatch();

  const fetchAvailableDomains = async () => {
    try {
      const response = await axios.get('http://localhost:5000/get_available_domains');
      const domains = response.data.available_domains;

      domains.forEach((domain) => dispatch(addDomain(domain))); 
    } catch (error) {
      console.error('Error fetching available domains:', error.message);
    }
  };

  useEffect(() => {
    fetchAvailableDomains();
  }, []);

  return (
    <>
      <Tabs defaultValue="generation" className="">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generation">Generation</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="generation">
          <Generate fetchAvailableDomains={fetchAvailableDomains}/>
        </TabsContent>
        <TabsContent value="analysis">
          <div>
            <Analyzer  fetchAvailableDomains={fetchAvailableDomains}/>
          </div>
          <div className='grid grid-cols-8 gap-4'>
            <div className='col-span-6'>
              <TextRenderer />
            </div>
            <div className='col-span-2 flex justify-center'>
              <CategoriesRenderer />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}

export default App
