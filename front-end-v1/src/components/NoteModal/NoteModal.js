import React from 'react';

const NoteModal = ({title, renderContent, setHidden}) => {
  return (
      <div className="Recipe-card">

        <div className="note on-from-bottom">
          <div className="close-button" onClick={() => {
                  setHidden(null)
                }}>&times;</div>
          <div className="note-top">
            <div><h1>{title}</h1></div>
            <div/>
          </div>

          <div className="note-bottom">
              {renderContent()}
          </div>
        </div>
      </div>
  );
};

export default NoteModal;