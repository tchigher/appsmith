import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const getCurrentUser = (payload: { path?: string }) => ({
  type: ReduxActionTypes.FETCH_USER_INIT,
  payload,
});

export const formLoginInit = () => ({
  type: ReduxActionTypes.FORM_LOGIN_INIT,
});
