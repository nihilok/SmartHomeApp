import * as React from "react";

const apiBaseUrl = "http://localhost:8080";

interface iToken {
  access_token: string;
  token_type: string;
}

interface iAuthContext {
  apiBaseUrl: string;
  isAuthenticated: boolean;
  token: iToken;
}

interface ContextWithReducer {
  context: iAuthContext;
  dispatch: React.Dispatch<Action>;
}

const initialState: iAuthContext = {
  isAuthenticated: false,
  token: JSON.parse(localStorage.getItem("token") as string) || {
    access_token: "",
    token_type: "",
  },
  apiBaseUrl: apiBaseUrl,
};

const AuthContext = React.createContext<ContextWithReducer>({
  context: initialState,
  dispatch: () => {},
});

export const LOGIN = "LOGIN";
export const LOGOUT = "LOGOUT";

type Action = { type: typeof LOGIN; payload: iToken } | { type: typeof LOGOUT };

const reducer = (state: iAuthContext, action: Action) => {
  switch (action.type) {
    case LOGIN:
      console.debug("Logging in");
      localStorage.setItem("token", JSON.stringify(action.payload));
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload,
      };
    case LOGOUT:
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

export default function useAuthContext() {
  return React.useContext(AuthContext);
}
