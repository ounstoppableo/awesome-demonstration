import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, AppThunk } from '../store';
import { removeParticle, setParticle } from '@/utils/particleControl';

type BackgroundEffects = 'grid' | 'wave';

export interface BackgroundEffectsState {
  value: BackgroundEffects;
}

const initialState: BackgroundEffectsState = {
  value: 'wave',
};

export const backgroundEffectsSlice = createSlice({
  name: 'backgroundEffects',
  initialState,
  reducers: {
    setBackgroundEffect(state, action: PayloadAction<BackgroundEffects>) {
      state.value = action.payload;
    },
  },
});

export const backgroundEffectMap: {
  [key in BackgroundEffects]: {
    setBackground: () => any;
    removeBackground: () => any;
  };
} = {
  grid: { setBackground: () => {}, removeBackground: () => {} },
  wave: { setBackground: () => {}, removeBackground: () => {} },
};

export const { setBackgroundEffect } = backgroundEffectsSlice.actions;

export const selectBackgroundEffects = (state: RootState) =>
  state.backgroundEffects.value;

export default backgroundEffectsSlice.reducer;
