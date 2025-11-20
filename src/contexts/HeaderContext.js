import React, { createContext, useState, useContext } from 'react';

const HeaderContext = createContext();

export const useHeader = () => useContext(HeaderContext);

export const HeaderProvider = ({ children }) => {
  const [title, setTitle] = useState('');
  const [customContent, setCustomContent] = useState(null);

  return (
    <HeaderContext.Provider value={{ title, setTitle, customContent, setCustomContent }}>
      {children}
    </HeaderContext.Provider>
  );
};

