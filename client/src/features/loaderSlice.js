import { createSlice } from "@reduxjs/toolkit";

const loaderSlice = createSlice({
  name: "loader",
  initialState: { isLoading: false },
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setLoading } = loaderSlice.actions;
export default loaderSlice.reducer;
