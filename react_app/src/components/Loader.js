import React from 'react';

const Loader = ({classname='Loader'}) => {
  return (
      <div className={classname}>
        <div className="lds-ring">
          <div/>
          <div/>
          <div/>
          <div/>
        </div>
      </div>
  );
};

export default Loader;