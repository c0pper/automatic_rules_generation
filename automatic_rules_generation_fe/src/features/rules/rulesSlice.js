import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Assuming you have axios imported and configured

const initialState = {
  rules: {
    labels: [],
    texts: [],
  },
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

// Create an asynchronous thunk to fetch rules
export const fetchRules = createAsyncThunk('rules/fetchRules', async ({ highlightStart, selectedCategory, selectedDomain , analysisResult}) => {
  const categorization = analysisResult.extraData[selectedCategory].categorization;
  const rulesForSelectedCategory = categorization.rules;

  const filteredRules = rulesForSelectedCategory.filter((rule) => {
    return rule.scope.some((scope) => {
      return highlightStart >= scope.begin && highlightStart <= scope.end;
    });
  });

  const ruleLabels = filteredRules.map((rule) => rule.label);

  if (ruleLabels.length > 0) {
    try {
      const response = await axios.post('http://localhost:5000/get_rules', {
        selectedDomain: selectedDomain,
        selectedCategory: selectedCategory,
        ruleLabels: ruleLabels,
      });

      const result = response.data;
      return { labels: ruleLabels, texts: result.rules };
    } catch (error) {
      console.error(error.response?.data?.error || 'Error analyzing text');
      throw error; // Let the promise be rejected so that Redux Toolkit handles the 'rejected' state
    }
  } else {
    return { labels: [], texts: [] };
  }
});

const rulesSlice = createSlice({
  name: 'rules',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRules.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRules.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.rules.labels = action.payload.labels;
        state.rules.texts = action.payload.texts;
      })
      .addCase(fetchRules.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const selectRules = (state) => state.rules.rules;
export const selectRulesStatus = (state) => state.rules.status;
export const selectRulesError = (state) => state.rules.error;

export default rulesSlice.reducer;