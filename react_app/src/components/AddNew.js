import React from 'react';


export const AddNewItem = ({handleSubmit, newItem, setNewItem}) => {
    return (
        <form onSubmit={handleSubmit} className="centerCol w-full">
            <input type="text"
                   className="w-5/6 rounded-2xl mt-10 py-1 px-3 text-center outline-none shadow-md inner-shadow border border-gray-400"
                   onChange={e => setNewItem(e.target.value)}
                   value={newItem}/>
            <button type="submit"
                    className="plusBtn mt-2 outline-none focus:outline-none">
                +
            </button>
        </form>
    );
};
