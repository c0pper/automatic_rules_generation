import { useSelector, useDispatch } from 'react-redux';
import { selectAnalysisResult } from '@/src/features/analysis/analysisSlice';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { setHighlightsIndexes } from '@/src/features/highlightsIndexes/highlightsIndexesSlice';
import { setSelectedCategory } from '@/src/features/selectedCategory/selectedCategorySlice';

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
          <Label >Analysis Result</Label>  
            <div className="flex flex-col border rounded-md p-2 my-4 items-start">
                {
                    analysisResult.categories.map((item, index) => (
                      <div key={index} className="mr-1 my-0.5">
                        <Button
                            variant="link"
                            className="no-underline"
                            onClick={() => handleClick(item)}
                        >
                            <Badge variant="link">{item.label}</Badge>
                        </Button>
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