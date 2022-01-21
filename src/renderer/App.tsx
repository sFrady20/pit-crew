import React from 'react';
import Router from './components/Router';

const App = () => {
  return (
    <div className="fixed left-0 top-0 w-full h-full flex flex-col justify-center items-center">
      <Router />
    </div>
  );
};

export default App;
