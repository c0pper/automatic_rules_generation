import { useSelector } from 'react-redux';
import { selectAnalysisResult } from '@/src/features/analysis/analysisSlice';
import { ScrollArea } from './ui/scroll-area';
import { Label } from './ui/label';
import { selectHighlightsIndexes } from '@/src/features/highlightsIndexes/highlightsIndexesSlice';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useState, useEffect } from 'react';
import RulesDisplayDrawer from './RulesDisplayDrawer';

const TextRenderer = () => {
  const analysisResult = useSelector(selectAnalysisResult);
  const highlightsIndexes = useSelector(selectHighlightsIndexes);
 
  const [renderedContent, setRenderedContent] = useState(null);

  
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

      parts.push(
        <Drawer>
        <DrawerTrigger asChild>
          <span className=" bg-[#68c4af] text-white rounded-lg p-0.5 cursor-pointer">
            {highlightedText} 
          </span>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-10 my-10 w-full">
            <DrawerHeader>
              <DrawerTitle>Regole scattate</DrawerTitle>
              <DrawerDescription>Spiegazione della categorizzazione.</DrawerDescription>
            </DrawerHeader>
            <RulesDisplayDrawer textSegmentStartIndex={index.start} />
          </div>
        </DrawerContent>
      </Drawer>
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
  }, [analysisResult, highlightsIndexes, analysisResult.content]);

  return (
    <div>
      {analysisResult ? (
        <div>
          <Label>Text content</Label>
          <ScrollArea className="rounded-md border p-4 h-lvh my-4">
            {renderedContent}
          </ScrollArea>
        </div>
      ) : undefined}
    </div>
  );
};

export default TextRenderer;
