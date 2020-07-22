import React from "react";
import { Redirect } from "react-router-dom";
import { APPLICATIONS_URL, USER_AUTH_URL } from "constants/routes";

export const App = () => {
  return <Redirect to={USER_AUTH_URL} />;
};

export default App;
