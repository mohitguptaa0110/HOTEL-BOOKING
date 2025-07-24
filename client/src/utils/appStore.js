import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
const appStore = configureStore({
  reducer: {
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default appStore;
