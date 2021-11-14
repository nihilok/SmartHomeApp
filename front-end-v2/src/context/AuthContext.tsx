import * as React from "react";

const apiBaseUrl = 'http://localhost:8080'

interface iAuthContext {
  isAuthenticated: boolean;
  token: { access_token: string; type: string };
  apiBaseUrl: string;
}

interface ContextWithReducer {
  context: iAuthContext;
  dispatch: React.Dispatch<Action>;
}

const initialState: iAuthContext = {
  isAuthenticated: false,
  token: JSON.parse(localStorage.getItem("token") as string) || {
    token: "",
    type: "",
  },
  apiBaseUrl: apiBaseUrl,
};

const AuthContext = React.createContext<ContextWithReducer>({
  context: initialState,
  dispatch: () => {},
});

interface iToken {
  access_token: string;
  token_type: string;
}

type Action = { type: "LOGIN"; payload: iToken } | { type: "LOGOUT" };

const reducer = (state: iAuthContext, action: Action) => {
  switch (action.type) {
    case "LOGIN":
      console.debug("Logging in");
      localStorage.setItem("token", JSON.stringify(action.payload));
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload,
      };
    case "LOGOUT":
      console.debug("Logging out");
      localStorage.clear();
      return {
        ...state,
        isAuthenticated: false,
      };
    default:
      return state;
  }
};

export const AuthContextProvider: React.FC = ({ children }) => {
  const [context, dispatch] = React.useReducer(reducer, initialState as never);

  return (
    <AuthContext.Provider value={{ context, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuthContext = () => {
  return React.useContext(AuthContext);
};

export default useAuthContext;
