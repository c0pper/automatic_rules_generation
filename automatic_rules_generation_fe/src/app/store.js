import { configureStore } from '@reduxjs/toolkit'
import domainReducer from '../features/domain/domainSlice'
import analysisReducer from '../features/analysis/analysisSlice'
import highlightsIndexesReducer from '../features/highlightsIndexes/highlightsIndexesSlice';
import selectedCategoryReducer from '../features/selectedCategory/selectedCategorySlice';

export const store = configureStore({
  reducer: {
    domain: domainReducer,
    analysis: analysisReducer,
    highlightsIndexes: highlightsIndexesReducer,
    selectedCategory: selectedCategoryReducer,
  },
})