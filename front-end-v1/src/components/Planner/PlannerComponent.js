import React, {useContext, useEffect, useState} from 'react';
import {useInput} from "../../hooks/input-hook";
import PlusButton from "../PlusButton";
import FetchWithToken from "../../service/FetchService";
import {AuthContext} from "../../contexts/AuthContext";
import NoteModal from "../NoteModal/NoteModal";

const PlannerComponent = ({week}) => {
      console.log(week)
      const datePlusDays = (days) => {
        const dateToday = new Date()
        return new Date(dateToday.getFullYear(),
            dateToday.getMonth(),
            dateToday.getDate() + days)
      }

      const dateFormat = (date) => {
        console.log(date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate())
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
      }

      // const [todaysDate, setTodaysDate] = useState(new Date())
      // const [endDate, setEndDate] = useState(new Date(todaysDate.getFullYear(), todaysDate.getMonth(), todaysDate.getDate() + 7))
      const [editing, setEditing] = useState(false)
      const [formOpen, setFormOpen] = useState(false)
      const [weekState, setWeekState] = useState(week)
      const initialState = {
        // min: todaysDate.getFullYear() + '-' + (todaysDate.getMonth()+1) + '-' + todaysDate.getDate(),
        // max: endDate.getFullYear() + '-' + (todaysDate.getMonth()+1) + '-' + endDate.getDate()
        min: Object.keys(weekState.days)[0],
        max: Object.keys(weekState.days)[6]
      }
      const [minMaxDate, setMinMaxDate] = useState(initialState)
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
        const descriptionB64 = btoa(description)
        FetchWithToken(
            `/planner/${item_date}/${descriptionB64}/`,
            'DELETE',
            authState,
            setWeekState
        ).catch(err => console.log(err))
      }

      const renderNewRecipeForm = () => {
        return <NoteModal
            title={editing ? 'Edit Plan..' : 'Add Plan..'}
            renderContent={() => {
              return (
                  <>
                    <div className="Recipe-card-content">
                      <form className="New-recipe flex-col-center" onSubmit={handleSubmit}>
                        <div className="form-control"><input type="text" placeholder="Plan" {...bindPlan}
                                                             required/>
                          <div className="inline-form-control grid-2"><input type="date" {...bindDate}
                                                                             min={minMaxDate.min}
                                                                             max={minMaxDate.max}/><input
                              type="submit" value="Save" className="btn btn-outline" style={{
                            margin: '1rem'
                          }}/></div>
                        </div>

                      </form>
                    </div>
                  </>)
            }}
            setHidden={() => {
              setFormOpen(false)
              resetPlan()
              resetDate()
            }}/>
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
                  {Object.keys(weekState.days).map(date_key => {
                    return (
                        <tr key={date_key}>
                          <td>
                            {weekState.days[date_key].date}
                          </td>
                          <td className="plan-cell">
                            <ul>
                              {weekState.days[date_key].items.map(item => (
                                  <li>{item.description}
                                    <span className="remove-plan"
                                          onClick={() => removePlan(weekState.days[date_key].date, item.description)}>&times;</span>
                                  </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                    )
                  })}
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