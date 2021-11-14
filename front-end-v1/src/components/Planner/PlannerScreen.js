import React, {useContext, useEffect, useState} from 'react';
import {Header} from "../Header";
import PlannerComponent from "./PlannerComponent";
import FetchWithToken from "../../service/FetchService";
import {AuthContext} from "../../contexts/AuthContext";
import {useToastContext} from "../../contexts/ToastContext";

const PlannerScreen = () => {

  const [week, setWeek] = useState(null)
  const {toastDispatch} = useToastContext()
  const {authState} = React.useContext(AuthContext);

  const getWeek = async () => {
      await FetchWithToken(
          '/planner/this-week/',
          'GET',
          authState,
          setWeek,
          null,
          toastDispatch
      )
  }

  useEffect(()=>{
    getWeek().catch(err => console.log(err))
  }, [])

  return (
      <>
        <Header text="Planner" back="/" />
        {week ? <PlannerComponent week={week}/> : ''}
      </>
  );
};

export default PlannerScreen;