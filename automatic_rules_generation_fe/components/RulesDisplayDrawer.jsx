import {useState, useEffect} from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { selectSelectedCategory } from '@/src/features/selectedCategory/selectedCategorySlice';
import { selectAnalysisResult } from '@/src/features/analysis/analysisSlice';
import { selectSelectedDomain } from '@/src/features/domain/domainSlice';
import { selectRules, selectRulesError, selectRulesStatus, fetchRules  } from '@/src/features/rules/rulesSlice';

const RulesDisplayDrawer = ({ textSegmentStartIndex}) => {
    const dispatch = useDispatch();

    const selectedCategory = useSelector(selectSelectedCategory);
    const analysisResult = useSelector(selectAnalysisResult);
    const selectedDomain = useSelector(selectSelectedDomain);
    const rulesLabels = useSelector(selectRules);
    const status = useSelector(selectRulesStatus);
    const error = useSelector(selectRulesError);
  
    const fetchRulesData = async (highlightStart) => {
      try {
        await dispatch(fetchRules({ highlightStart, selectedCategory, selectedDomain, analysisResult }));
      } catch (error) {
        console.error('Error fetching rules:', error);
      }
    };
  
    useEffect(() => {
      if (selectedCategory && analysisResult) {
        fetchRulesData(textSegmentStartIndex);
      }
    }, [selectedCategory, analysisResult, selectedDomain, textSegmentStartIndex]);
  
    useEffect(() => {
      // Handle the status or error if needed
      if (status === 'failed') {
        console.error('Failed to fetch rules:', error);
      }
    }, [status, error]);
  
    return (
        <div>
          <div>Regole scattate per il segmento di testo all'indice {textSegmentStartIndex}</div>
          <div className="mt-4 grid grid-cols-12 gap-4">
            {rulesLabels.labels.map((label, index) => (
              <div key={index} className={`col-span-3 p-4 border rounded-md`}>
                <div className="font-bold">Rule Label:</div>
                <div>{label}</div>
                <div className="font-bold mt-2">Rule Text:</div>
                <div className="whitespace-pre-line">{rulesLabels.texts[index]}</div>
              </div>
            ))}
          </div>
        </div>
      );
  };
  
  export default RulesDisplayDrawer;