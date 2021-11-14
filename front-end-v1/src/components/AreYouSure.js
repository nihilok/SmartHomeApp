import React from 'react';

const AreYouSure = ({callback, setShown}) => {
  return (
      <div className="Recipe-card" onClick={()=>setShown(false)}>
        <div className="sure">
          <h1>Are you sure?</h1>
          <button onClick={callback}>Yes</button>
        </div>
      </div>
  );
};

export default AreYouSure;