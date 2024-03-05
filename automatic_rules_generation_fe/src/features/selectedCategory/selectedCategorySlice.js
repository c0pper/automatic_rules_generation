import { createSlice } from '@reduxjs/toolkit';

const selectedCategorySlice = createSlice({
  name: 'selectedCategory',
  initialState: "",
  reducers: {
    setSelectedCategory: (state, action) => {
      return action.payload;
    },
  },
});

export const { setSelectedCategory } = selectedCategorySlice.actions;

export const selectSelectedCategory = (state) => state.selectedCategory;

export default selectedCategorySlice.reducer;
