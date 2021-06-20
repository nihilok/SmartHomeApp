import React, {useContext, useEffect, useState} from 'react';
import {useInput} from "../../hooks/input-hook";
import PlusButton from "../PlusButton";
import FetchWithToken from "../../service/FetchService";
import {AuthContext} from "../../contexts/AuthContext";

const PlannerComponent = ({week}) => {
      // const [todaysDate, setTodaysDate] = useState(new Date())
      // const [endDate, setEndDate] = useState(new Date(todaysDate.getFullYear(), todaysDate.getMonth(), todaysDate.getDate() + 7))
      const [editing, setEditing] = useState(false)
      const [formOpen, setFormOpen] = useState(false)
      const [weekState, setWeekState] = useState(week)
      const [minMaxDate, setMinMaxDate] = useState({
        // min: todaysDate.getFullYear() + '-' + (todaysDate.getMonth()+1) + '-' + todaysDate.getDate(),
        // max: endDate.getFullYear() + '-' + (todaysDate.getMonth()+1) + '-' + endDate.getDate()
        min: weekState.days[0].date,
        max: weekState.days[6].date
      })
      const {value: plan, setValue: setPlan, bind: bindPlan, reset: resetPlan} = useInput('');
      const {value: date, setValue: setDate, bind: bindDate, reset: resetDate} = useInput('');
      const {authState} = useContext(AuthContext);

      const handleSubmit = (e) => {
        e.preventDefault();
        FetchWithToken(
            `/planner/add-item/${date}/`,
            'POST',
            authState,
            setWeekState,
            JSON.stringify({
              description: plan
            })
        )
        setFormOpen(false);
      }

      const removePlan = (item_date, description) => {
          FetchWithToken(
            `/planner/${item_date}/${description}`,
            'DELETE',
            authState,
            setWeekState
        ).catch(err => console.log(err))
      }

      const renderNewRecipeForm = () => {
        return (
            <div className="Recipe-card">

              <div className="note on-from-bottom">
                <div className="close-button" onClick={() => {
                  setFormOpen(false)
                  resetPlan()
                  resetDate()
                }}>&times;</div>

                <div className="note-top">
                  <div><h1>{editing ? 'Edit ' : 'Add '}Plan..</h1></div>
                  <div/>
                </div>

                <div className="note-bottom">
                  <div className="Recipe-card-content">
                    <form className="New-recipe flex-col-center" onSubmit={handleSubmit}>
                      <div className="form-control"><input type="text" placeholder="Plan" {...bindPlan} required/>
                        <input type="date" {...bindDate} min={minMaxDate.min} max={minMaxDate.max}/></div>
                      <input type="submit" value="Save" className="btn btn-outline"/>
                    </form>
                  </div>
                </div>
              </div>
            </div>
        )
      }

      return (
          <div>
            {weekState ?
                <table>
                  <thead>
                  <tr>
                    <th>Day</th>
                    <th>Plans</th>
                  </tr>
                  </thead>
                  <tbody>

                  {weekState.days.map(day => (
                      <tr key={day.date}>
                        <td>
                          {day.date}
                        </td>
                        <td className="plan-cell">
                          <ul>
                            {day.items.map(item => (
                                <li>{item.description}
                                  <span className="remove-plan" onClick={() => removePlan(day.date, item.description)}>&times;</span>
                                </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
                :
                ''}
            <PlusButton callback={() => setFormOpen(true)}/>
            {formOpen ? renderNewRecipeForm() : ''}
          </div>
      );
    }
;

export default PlannerComponent;