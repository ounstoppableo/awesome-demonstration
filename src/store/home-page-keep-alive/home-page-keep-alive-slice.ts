import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface HomePageKeepAliveState {
  random: boolean;
  randomList: any[];
  lastPage: null | number;
  shouldAddpage: number;
  componetListRaw: any;
  currentCarusalIndex: number;
}

const initialState: HomePageKeepAliveState = {
  random: false,
  randomList: [],
  lastPage: null,
  shouldAddpage: 1,
  componetListRaw: {},
  currentCarusalIndex: 0,
};

export const homePageKeepAliveStateSlice = createSlice({
  name: 'HomePageKeepAliveStateSlice',
  initialState,
  reducers: {
    setRandomInStore: (state, action: PayloadAction<boolean>) => {
      state.random = action.payload;
    },
    setRandomListInStore: (state, action: PayloadAction<any[]>) => {
      state.randomList = action.payload;
    },
    setLastPageInStore: (state, action: PayloadAction<null | number>) => {
      state.lastPage = action.payload;
    },
    setShouldAddpageInStore: (state, action: PayloadAction<number>) => {
      state.shouldAddpage = action.payload;
    },
    setComponetListRawInStore: (state, action: PayloadAction<any>) => {
      state.componetListRaw = action.payload;
    },
    setCurrentCarusalIndexwInStore: (state, action: PayloadAction<number>) => {
      state.currentCarusalIndex = action.payload;
    },
  },
});
export const {
  setRandomInStore,
  setRandomListInStore,
  setLastPageInStore,
  setShouldAddpageInStore,
  setComponetListRawInStore,
  setCurrentCarusalIndexwInStore,
} = homePageKeepAliveStateSlice.actions;

export const selectHomePageKeepAliveRandom = (state: RootState) =>
  state.homePageKeepAlive.random;
export const selectHomePageKeepAliveRandomList = (state: RootState) =>
  state.homePageKeepAlive.randomList;
export const selectHomePageKeepAliveLastPage = (state: RootState) =>
  state.homePageKeepAlive.lastPage;
export const selectHomePageKeepAliveShouldAddpage = (state: RootState) =>
  state.homePageKeepAlive.shouldAddpage;
export const selectHomePageKeepAliveComponetListRaw = (state: RootState) =>
  state.homePageKeepAlive.componetListRaw;
export const selectHomePageKeepAliveCurrentCarusalIndex = (state: RootState) =>
  state.homePageKeepAlive.currentCarusalIndex;

export default homePageKeepAliveStateSlice.reducer;
