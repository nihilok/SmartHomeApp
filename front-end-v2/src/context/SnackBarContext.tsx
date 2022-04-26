import * as React from "react";
import SnackStack from "./SnackStack/SnackStack";
import {ISnackStack, SnackBoxOptions} from "./SnackStack/types";

interface Context {
  snackStack: ISnackStack;
}

const initialState: Context = {
  snackStack: [],
};

interface ContextWithReducer {
  context: Context;
  dispatch: React.Dispatch<any>;
}

const SnackBarContext = React.createContext<ContextWithReducer>({
  context: initialState,
  dispatch: () => {},
});

type Action =
  | {
      msg: string;
      options: SnackBoxOptions;
    }
  | string
  | 0;

const reducer = (state: Context, action: Action) => {
  const ref = React.createRef<HTMLDivElement>();
  switch (true) {
    case typeof action === "string":
      console.log(action);
      const arr1 = [...state.snackStack];
      arr1.push({
        ref,
        msg: action as string,
      });
      return { ...state, snackStack: arr1 };
    case action === 0:
      state.snackStack.shift();
      const arr2 = [...state.snackStack];
      arr2.shift();
      return {
        ...state,
        snackStack: arr2,
      };
  }
};

export const SnackBarProvider = ({
  children,
}: React.PropsWithChildren<any>) => {
  const [context, dispatch] = React.useReducer(reducer, initialState as never);

  const { snackStack } = context as Context;

  React.useEffect(() => {
    if (snackStack.length > 0) {
      setTimeout(() => snackStack.shift(), 2000);
    }
  }, [snackStack]);

  return (
    <SnackBarContext.Provider value={{ context, dispatch }}>
      {children}
      <SnackStack />
    </SnackBarContext.Provider>
  );
};

export const useSnackBarContext = () => React.useContext(SnackBarContext);
