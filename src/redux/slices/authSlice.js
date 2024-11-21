import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";

// Create async thunk for login
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password, userType }) => {
    try {
      const response = await axiosInstance.post(`/login/${userType}`, {
        email,
        password,
      });

      // Store token and expiration time in localStorage
      localStorage.setItem("access_token", response.data.token);
      localStorage.setItem("token_expiry", Date.now() + 3600000);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
        })
      );
      localStorage.setItem("userType", userType);

      // The token is now stored in cookies and will be sent with future requests automatically
      return {
        user: {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
        }, // Assuming the backend sends back user info (if needed)
        userType,
        token: response.data.token,
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Invalid credentials");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null, // Retrieve user data from localStorage
    userType: localStorage.getItem("userType") || null, // Retrieve token from localStorage
    token: localStorage.getItem("access_token") || null, // Retrieve token from localStorage
    isAuthenticated: Boolean(localStorage.getItem("access_token")), // Check if token exists
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.userType = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.clear();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.userType = action.payload.userType;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
