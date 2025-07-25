import { createSlice } from "@reduxjs/toolkit";

const roomSlice = createSlice({
  name: "room",
  initialState: [],
  reducers: {
    addRoom: (state, action) => {
      return action.payload;
    },
  },
});

export const {addRoom} = roomSlice.actions
export default roomSlice.reducer