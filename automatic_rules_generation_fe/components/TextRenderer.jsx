import { useSelector } from 'react-redux';
import { selectAnalysisResult } from '@/src/features/analysis/analysisSlice';
import { ScrollArea } from './ui/scroll-area';
import { Label } from './ui/label';
import { selectHighlightsIndexes } from '@/src/features/highlightsIndexes/highlightsIndexesSlice';
import { selectSelectedCategory } from '@/src/features/selectedCategory/selectedCategorySlice';
import { selectSelectedDomain } from '@/src/features/domain/domainSlice';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import axios from 'axios';
import { useState, useEffect } from 'react';

const TextRenderer = () => {
  const analysisResult = useSelector(selectAnalysisResult);
  const highlightsIndexes = useSelector(selectHighlightsIndexes);
  const selectedCategory = useSelector(selectSelectedCategory);
  const selectedDomain = useSelector(selectSelectedDomain);

  
  const [renderedContent, setRenderedContent] = useState(null);


  const getRulesLabels = (highlightStart) => {
    // Check if selectedCategory is defined
    if (!selectedCategory) {
      return [];
    }

    const categorization = analysisResult.extraData[selectedCategory].categorization;
    const rulesForSelectedCategory = categorization.rules;

    // Filter rules based on the conditions
    const filteredRules = rulesForSelectedCategory.filter((rule) => {
      // Check if highlightsIndexes.start + 1 falls between any of the scope operands begin and end values
      return rule.scope.some((scope) => {
        return highlightStart >= scope.begin && highlightStart <= scope.end;
      });
    });

    // Extract labels from the filtered rules
    const ruleLabels = filteredRules.map((rule) => rule.label);

    return ruleLabels;
  }

  const fetchRules = async (highlightStart) => {
    const ruleLabels = await getRulesLabels(highlightStart);
  
    if (ruleLabels.length > 0) {
      try {
        const response = await axios.post('http://localhost:5000/get_rules', {
          selectedDomain: selectedDomain,
          selectedCategory: selectedCategory,
          ruleLabels: ruleLabels,
        });
  
        const result = response.data;
        return result
      } catch (error) {
        console.error(error.response?.data?.error || 'Error analyzing text');
      }
    } else {
      return [];
    }
  };

  const renderTextWithHighlights = async () => {
    if (!highlightsIndexes || highlightsIndexes.length === 0) {
      return analysisResult.content; 
    }

    const parts = [];

    // Sort the highlightIndexes by start index
    const sortedIndexes = [...highlightsIndexes].sort((a, b) => a.start - b.start);


    // Iterate through the sortedIndexes and create parts of the text
    for (const [i, index] of sortedIndexes.entries()) {
      // Add the text between the current and previous indexes
      if (i === 0) {
        parts.push(analysisResult.content.slice(0, index.start));
      } else {
        parts.push(analysisResult.content.slice(sortedIndexes[i - 1].end + 1, index.start));
      }

      // Add the highlighted text
      const highlightedText = analysisResult.content.slice(index.start, index.end + 1);
      const rulePromises = fetchRules(index.start)
      const resolvedRules = await rulePromises;
      const rules = resolvedRules.rules;
      console.log("rulePromises", rulePromises)
      console.log("rules", rules)
      
      parts.push(
        <HoverCard>
          <HoverCardTrigger asChild>
            <span className=" bg-[#68c4af] text-white rounded-lg p-0.5 cursor-pointer">
                {highlightedText} 
            </span>
          </HoverCardTrigger>
          <HoverCardContent className="">
            <h4 className="text-sm font-semibold">Regole scattate</h4>
            <p className="text-sm">
              {rules.map((rule, i) => (
                <span key={i}>{rule} </span>
              ))}
            </p>
          </HoverCardContent>
        </HoverCard>
      );

      // Add the remaining text if it's the last index
      if (i === sortedIndexes.length - 1) {
        parts.push(analysisResult.content.slice(index.end + 1));
      }
    }

    return parts;
  };

  useEffect(() => {
    const renderContent = async () => {
      if (!highlightsIndexes || highlightsIndexes.length === 0) {
        setRenderedContent(analysisResult.content);
        return;
      }

      const parts = await renderTextWithHighlights();
      setRenderedContent(parts);
    };

    renderContent();
  }, [highlightsIndexes, analysisResult]);

  return (
    <div>
      {analysisResult ? (
        <div>
          <Label>Text content</Label>
          <ScrollArea className="rounded-md border p-4 h-full my-4">
            {renderedContent}
          </ScrollArea>
        </div>
      ) : undefined}
    </div>
  );
};



//   return (
//     <div>
//       {analysisResult ? (
//         <div>
//           <Label>Text content</Label>
//           <ScrollArea className="rounded-md border p-4 h-full my-4">
//           {renderTextWithHighlights()}
//           </ScrollArea>
//         </div>
//       ) : undefined}
//     </div>
//   );
// };




// useEffect(() => {
//   const renderContent = async () => {
//     if (!highlightsIndexes || highlightsIndexes.length === 0) {
//       setRenderedContent(analysisResult.content);
//       return;
//     }

//     const parts = [];
//     const rulePromises = [];

//     // Sort the highlightIndexes by start index
//     const sortedIndexes = [...highlightsIndexes].sort((a, b) => a.start - b.start);

//     // Iterate through the sortedIndexes and create parts of the text
//     for (const [i, index] of sortedIndexes.entries()) {
//       // Add the text between the current and previous indexes
//       if (i === 0) {
//         parts.push(analysisResult.content.slice(0, index.start));
//       } else {
//         parts.push(analysisResult.content.slice(sortedIndexes[i - 1].end + 1, index.start));
//       }

//       // Add the highlighted text
//       const highlightedText = analysisResult.content.slice(index.start, index.end + 1);
//       rulePromises.push(fetchRules(index.start));
//     }

//     // Wait for all rulePromises to resolve
//     const rulesArray = await Promise.allSettled(rulePromises);

//     // Iterate through the sortedIndexes again and create parts of the text
//     for (let i = 0; i < sortedIndexes.length; i++) {
//       const index = sortedIndexes[i];
//       const highlightedText = analysisResult.content.slice(index.start, index.end + 1);
//       const rules = rulesArray[i];

//       if (rules.status === 'fulfilled') {
//         const fulfilledRules = rules.value.rules;
//         console.log("fulfilledRules", fulfilledRules)

//         parts.push(
//           <HoverCard key={i}>
//             <HoverCardTrigger asChild>
//               <span className="bg-[#68c4af] text-white rounded-lg p-0.5 cursor-pointer">
//                 {highlightedText}
//               </span>
//             </HoverCardTrigger>
//             <HoverCardContent className="">
//               <div className="flex justify-between space-x-4">
//                 <div className="space-y-1">
//                   <h4 className="text-sm font-semibold">@nextjs</h4>
//                   <p className="text-sm">
//                     {fulfilledRules.map((rule, j) => (
//                       <span key={j}>{rule} </span>
//                     ))}
//                   </p>
//                 </div>
//               </div>
//             </HoverCardContent>
//           </HoverCard>
//         );
//       } else {
//         // Handle the case where the promise was rejected or is still pending
//         parts.push(
//           <span key={i}>
//             Placeholder content while loading...
//           </span>
//         );
//       }

//       // Add the remaining text if it's the last index
//       if (i === sortedIndexes.length - 1) {
//         parts.push(analysisResult.content.slice(index.end + 1));
//       }
//     }

//     // Update the component state with the final content
//     setRenderedContent(parts);
//   };

//   // Call the rendering function
//   renderContent();
// }, [highlightsIndexes, analysisResult]);

// return (
//   <div>
//     {analysisResult ? (
//       <div>
//         <Label>Text content</Label>
//         <ScrollArea className="rounded-md border p-4 h-full my-4">
//           {renderedContent}
//         </ScrollArea>
//       </div>
//     ) : undefined}
//   </div>
// );
// };

export default TextRenderer;
