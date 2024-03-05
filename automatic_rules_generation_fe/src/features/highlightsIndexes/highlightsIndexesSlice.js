import { createSlice } from '@reduxjs/toolkit';

const highlightsIndexesSlice = createSlice({
  name: 'highlightsIndexes',
  initialState: [],
  reducers: {
    setHighlightsIndexes: (state, action) => {
      return action.payload;
    },
  },
});

export const { setHighlightsIndexes } = highlightsIndexesSlice.actions;

export const selectHighlightsIndexes = (state) => state.highlightsIndexes;

export default highlightsIndexesSlice.reducer;
