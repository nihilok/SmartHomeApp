import React, {useContext, useEffect, useState} from 'react';
import {Header} from "../Header";
import './baby-tracker.css'
import FetchWithToken from "../../service/FetchService";
import {AuthContext} from "../../contexts/AuthContext";
import NoteModal from "../NoteModal/NoteModal";
import {useInput} from "../../hooks/input-hook";

function correctHour(date) {
  date.setTime(date.getTime() + date.getTimezoneOffset() * 60 * 1000)
  return date
}

function toIsoString(date) {
  let tzo = -date.getTimezoneOffset(),
      dif = tzo >= 0 ? '+' : '-',
      pad = function (num) {
        let norm = Math.floor(Math.abs(num));
        return (norm < 10 ? '0' : '') + norm;
      };

  return date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate()) +
      'T' + pad(date.getHours()) +
      ':' + pad(date.getMinutes())
}

function toReadableString(date) {
  let pad = function (num) {
    let norm = Math.floor(Math.abs(num));
    return (norm < 10 ? '0' : '') + norm;
  };
  date = correctHour(date)
  return date.toLocaleDateString() +
      ', ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
}

function toReadableTimeString(date) {
  let pad = function (num) {
    let norm = Math.floor(Math.abs(num));
    return (norm < 10 ? '0' : '') + norm;
  };
  date = correctHour(date)
  return pad(date.getHours()) +
      ':' + pad(date.getMinutes())
}


const FeedModalContent = ({newFeed, hide}) => {
  const startDefault = toIsoString(new Date())
  const endDefault = toIsoString(new Date(new Date().getTime() + 15 * 60000))
  const {value: startTime, setValue: setStartTime, bind: bindStart, reset: resetStart} = useInput(startDefault);
  const {value: endTime, setValue: setEndTime, bind: bindEnd, reset: resetEnd} = useInput(endDefault);
  const {value: notes, setValue: setNotes, bind: bindNotes, reset: resetNotes} = useInput('');

  function handleSubmit(evt) {
    evt.preventDefault();
    const formData = {
      start_time: startTime,
      end_time: endTime,
      notes: notes
    }
    newFeed(JSON.stringify(formData))
    resetStart()
    resetEnd()
    resetNotes()
    hide()
  }

  return (
      <>
        <form onSubmit={handleSubmit}>
          <div className={'form-control-grid'}><label>Start</label><input type={'datetime-local'}
                                                                          value={startTime} {...bindStart}/></div>
          <div className={'form-control-grid'}><label>End</label><input type={'datetime-local'}
                                                                        value={endTime} {...bindEnd}/></div>
          <div className={'form-control-grid'}><label>Notes</label><textarea value={notes} {...bindNotes}/></div>
          <div className={'form-control'}><input type={'submit'} value={'Save'} className={'btn button btn-outline'}/>
          </div>
        </form>
      </>
  )
}

const ChangeModalContent = ({newChange, hide}) => {
  const timeDefault = toIsoString(new Date())
  const {value: time, setValue: setTime, bind: bindTime, reset: resetTime} = useInput(timeDefault);
  const {value: notes, setValue: setNotes, bind: bindNotes, reset: resetNotes} = useInput('');

  function handleSubmit(evt) {
    evt.preventDefault();
    const formData = {
      timestamp: time,
      notes: notes
    }
    newChange(JSON.stringify(formData))
    resetTime()
    resetNotes()
    hide()
  }

  return (
      <>
        <form onSubmit={handleSubmit}>
          <div className={'form-control-grid'}><label>Time</label><input type={'datetime-local'}
                                                                         value={time} {...bindTime}/></div>
          <div className={'form-control-grid'}><label>Notes</label><textarea value={notes} {...bindNotes}/></div>
          <div className={'form-control'}><input type={'submit'} value={'Save'} className={'btn button btn-outline'}/>
          </div>
        </form>
      </>
  )
}

const BabyTrackerView = () => {

  const {authState} = useContext(AuthContext);
  const [feeds, setFeeds] = useState()
  const [changes, setChanges] = useState()
  const [newRecord, setNewRecord] = useState(null);
  const [returnedEntry, setReturnedEntry] = useState();

  async function getFeeds() {
    await FetchWithToken('/baby/feed/', 'GET', authState, setFeeds)
  }

  async function getChanges() {
    await FetchWithToken('/baby/change/', 'GET', authState, setChanges)
  }

  async function newFeed(feedData) {
    await FetchWithToken('/baby/feed/', 'POST', authState, setFeeds, feedData)
  }

  async function newChange(changeData) {
    await FetchWithToken('/baby/change/', 'POST', authState, setChanges, changeData)
  }

  useEffect(() => {
    getFeeds().catch(error => console.error(error))
    getChanges().catch(error => console.error(error))
  }, [])

  function handleNewFeed() {
    console.log('New Feed')
    setNewRecord('Feed')
  }

  function handleNewChange() {
    console.log('New Change')
    setNewRecord('Change')
  }

  return (
      <div className={'Outer'}>
        <Header text={'Baby Tracker'} back={'/'}/>
        <div className={'BabyTracker-options'}>
          <button className={'btn button btn-outline mx2'} onClick={handleNewFeed}>Add Feed</button>
          <button className={'btn button btn-outline mx2'} onClick={handleNewChange}>Add Change</button>
        </div>
        <div className={'BabyTracker-data'}>
          <div>
            <h1>Feeds</h1>
            <ul>
              {feeds?.map(feed => {
                console.log(feed)
                return <li>{toReadableString(new Date(feed.start_time))} - {toReadableTimeString(new Date(feed.end_time))}</li>
              })}
            </ul>
          </div>
          <div>
            <h1>Changes</h1>
            <ul>
              {changes?.map(change => {
                console.log(change)
                return <li>{toReadableString(new Date(change.timestamp))}</li>

              })}
            </ul>
          </div>
        </div>
        {newRecord && <NoteModal
            title={`New ${newRecord}`}
            renderContent={newRecord === 'Feed' ?
                () => <FeedModalContent
                    newFeed={newFeed}
                    hide={() => setNewRecord(null)}
                /> :
                () => <ChangeModalContent
                    newChange={newChange}
                    hide={() => setNewRecord(null)}
                />}
            setHidden={setNewRecord}
        />}
      </div>
  );
};

export default BabyTrackerView;