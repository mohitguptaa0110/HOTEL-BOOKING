import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isOwner: false,
  searchedCities: [],
  showHotelReg: false,
};
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setIsOwner: (state, action) => {
      state.isOwner = action.payload;
    },
    setSearchedCities: (state, action) => {
      state.searchedCities = action.payload;
    },
    setShowHotelReg: (state, action) => {
      state.showHotelReg = action.payload;
    },
  },
});

export const {setUser, setIsOwner, setSearchedCities, setShowHotelReg} = userSlice.actions;
export default userSlice.reducer;