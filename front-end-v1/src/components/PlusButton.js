import React from 'react';

const PlusButton = ({callback}) => {
  return (
      <button onClick={callback}
      className="Plus-button">
        +
      </button>
  );
};

export default PlusButton;