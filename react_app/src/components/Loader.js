import React from 'react';

export const RippleLoader = ({classname='Loader'}) => {
  return (
      <div className={classname}>
        <div className="lds-ripple">
          <div/>
          <div/>
        </div>
      </div>
  )
}

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