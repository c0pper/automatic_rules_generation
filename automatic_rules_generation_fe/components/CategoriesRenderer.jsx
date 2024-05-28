import { useSelector, useDispatch } from 'react-redux';
import { selectAnalysisResult } from '@/src/features/analysis/analysisSlice';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { setHighlightsIndexes } from '@/src/features/highlightsIndexes/highlightsIndexesSlice';
import { setSelectedCategory } from '@/src/features/selectedCategory/selectedCategorySlice';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const CategoriesRenderer = () => {
    const dispatch = useDispatch()
    const analysisResult = useSelector(selectAnalysisResult);

    const handleClick = (category) => {
        const positions = category.positions; 
        console.log(category)

        dispatch(setSelectedCategory(category.id))
        dispatch(setHighlightsIndexes(positions));
    };


  return (
    <div>
    {
      analysisResult.categories ? (
        <>
          <Label >Categories</Label>  
            <div className="flex flex-col border rounded-md p-2 my-4 items-start max-w-full">
                {
                    analysisResult.categories.map((item, index) => (
                      <div key={index} className="mr-1 my-0.5">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                  variant="link"
                                  className="no-underline w-full text-left"
                                  onClick={() => handleClick(item)}
                              >
                                      <Badge variant="link" className="overflow-hidden whitespace-nowrap text-ellipsis capitalize">{item.id}</Badge>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="flex flex-col items-start capitalize">
                                <p className="text-sm text-muted-foreground">{item.id}</p>
                                <p className="text-sm text-muted-foreground">{item.label}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))
                }
            </div>
        </>
      ) : undefined
    } 
    </div>
  )
}

export default CategoriesRenderer