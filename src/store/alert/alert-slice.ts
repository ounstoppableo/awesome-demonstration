import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface alertState {
  value: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  msg: string;
}

const initialState: alertState = {
  value: false,
  msg: '',
  type: 'success',
};

export const alertSlice = createSlice({
  name: 'backgroundEffects',
  initialState,
  reducers: {
    setAlert(state, action: PayloadAction<Pick<alertState, 'value' | 'type'>>) {
      state.value = action.payload.value;
      state.type = action.payload.type;
    },
    setAlertMsg(state, action: PayloadAction<string>) {
      state.msg = action.payload;
    },
  },
});

export const { setAlert, setAlertMsg } = alertSlice.actions;

export const selectAlert = (state: RootState) => state.alert.value;

export const selectAlertType = (state: RootState) => state.alert.type;

export const selectAlertMsg = (state: RootState) => state.alert.msg;

export default alertSlice.reducer;
