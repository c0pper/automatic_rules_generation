import { createSlice,  } from '@reduxjs/toolkit';


const domainSlice = createSlice({
  name: 'domain',
  initialState: {
    availableDomains: [],
    selectedDomain: ""
  },
  reducers: {
    addDomain: (state, action) => {
      const domainToAdd = action.payload;

      const existingDomainIndex = state.availableDomains.findIndex(d => d.value === domainToAdd.value);

      if (existingDomainIndex === -1) {
        state.availableDomains.push(domainToAdd);
      } else {
        // update the existing domain with the new data
        state.availableDomains[existingDomainIndex] = domainToAdd;
      }
    },
    setSelectedDomain: (state, action) => {
      state.selectedDomain = action.payload
    }
  },
});

export const { addDomain, setSelectedDomain } = domainSlice.actions;
export const selectAvailableDomains = (state) => state.domain.availableDomains;
export const selectSelectedDomain = (state) => state.domain.selectedDomain;
export default domainSlice.reducer;