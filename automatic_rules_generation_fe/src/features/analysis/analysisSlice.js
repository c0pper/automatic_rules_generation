import { createSlice } from '@reduxjs/toolkit';

const analysisSlice = createSlice({
  name: 'analysis',
  initialState: {
    result: {}, 
  },
  reducers: {
    setAnalysis: (state, action) => {
      state.result = action.payload;
    },
  },
});

export const { setAnalysis } = analysisSlice.actions;
export const selectAnalysisResult = (state) => state.analysis.result;
export default analysisSlice.reducer;
